import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
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
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import { createLogger } from "../../src/shared/logger.js";
import { DEMO_ARTIFACTS_DIRECTORY } from "../upstream-pipeline/demo-output-paths.js";
import { MemoryArtifactRepository } from "../upstream-pipeline/memory-artifact-repository.js";
import { CandidateDiscoveryBuilder } from "./builder.js";
import {
  listCandidateDiscoveryTargets,
  topicCandidateArtifactId,
} from "./candidate-discovery.js";
import {
  CANDIDATE_DISCOVERY_BUILDER_TYPE,
  CANDIDATE_DISCOVERY_VERSION,
  TOPIC_CANDIDATE_ARTIFACT_TYPE,
  TOPIC_CANDIDATE_PIPELINE_VERSION,
  TOPIC_CANDIDATE_SCHEMA_VERSION,
} from "./contract.js";
import type { CandidateDiscoveryBuilderInput } from "./types.js";

const logger = createLogger("candidate-discovery-replay");

export type CandidateDiscoveryReplayArguments = {
  aggregationResultPath: string;
  outputPath: string;
  candidateDiscoveryVersion: string;
  generatedAt?: string;
  generationDurationMs: number;
  debug: boolean;
};

export async function runCandidateDiscoveryReplay(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const aggregationResult = await loadAggregationResult(
    args.aggregationResultPath,
  );
  const registry = new BuilderRegistry();
  const repository = new MemoryArtifactRepository();
  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(repository),
  );

  registry.registerBuilder({
    builder_type: CANDIDATE_DISCOVERY_BUILDER_TYPE,
    version: CANDIDATE_DISCOVERY_VERSION,
    artifact_type: TOPIC_CANDIDATE_ARTIFACT_TYPE,
    schema_version: TOPIC_CANDIDATE_SCHEMA_VERSION,
    pipeline_version: TOPIC_CANDIDATE_PIPELINE_VERSION,
  }, () => new CandidateDiscoveryBuilder());

  logger.info("Executing Candidate Discovery replay.", {
    aggregation_result_path: args.aggregationResultPath,
    output_path: args.outputPath,
    candidate_discovery_version: args.candidateDiscoveryVersion,
    generated_at: args.generatedAt ?? aggregationResult.metadata.generated_at,
    generation_duration_ms: args.generationDurationMs,
    topic_statistics_count: aggregationResult.content.topic_statistics.length,
  });

  const generatedAt = args.generatedAt ?? aggregationResult.metadata.generated_at;
  const artifacts: Array<Artifact<TopicCandidateArtifactContent>> = [];

  for (const target of listCandidateDiscoveryTargets(aggregationResult.content)) {
    const input: CandidateDiscoveryBuilderInput = {
      topic_id: target.topic_id,
      registry_version: target.registry_version,
    };

    artifacts.push(await executor.executeBuilder<
      CandidateDiscoveryBuilderInput,
      TopicCandidateArtifactContent
    >({
      builderType: CANDIDATE_DISCOVERY_BUILDER_TYPE,
      artifactId: topicCandidateArtifactId(aggregationResult.content, input),
      companyId: "PLATFORM",
      periodId: "PLATFORM_INTELLIGENCE",
      executionId:
        `platform:candidate-discovery-replay:${target.registry_version}:${target.topic_id}`,
      input,
      inputHash: stableHash(input),
      dependencies: {
        aggregation_result: aggregationResult,
      },
      generatedAt,
      generationDurationMs: args.generationDurationMs,
    }));
  }

  await writeJson(args.outputPath, artifacts);

  logger.info("Candidate Discovery replay completed.", {
    artifact_count: artifacts.length,
    candidate_count: artifacts.length,
    aggregation_dependency_count:
      artifacts.reduce((count, artifact) =>
        count + artifact.lineage.upstream_dependencies.length, 0),
    output_path: resolve(args.outputPath),
  });
}

export function parseArguments(
  args: string[],
): CandidateDiscoveryReplayArguments {
  let aggregationResultPath =
    `${DEMO_ARTIFACTS_DIRECTORY}/05-aggregation-result.json`;
  let outputPath = `${DEMO_ARTIFACTS_DIRECTORY}/06-topic-candidates.json`;
  let candidateDiscoveryVersion = CANDIDATE_DISCOVERY_VERSION;
  let generatedAt: string | undefined;
  let generationDurationMs = 0;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--aggregation-result" && value) {
      aggregationResultPath = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputPath = value;
      index += 1;
      continue;
    }

    if (argument === "--candidate-discovery-version" && value) {
      candidateDiscoveryVersion = value;
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
          "Use optional --aggregation-result <path>, --output <path>, --candidate-discovery-version <version>, --generated-at <timestamp>, --generation-duration-ms <milliseconds>, and --debug.",
      },
    );
  }

  if (candidateDiscoveryVersion !== CANDIDATE_DISCOVERY_VERSION) {
    throw new ConfigurationError(
      `Unsupported Candidate Discovery version: ${candidateDiscoveryVersion}`,
      {
        suggestedAction:
          `Use --candidate-discovery-version ${CANDIDATE_DISCOVERY_VERSION}.`,
      },
    );
  }

  return {
    aggregationResultPath,
    outputPath,
    candidateDiscoveryVersion,
    generatedAt,
    generationDurationMs,
    debug,
  };
}

async function loadAggregationResult(
  path: string,
): Promise<Artifact<AggregationResultArtifactContent>> {
  const parsed = JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as Artifact<AggregationResultArtifactContent>;

  if (
    parsed?.identity?.artifact_type !== "aggregation_result"
      || parsed.content === undefined
  ) {
    throw new ConfigurationError(
      "Candidate Discovery replay input must be an Aggregation Result Platform Artifact.",
      {
        suggestedAction:
          `Provide an Aggregation Result artifact, such as ${DEMO_ARTIFACTS_DIRECTORY}/05-aggregation-result.json.`,
      },
    );
  }

  return parsed;
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

export async function runCandidateDiscoveryReplayCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runCandidateDiscoveryReplay(rawArguments);
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
  runCandidateDiscoveryReplayCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
