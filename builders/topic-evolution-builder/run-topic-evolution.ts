import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicEvolutionArtifactContent,
} from "../../contracts/artifacts/topic-evolution-artifact-content.js";
import { ArtifactService, calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../packages/builder-framework/src/builder-registry.js";
import {
  ConfigurationError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { createLogger } from "../../src/shared/logger.js";
import { DEMO_ARTIFACTS_DIRECTORY } from "../upstream-pipeline/demo-output-paths.js";
import { MemoryArtifactRepository } from "../upstream-pipeline/memory-artifact-repository.js";
import { TopicEvolutionBuilder } from "./builder.js";
import {
  historicalTopicAssignmentDependencyKey,
  TOPIC_EVOLUTION_BUILDER_TYPE,
  TOPIC_EVOLUTION_BUILDER_VERSION,
  TOPIC_EVOLUTION_PIPELINE_VERSION,
  TOPIC_EVOLUTION_SCHEMA_VERSION,
} from "./contract.js";
import { topicEvolutionArtifactId } from "./identity.js";
import type { TopicEvolutionBuilderInput } from "./types.js";

const logger = createLogger("topic-evolution-replay");

export type TopicEvolutionReplayArguments = {
  currentTopicAssignmentPath: string;
  historicalTopicAssignmentPaths: string[];
  outputPath: string;
  generatedAt?: string;
  generationDurationMs: number;
  debug: boolean;
};

export async function runTopicEvolutionReplay(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const current = await loadTopicAssignmentArtifact(
    args.currentTopicAssignmentPath,
    "current Topic Assignment",
  );
  const historical = sortHistoricalTopicAssignments(
    await Promise.all(args.historicalTopicAssignmentPaths.map((path) =>
      loadTopicAssignmentArtifact(path, "historical Topic Assignment")
    )),
  );
  const input: TopicEvolutionBuilderInput = {
    company_id: current.content.company_id,
    period_id: current.content.period_id,
    filing_id: current.content.filing_id,
    historical_periods: historical.map(({ content }) => content.period_id),
  };
  const dependencies = dependencyMap(current, historical);
  const registry = new BuilderRegistry();
  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  );
  const generatedAt = args.generatedAt ?? current.metadata.generated_at;

  registry.registerBuilder({
    builder_type: TOPIC_EVOLUTION_BUILDER_TYPE,
    artifact_type: "topic_evolution",
    version: TOPIC_EVOLUTION_BUILDER_VERSION,
    schema_version: TOPIC_EVOLUTION_SCHEMA_VERSION,
    pipeline_version: TOPIC_EVOLUTION_PIPELINE_VERSION,
  }, () => new TopicEvolutionBuilder());

  logger.info("Executing Topic Evolution replay.", {
    current_topic_assignment_path: args.currentTopicAssignmentPath,
    historical_topic_assignment_count: historical.length,
    output_path: args.outputPath,
    generated_at: generatedAt,
    generation_duration_ms: args.generationDurationMs,
    company_id: input.company_id,
    period_id: input.period_id,
  });

  const artifact = await executor.executeBuilder<
    TopicEvolutionBuilderInput,
    TopicEvolutionArtifactContent
  >({
    builderType: TOPIC_EVOLUTION_BUILDER_TYPE,
    artifactId: topicEvolutionArtifactId({ current, historical }),
    companyId: input.company_id,
    periodId: input.period_id,
    executionId: [
      input.company_id,
      input.period_id,
      "topic-evolution-replay",
    ].join(":"),
    input,
    inputHash: calculateArtifactHash({
      current_topic_assignment: current.metadata.artifact_hash,
      historical_topic_assignments: historical.map((artifact) =>
        artifact.metadata.artifact_hash),
      input,
    }),
    dependencies,
    lineageDependencies: dependencies,
    generatedAt,
    generationDurationMs: args.generationDurationMs,
  });

  await writeJson(args.outputPath, artifact);

  logger.info("Topic Evolution replay completed.", {
    artifact_id: artifact.identity.artifact_id,
    artifact_hash: artifact.metadata.artifact_hash,
    topic_evolution_count: artifact.content.topics.length,
    history_state: artifact.content.history.history_state,
    upstream_dependency_count: artifact.lineage.upstream_dependencies.length,
    output_path: resolve(args.outputPath),
  });
}

export function parseArguments(args: string[]): TopicEvolutionReplayArguments {
  let currentTopicAssignmentPath =
    `${DEMO_ARTIFACTS_DIRECTORY}/03-topic-assignment.json`;
  const historicalTopicAssignmentPaths: string[] = [];
  let outputPath = `${DEMO_ARTIFACTS_DIRECTORY}/10-topic-evolution.json`;
  let generatedAt: string | undefined;
  let generationDurationMs = 0;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--current-topic-assignment" && value) {
      currentTopicAssignmentPath = value;
      index += 1;
      continue;
    }

    if (argument === "--historical-topic-assignments" && value) {
      historicalTopicAssignmentPaths.push(...parsePathList(value));
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
          "Use optional --current-topic-assignment <path>, --historical-topic-assignments <path[,path...]>, --output <path>, --generated-at <timestamp>, --generation-duration-ms <milliseconds>, and --debug.",
      },
    );
  }

  return {
    currentTopicAssignmentPath,
    historicalTopicAssignmentPaths,
    outputPath,
    generatedAt,
    generationDurationMs,
    debug,
  };
}

async function loadTopicAssignmentArtifact(
  path: string,
  label: string,
): Promise<Artifact<TopicAssignmentArtifactContent>> {
  const parsed = JSON.parse(await readFile(resolve(path), "utf8")) as unknown;

  if (
    !isArtifactWithContent(parsed)
      || parsed.identity.artifact_type !== "topic_assignment"
  ) {
    throw new ConfigurationError(
      `${label} replay input must be a Topic Assignment artifact.`,
      {
        suggestedAction:
          "Provide persisted Topic Assignment artifacts produced by Builder 012.",
      },
    );
  }

  return parsed as Artifact<TopicAssignmentArtifactContent>;
}

function isArtifactWithContent(value: unknown): value is Artifact<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    identity?: {
      artifact_type?: unknown;
    };
    content?: unknown;
  };

  return typeof candidate.identity?.artifact_type === "string"
    && candidate.content !== undefined;
}

function sortHistoricalTopicAssignments(
  artifacts: Array<Artifact<TopicAssignmentArtifactContent>>,
): Array<Artifact<TopicAssignmentArtifactContent>> {
  return [...artifacts].sort((left, right) =>
    left.content.period_id.localeCompare(right.content.period_id)
      || left.identity.artifact_id.localeCompare(right.identity.artifact_id));
}

function dependencyMap(
  current: Artifact<TopicAssignmentArtifactContent>,
  historical: Array<Artifact<TopicAssignmentArtifactContent>>,
): Record<string, Artifact<TopicAssignmentArtifactContent>> {
  return {
    current_topic_assignments: current,
    ...Object.fromEntries(historical.map((artifact) => [
      historicalTopicAssignmentDependencyKey(artifact.content.period_id),
      artifact,
    ])),
  };
}

function parsePathList(value: string): string[] {
  return value
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path !== "");
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = resolve(path);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

export async function runTopicEvolutionReplayCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runTopicEvolutionReplay(rawArguments);
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
  runTopicEvolutionReplayCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
