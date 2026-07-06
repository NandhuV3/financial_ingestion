import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  PLATFORM_REGISTRY_PIPELINE_VERSION,
  PLATFORM_REGISTRY_SCHEMA_VERSION,
} from "../../contracts/governance/registry-evolution-contract.js";
import { ArtifactService, calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import {
  ConfigurationError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import {
  DEMO_ARTIFACTS_DIRECTORY,
} from "../../builders/upstream-pipeline/demo-output-paths.js";
import { MemoryArtifactRepository } from "../../builders/upstream-pipeline/memory-artifact-repository.js";
import { stableHash } from "../shared/hashing/stable-hash.js";
import { createLogger } from "../shared/logger.js";
import { PlatformRegistryEvolution } from "./executor.js";

const logger = createLogger("platform-registry-evolution-runner");

const DEFAULT_BOOTSTRAP_REGISTRY_PATH = "data/registry/topics.json";
const BOOTSTRAP_REGISTRY_GENERATED_AT = "2026-06-19T00:00:00.000Z";

export type PlatformRegistryEvolutionRunnerArguments = {
  governanceDecisionsPath: string;
  currentRegistryPath?: string;
  bootstrapRegistryPath: string;
  outputPath: string;
  generatedAt?: string;
  generationDurationMs: number;
  debug: boolean;
};

type LegacyTopicRegistryFile = {
  version: string;
  topics: Array<{
    topic_id: string;
    topic_name: string;
    description: string;
    theme_variants: string[];
  }>;
};

export async function runPlatformRegistryEvolution(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const decisions = sortGovernanceDecisionArtifacts(
    await loadGovernanceDecisionArtifacts(args.governanceDecisionsPath),
  );
  const repository = new MemoryArtifactRepository();
  const artifactService = new ArtifactService(repository);
  const currentRegistry = args.currentRegistryPath === undefined
    ? await createBootstrapRegistryArtifact(
      args.bootstrapRegistryPath,
      artifactService,
    )
    : await loadCurrentRegistryArtifact(args.currentRegistryPath);

  if (args.currentRegistryPath !== undefined) {
    await repository.create(currentRegistry);
  }

  const approvedRegistryMutationCount = decisions.filter((decision) =>
    decision.content.decision_outcome === "approved"
      && decision.content.registry_impact !== "no_registry_change"
      && decision.content.approved_registry_change.mutation_type
        !== "no_registry_mutation").length;
  const generatedAt = args.generatedAt ?? generatedAtFromInputs(
    currentRegistry,
    decisions,
  );

  logger.info("Platform Registry Evolution runner started.", {
    current_registry_version: currentRegistry.content.registry_version,
    governance_decision_count: decisions.length,
    approved_registry_mutation_count: approvedRegistryMutationCount,
    output_path: args.outputPath,
  });

  const artifact = await new PlatformRegistryEvolution().evolveArtifact(
    {
      current_registry: currentRegistry,
      governance_decisions: decisions,
      execution_id:
        `platform:registry-evolution:${currentRegistry.content.registry_version}:${stableHash(decisions.map((decision) => decision.content.governance_decision_id))}`,
    },
    artifactService,
    {
      generatedAt,
      generationDurationMs: args.generationDurationMs,
    },
  );

  await writeJson(args.outputPath, artifact);

  logger.info("Platform Registry Evolution runner completed.", {
    current_registry_version: currentRegistry.content.registry_version,
    resulting_registry_version: artifact.content.registry_version,
    governance_decision_count: decisions.length,
    approved_registry_mutation_count: approvedRegistryMutationCount,
    output_path: resolve(args.outputPath),
  });
}

export function parseArguments(
  args: string[],
): PlatformRegistryEvolutionRunnerArguments {
  let governanceDecisionsPath =
    `${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json`;
  let currentRegistryPath: string | undefined;
  let bootstrapRegistryPath = DEFAULT_BOOTSTRAP_REGISTRY_PATH;
  let outputPath = `${DEMO_ARTIFACTS_DIRECTORY}/09-platform-registry.json`;
  let generatedAt: string | undefined;
  let generationDurationMs = 0;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--governance-decisions" && value) {
      governanceDecisionsPath = value;
      index += 1;
      continue;
    }

    if (argument === "--current-registry" && value) {
      currentRegistryPath = value;
      index += 1;
      continue;
    }

    if (argument === "--bootstrap-registry" && value) {
      bootstrapRegistryPath = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputPath = value;
      index += 1;
      continue;
    }

    if (argument === "--generated-at" && value) {
      generatedAt = value;
      index += 1;
      continue;
    }

    if (argument === "--generation-duration-ms" && value) {
      generationDurationMs = parseGenerationDurationMs(value);
      index += 1;
      continue;
    }

    if (argument === "--debug") {
      debug = true;
      continue;
    }

    throw new ConfigurationError(
      `Unknown or incomplete argument: ${argument ?? ""}`,
      {
        suggestedAction:
          "Use optional --governance-decisions <path>, --current-registry <path>, --bootstrap-registry <path>, --output <path>, --generated-at <timestamp>, --generation-duration-ms <milliseconds>, and --debug.",
      },
    );
  }

  return {
    governanceDecisionsPath,
    currentRegistryPath,
    bootstrapRegistryPath,
    outputPath,
    generatedAt,
    generationDurationMs,
    debug,
  };
}

export function sortGovernanceDecisionArtifacts(
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): Array<Artifact<GovernanceDecisionArtifactContent>> {
  return [...decisions].sort((left, right) =>
    left.content.governance_decision_id.localeCompare(
      right.content.governance_decision_id,
    ));
}

async function loadGovernanceDecisionArtifacts(
  path: string,
): Promise<Array<Artifact<GovernanceDecisionArtifactContent>>> {
  const parsed = JSON.parse(await readFile(resolve(path), "utf8")) as unknown;

  if (!Array.isArray(parsed)) {
    throw new ConfigurationError(
      "Platform Registry Evolution input must be a JSON array of Governance Decision artifacts.",
      {
        suggestedAction:
          `Provide Governance Decisions, such as ${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json.`,
      },
    );
  }

  const artifacts = parsed as Array<Artifact<GovernanceDecisionArtifactContent>>;

  for (const artifact of artifacts) {
    if (
      artifact?.identity?.artifact_type !== "governance_decision"
        || artifact.content === undefined
        || artifact.content.approved_registry_change === undefined
    ) {
      throw new ConfigurationError(
        "Platform Registry Evolution input contains an invalid Governance Decision artifact.",
        {
          suggestedAction:
            "Provide Governance Decision artifacts produced by the Governance Engine.",
        },
      );
    }
  }

  return artifacts;
}

async function loadCurrentRegistryArtifact(
  path: string,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  const parsed = JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as Artifact<TopicRegistryArtifactContent>;

  if (
    parsed?.identity?.artifact_type !== "topic_registry"
      || parsed.content === undefined
  ) {
    throw new ConfigurationError(
      "Current registry input must be a Topic Registry Platform Artifact.",
      {
        suggestedAction:
          "Provide a persisted Platform Registry artifact or omit --current-registry to use the bootstrap registry.",
      },
    );
  }

  return parsed;
}

async function createBootstrapRegistryArtifact(
  path: string,
  artifactService: ArtifactService,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  const rawRegistry = await loadLegacyTopicRegistry(path);
  const registryVersion = parseRegistryVersion(rawRegistry.version);
  const content: TopicRegistryArtifactContent = {
    registry_version: registryVersion,
    topics: rawRegistry.topics
      .map((topic) => ({
        topic_id: topic.topic_id,
        canonical_name: topic.topic_name,
        definition: topic.description,
        aliases: topic.theme_variants,
        lifecycle_state: "active" as const,
        created_registry_version: 1,
        updated_registry_version: registryVersion,
        child_topic_ids: [],
        examples: topic.theme_variants,
        created_at: BOOTSTRAP_REGISTRY_GENERATED_AT,
        updated_at: BOOTSTRAP_REGISTRY_GENERATED_AT,
      }))
      .sort((left, right) => left.topic_id.localeCompare(right.topic_id)),
  };

  return artifactService.createArtifact<TopicRegistryArtifactContent>({
    artifact_id: bootstrapRegistryArtifactId(content),
    artifact_type: "topic_registry",
    company_id: null,
    period_id: null,
    content,
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "topic-registry-bootstrap-loader",
        execution_id: `platform:registry-bootstrap:${registryVersion}`,
      },
    },
    schema_version: PLATFORM_REGISTRY_SCHEMA_VERSION,
    pipeline_version: PLATFORM_REGISTRY_PIPELINE_VERSION,
    input_hash: calculateArtifactHash(rawRegistry),
    generation_duration_ms: 0,
    generated_at: BOOTSTRAP_REGISTRY_GENERATED_AT,
  });
}

function bootstrapRegistryArtifactId(
  content: TopicRegistryArtifactContent,
): ReservedArtifactId {
  return `platform-registry-artifact:bootstrap:${stableHash(content)}` as ReservedArtifactId;
}

async function loadLegacyTopicRegistry(
  path: string,
): Promise<LegacyTopicRegistryFile> {
  return JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as LegacyTopicRegistryFile;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = resolve(path);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function generatedAtFromInputs(
  currentRegistry: Artifact<TopicRegistryArtifactContent>,
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): string {
  const generatedAt = [
    currentRegistry.metadata.generated_at,
    ...decisions.map((decision) => decision.metadata.generated_at),
  ].filter((value) => value.trim() !== "")
    .sort()[0];

  if (generatedAt === undefined) {
    throw new ConfigurationError(
      "Platform Registry Evolution requires replay-stable generated_at metadata.",
      {
        suggestedAction:
          "Provide input artifacts with metadata.generated_at or pass --generated-at.",
      },
    );
  }

  return generatedAt;
}

function parseRegistryVersion(version: string): number {
  const majorVersion = Number.parseInt(version.split(".")[0] ?? "", 10);

  if (!Number.isInteger(majorVersion) || majorVersion < 1) {
    throw new ConfigurationError(
      `Invalid Platform Registry version: ${version}`,
      {
        suggestedAction:
          "Use a positive semantic version in the bootstrap registry file.",
      },
    );
  }

  return majorVersion;
}

function parseGenerationDurationMs(value: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ConfigurationError(
      `Invalid generation duration: ${value}`,
      {
        suggestedAction:
          "Use --generation-duration-ms with a non-negative integer value.",
      },
    );
  }

  return parsed;
}

export async function runPlatformRegistryEvolutionCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runPlatformRegistryEvolution(rawArguments);
    return 0;
  } catch (error) {
    if (error instanceof PlatformError) {
      logger.error(error.message, { code: error.code });
    }

    logger.error(
      renderPlatformError(normalizePlatformError(error), { debug }),
    );
    return 1;
  }
}

if (require.main === module) {
  runPlatformRegistryEvolutionCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
