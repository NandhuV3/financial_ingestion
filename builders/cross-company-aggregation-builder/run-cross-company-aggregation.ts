import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicSignalExecutionRecord,
} from "../../contracts/execution/topic-signal-execution-record.js";
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
import { MemoryArtifactRepository } from "../upstream-pipeline/memory-artifact-repository.js";
import { CrossCompanyAggregationBuilder } from "./builder.js";
import { aggregationResultArtifactId } from "./aggregator.js";
import {
  AGGREGATION_RESULT_ARTIFACT_TYPE,
  AGGREGATION_RESULT_PIPELINE_VERSION,
  AGGREGATION_RESULT_SCHEMA_VERSION,
  CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
  CROSS_COMPANY_AGGREGATION_VERSION,
} from "./contract.js";
import type {
  CrossCompanyAggregationBuilderInput,
} from "./types.js";

const logger = createLogger("cross-company-aggregation-replay");

export type CrossCompanyAggregationReplayArguments = {
  topicSignalsPath: string;
  outputPath: string;
  aggregationConfigurationVersion: string;
  generatedAt?: string;
  generationDurationMs: number;
  debug: boolean;
};

export async function runCrossCompanyAggregationReplay(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const topicSignals = await loadTopicSignals(args.topicSignalsPath);
  const input: CrossCompanyAggregationBuilderInput = {
    topic_signals: topicSignals,
    aggregation_configuration_version:
      args.aggregationConfigurationVersion,
  };
  const registry = new BuilderRegistry();
  const repository = new MemoryArtifactRepository();
  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(repository),
  );

  registry.registerBuilder({
    builder_type: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
    version: CROSS_COMPANY_AGGREGATION_VERSION,
    artifact_type: AGGREGATION_RESULT_ARTIFACT_TYPE,
    schema_version: AGGREGATION_RESULT_SCHEMA_VERSION,
    pipeline_version: AGGREGATION_RESULT_PIPELINE_VERSION,
  }, () => new CrossCompanyAggregationBuilder());

  logger.info("Executing Cross-Company Aggregation replay.", {
    topic_signals_path: args.topicSignalsPath,
    output_path: args.outputPath,
    aggregation_configuration_version:
      args.aggregationConfigurationVersion,
    generated_at: args.generatedAt ?? generatedAtFromTopicSignals(topicSignals),
    generation_duration_ms: args.generationDurationMs,
    topic_signal_count: topicSignals.length,
  });

  const artifact = await executor.executeBuilder<
    CrossCompanyAggregationBuilderInput,
    AggregationResultArtifactContent
  >({
    builderType: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
    artifactId: aggregationResultArtifactId(input),
    companyId: "PLATFORM",
    periodId: "CROSS_COMPANY",
    executionId: "platform:cross-company-aggregation-replay",
    input,
    inputHash: stableHash(input),
    generatedAt: args.generatedAt ?? generatedAtFromTopicSignals(topicSignals),
    generationDurationMs: args.generationDurationMs,
  });

  await writeJson(args.outputPath, artifact);

  logger.info("Cross-Company Aggregation replay completed.", {
    aggregation_id: artifact.content.aggregation_context.aggregation_id,
    signal_count: artifact.content.aggregation_context.signal_count,
    topic_count: artifact.content.topic_statistics.length,
    execution_reference_count:
      artifact.lineage.execution_references?.length ?? 0,
    output_path: resolve(args.outputPath),
  });
}

export function parseArguments(
  args: string[],
): CrossCompanyAggregationReplayArguments {
  let topicSignalsPath = "output/demo/04-topic-signals.json";
  let outputPath = "output/demo/05-aggregation-result.json";
  let aggregationConfigurationVersion = "cross-company-default-v1";
  let generatedAt: string | undefined;
  let generationDurationMs = 0;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--topic-signals" && value) {
      topicSignalsPath = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputPath = value;
      index += 1;
      continue;
    }

    if (argument === "--aggregation-configuration-version" && value) {
      aggregationConfigurationVersion = value;
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
          "Use optional --topic-signals <path>, --output <path>, --aggregation-configuration-version <version>, --generated-at <timestamp>, --generation-duration-ms <milliseconds>, and --debug.",
      },
    );
  }

  return {
    topicSignalsPath,
    outputPath,
    aggregationConfigurationVersion,
    generatedAt,
    generationDurationMs,
    debug,
  };
}

async function loadTopicSignals(
  path: string,
): Promise<TopicSignalExecutionRecord[]> {
  const parsed = JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as unknown;

  if (!Array.isArray(parsed)) {
    throw new ConfigurationError(
      "Topic Signal replay input must be a JSON array.",
      {
        suggestedAction:
          "Provide a Topic Signal JSON array, such as output/demo/04-topic-signals.json.",
      },
    );
  }

  return parsed as TopicSignalExecutionRecord[];
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const outputPath = resolve(path);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function generatedAtFromTopicSignals(
  topicSignals: TopicSignalExecutionRecord[],
): string {
  const generatedAtValues = topicSignals
    .map((signal) => signal.execution_metadata.generated_at)
    .filter((value) => value.trim() !== "")
    .sort();
  const generatedAt = generatedAtValues[0];

  if (generatedAt === undefined) {
    throw new ConfigurationError(
      "Cross-Company Aggregation replay requires Topic Signal generated_at metadata.",
      {
        suggestedAction:
          "Provide Topic Signals with execution_metadata.generated_at or pass --generated-at.",
      },
    );
  }

  return generatedAt;
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

export async function runCrossCompanyAggregationReplayCli(
  rawArguments: string[],
): Promise<number> {
  const debug = rawArguments.includes("--debug");

  try {
    await runCrossCompanyAggregationReplay(rawArguments);
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
  runCrossCompanyAggregationReplayCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
  );
}
