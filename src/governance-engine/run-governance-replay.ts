import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  PLATFORM_REGISTRY_PIPELINE_VERSION,
  PLATFORM_REGISTRY_SCHEMA_VERSION,
} from "../../contracts/governance/registry-evolution-contract.js";
import { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import {
  ConfigurationError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { createLogger } from "../shared/logger.js";
import { DEMO_ARTIFACTS_DIRECTORY } from "../../builders/upstream-pipeline/demo-output-paths.js";
import { MemoryArtifactRepository } from "../../builders/upstream-pipeline/memory-artifact-repository.js";
import { stableHash } from "../shared/hashing/stable-hash.js";
import { loadGovernancePolicyRegistry } from "../governance-policy-registry/index.js";
import { GovernanceEngine } from "./executor.js";

const logger = createLogger("governance-replay");
const DEFAULT_BOOTSTRAP_REGISTRY_PATH = "data/registry/topics.json";
const BOOTSTRAP_REGISTRY_GENERATED_AT = "2026-06-19T00:00:00.000Z";

export type GovernanceReplayArguments = {
  topicCandidatesPath: string;
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

export async function runGovernanceReplay(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const topicCandidates = sortTopicCandidateArtifacts(
    await loadTopicCandidateArtifacts(args.topicCandidatesPath),
  );
  const policyRegistry = await loadGovernancePolicyRegistry();
  const activePolicy = policyRegistry.getActivePolicy();
  const artifactService = new ArtifactService(new MemoryArtifactRepository());
  const governanceEngine = new GovernanceEngine();
  const currentPlatformRegistry = args.currentRegistryPath === undefined
    ? await createBootstrapRegistryArtifact(
      args.bootstrapRegistryPath,
      artifactService,
    )
    : await loadCurrentRegistryArtifact(args.currentRegistryPath);
  const generatedAt = args.generatedAt
    ?? generatedAtFromTopicCandidates(topicCandidates);

  logger.info("Executing Governance replay.", {
    topic_candidates_path: args.topicCandidatesPath,
    topic_candidate_count: topicCandidates.length,
    active_governance_policy_version: activePolicy.policy_version,
    current_platform_registry_version:
      currentPlatformRegistry.content.registry_version,
    output_path: args.outputPath,
  });

  const decisions: Array<Artifact<GovernanceDecisionArtifactContent>> = [];

  for (const topicCandidate of topicCandidates) {
    const candidate = topicCandidate.content.candidates[0];

    decisions.push(await governanceEngine.executeArtifact(
      {
        topic_candidate_artifact: topicCandidate,
        governance_policy: activePolicy,
        current_platform_registry: currentPlatformRegistry,
        execution_id:
          `platform:governance-replay:${activePolicy.policy_version}:${candidate.candidate_id}`,
      },
      artifactService,
      {
        generatedAt,
        generationDurationMs: args.generationDurationMs,
      },
    ));
  }

  const sortedDecisions = sortGovernanceDecisionArtifacts(decisions);

  await writeJson(args.outputPath, sortedDecisions);

  logger.info("Governance replay completed.", {
    governance_decision_count: sortedDecisions.length,
    active_governance_policy_version: activePolicy.policy_version,
    output_path: resolve(args.outputPath),
  });
}

export function parseArguments(args: string[]): GovernanceReplayArguments {
  let topicCandidatesPath =
    `${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json`;
  let currentRegistryPath: string | undefined;
  let bootstrapRegistryPath = DEFAULT_BOOTSTRAP_REGISTRY_PATH;
  let outputPath = `${DEMO_ARTIFACTS_DIRECTORY}/08-governance-decisions.json`;
  let generatedAt: string | undefined;
  let generationDurationMs = 0;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--topic-candidates" && value) {
      topicCandidatesPath = value;
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
          "Use optional --topic-candidates <path>, --current-registry <path>, --bootstrap-registry <path>, --output <path>, --generated-at <timestamp>, --generation-duration-ms <milliseconds>, and --debug.",
      },
    );
  }

  return {
    topicCandidatesPath,
    currentRegistryPath,
    bootstrapRegistryPath,
    outputPath,
    generatedAt,
    generationDurationMs,
    debug,
  };
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

export function sortGovernanceDecisionArtifacts(
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): Array<Artifact<GovernanceDecisionArtifactContent>> {
  return [...decisions].sort((left, right) =>
    left.content.candidate_reference.candidate_id.localeCompare(
      right.content.candidate_reference.candidate_id,
    )
      || left.content.governance_decision_id.localeCompare(
        right.content.governance_decision_id,
      ));
}

function sortTopicCandidateArtifacts(
  artifacts: Array<Artifact<TopicCandidateArtifactContent>>,
): Array<Artifact<TopicCandidateArtifactContent>> {
  return [...artifacts].sort((left, right) =>
    candidateId(left).localeCompare(candidateId(right)));
}

async function loadTopicCandidateArtifacts(
  path: string,
): Promise<Array<Artifact<TopicCandidateArtifactContent>>> {
  const parsed = JSON.parse(await readFile(resolve(path), "utf8")) as unknown;

  if (!Array.isArray(parsed)) {
    throw new ConfigurationError(
      "Governance replay input must be a JSON array of Topic Candidate Governance Artifacts.",
      {
        suggestedAction:
          `Provide Topic Candidate artifacts, such as ${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json.`,
      },
    );
  }

  const artifacts = parsed as Array<Artifact<TopicCandidateArtifactContent>>;

  for (const artifact of artifacts) {
    if (
      artifact?.identity?.artifact_type !== "topic_candidate"
        || artifact.content === undefined
        || !Array.isArray(artifact.content.candidates)
        || artifact.content.candidates.length !== 1
    ) {
      throw new ConfigurationError(
        "Governance replay input contains an invalid Topic Candidate Governance Artifact.",
        {
          suggestedAction:
            "Provide one-candidate Topic Candidate Governance Artifacts produced by Candidate Discovery.",
        },
      );
    }
  }

  return artifacts;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = resolve(path);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function generatedAtFromTopicCandidates(
  topicCandidates: Array<Artifact<TopicCandidateArtifactContent>>,
): string {
  const generatedAtValues = topicCandidates
    .map((artifact) => artifact.metadata.generated_at)
    .filter((value) => value.trim() !== "")
    .sort();
  const generatedAt = generatedAtValues[0];

  if (generatedAt === undefined) {
    throw new ConfigurationError(
      "Governance replay requires Topic Candidate generated_at metadata.",
      {
        suggestedAction:
          "Provide Topic Candidate artifacts with metadata.generated_at or pass --generated-at.",
      },
    );
  }

  return generatedAt;
}

function candidateId(
  artifact: Artifact<TopicCandidateArtifactContent>,
): string {
  return artifact.content.candidates[0]?.candidate_id ?? "";
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

function parseRegistryVersion(version: string): number {
  const majorVersion = Number.parseInt(version.split(".")[0] ?? "", 10);

  if (!Number.isInteger(majorVersion) || majorVersion < 1) {
    throw new ConfigurationError(
      `Invalid Platform Registry version: ${version}`,
      {
        suggestedAction:
          "Use a Platform Registry version with a positive major version.",
      },
    );
  }

  return majorVersion;
}

export async function runGovernanceReplayCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runGovernanceReplay(rawArguments);
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
  runGovernanceReplayCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
