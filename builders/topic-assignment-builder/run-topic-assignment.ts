import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  DependencyReference,
} from "../../contracts/artifacts/artifact-lineage.js";
import type {
  EmbeddingExecutionRecord,
} from "../../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingGeneratorInput,
  EmbeddingGeneratorReader,
} from "../../contracts/execution/embedding-generator-contract.js";
import type {
  EmbeddingResolverReader,
  EmbeddingResolverRequest,
} from "../../contracts/execution/embedding-resolver-contract.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../packages/llm-framework/src/llm-client.js";
import {
  ConfigurationError,
  PipelineExecutionError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { EmbeddingResolver } from "../../src/embedding-resolver/index.js";
import { loadEmbeddingStore } from "../../src/embedding-store/index.js";
import { createLogger } from "../../src/shared/logger.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import { MemoryArtifactRepository } from "../upstream-pipeline/memory-artifact-repository.js";
import { registerUpstreamBuilders } from "../upstream-pipeline/register-builders.js";
import { writeArtifactDump } from "../upstream-pipeline/artifact-dump.js";
import {
  demoArtifactsDirectory,
  demoExecutionDirectory,
  DEMO_OUTPUT_ROOT,
} from "../upstream-pipeline/demo-output-paths.js";
import {
  TOPIC_ASSIGNMENT_BUILDER_TYPE,
  TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
  TOPIC_ASSIGNMENT_PIPELINE_VERSION,
  TOPIC_ASSIGNMENT_SCHEMA_VERSION,
} from "./contract.js";
import { TopicAssignmentBuilder } from "./builder.js";
import type { TopicAssignmentBuilderInput } from "./types.js";
import type { ThemesArtifactContent } from "../themes/contract.js";

const logger = createLogger("topic-assignment-replay");

export type TopicAssignmentReplayArguments = {
  themesPath: string;
  topicRegistryPath: string;
  embeddingStorePath: string;
  outputDirectory: string;
  originalExecutionId?: string;
  originalGeneratedAt?: string;
  debug: boolean;
};

export async function runTopicAssignmentReplay(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);

  const themes = await loadJsonArtifact<ThemesArtifactContent>(args.themesPath);
  const repository = new MemoryArtifactRepository();
  const embeddingStore = await loadEmbeddingStore(args.embeddingStorePath);
  const runtime = registerUpstreamBuilders({
    repository,
    promptResolver: new UnusedPromptResolver(),
    llmClient: new UnusedLLMClient(),
    semanticEmbeddingProvider: new UnusedSemanticEmbeddingProvider(),
  });
  const topicRegistry = await createTopicRegistryArtifact(
    runtime,
    args.topicRegistryPath,
  );
  const replayOriginalContext = {
    execution_id: args.originalExecutionId ?? [
      themes.content.company_id,
      themes.content.period_id,
      "topic-assignment-original",
    ].join(":"),
    generated_at: args.originalGeneratedAt ?? themes.metadata.generated_at,
  };
  const topicAssignmentInput: TopicAssignmentBuilderInput = {
    company_id: themes.content.company_id,
    period_id: themes.content.period_id,
    filing_id: themes.content.filing_id,
    embedding_execution_mode: "REPLAY",
    replay_original_execution_context: replayOriginalContext,
  };
  const artifactInputHashInput = {
    company_id: topicAssignmentInput.company_id,
    period_id: topicAssignmentInput.period_id,
    filing_id: topicAssignmentInput.filing_id,
  };
  const generatedAt = new Date().toISOString();

  logger.info("Topic Assignment replay started.", {
    company_id: topicAssignmentInput.company_id,
    period_id: topicAssignmentInput.period_id,
    themes_path: args.themesPath,
    topic_registry_path: args.topicRegistryPath,
    embedding_store_path: args.embeddingStorePath,
    original_execution_id: replayOriginalContext.execution_id,
    original_generated_at: replayOriginalContext.generated_at,
  });

  const executionId = [
    topicAssignmentInput.company_id,
    topicAssignmentInput.period_id,
    "topic-assignment-replay",
  ].join(":");
  const inputHash = calculateArtifactHash({
    themes: themes.metadata.artifact_hash,
    topic_registry: topicRegistry.metadata.artifact_hash,
    input: artifactInputHashInput,
  });
  const replayEmbeddingResolver = new ReplayLoggingEmbeddingResolver(
    new EmbeddingResolver({
      store: embeddingStore,
      generator: new ReplayForbiddenEmbeddingGenerator(),
      execution_context: {
        execution_id: executionId,
        producer: TOPIC_ASSIGNMENT_BUILDER_TYPE,
      },
    }),
  );
  const builder = new TopicAssignmentBuilder(
    replayEmbeddingResolver,
  );
  const result = await builder.executeWithTopicSignals({
    companyId: topicAssignmentInput.company_id,
    periodId: topicAssignmentInput.period_id,
    executionId,
    input: topicAssignmentInput,
    dependencies: {
      themes,
      topic_registry: topicRegistry,
    },
    recordPromptReference() {},
    recordModelReference() {},
  }, { generatedAt });
  const topicAssignment =
    await runtime.artifactService.createArtifact<TopicAssignmentArtifactContent>({
      artifact_type: "topic_assignment",
      company_id: topicAssignmentInput.company_id,
      period_id: topicAssignmentInput.period_id,
      content: result.builder_result.content,
      lineage: {
        upstream_dependencies: [
          dependencyReference(themes),
          dependencyReference(topicRegistry),
        ].sort((left, right) =>
          `${left.artifact_type}:${left.artifact_id}`.localeCompare(
            `${right.artifact_type}:${right.artifact_id}`,
          )),
        generation_context: {
          builder_type: TOPIC_ASSIGNMENT_BUILDER_TYPE,
          execution_id: executionId,
        },
        model_reference: {
          provider: "semantic-embedding",
          model_name: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
          model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
          temperature: 0,
        },
      },
      schema_version: TOPIC_ASSIGNMENT_SCHEMA_VERSION,
      pipeline_version: TOPIC_ASSIGNMENT_PIPELINE_VERSION,
      input_hash: inputHash,
      generation_duration_ms: 0,
      generated_at: generatedAt,
    });

  const outputPath = await writeArtifactDump(
    demoArtifactsDirectory(args.outputDirectory),
    "topic_assignment",
    topicAssignment,
  );
  const topicSignalsPath = await writeTopicSignals(
    demoExecutionDirectory(args.outputDirectory),
    result.topic_signals,
  );

  logger.info("Topic Assignment replay completed.", {
    company_id: topicAssignment.content.company_id,
    period_id: topicAssignment.content.period_id,
    assignment_count: topicAssignment.content.assignments.length,
    unassigned_count: topicAssignment.content.unassigned_themes.length,
    output_path: outputPath,
    topic_signals_path: topicSignalsPath,
  });
}

export function parseArguments(
  args: string[],
): TopicAssignmentReplayArguments {
  let themesPath = `${DEMO_OUTPUT_ROOT}/artifacts/02-themes.json`;
  let topicRegistryPath = "data/registry/topics.json";
  let embeddingStorePath = "src/embedding-store/embedding-execution-records.json";
  let outputDirectory = DEMO_OUTPUT_ROOT;
  let originalExecutionId: string | undefined;
  let originalGeneratedAt: string | undefined;
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--themes" && value) {
      themesPath = value;
      index += 1;
      continue;
    }

    if (argument === "--topic-registry" && value) {
      topicRegistryPath = value;
      index += 1;
      continue;
    }

    if (argument === "--embedding-store" && value) {
      embeddingStorePath = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputDirectory = value;
      index += 1;
      continue;
    }

    if (argument === "--original-execution-id" && value) {
      originalExecutionId = value;
      index += 1;
      continue;
    }

    if (argument === "--original-generated-at" && value) {
      originalGeneratedAt = value;
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
          "Use optional --themes <path>, --topic-registry <path>, --embedding-store <path>, --output <directory>, --original-execution-id <id>, --original-generated-at <timestamp>, and --debug.",
      },
    );
  }

  return {
    themesPath,
    topicRegistryPath,
    embeddingStorePath,
    outputDirectory,
    originalExecutionId,
    originalGeneratedAt,
    debug,
  };
}

async function createTopicRegistryArtifact(
  runtime: ReturnType<typeof registerUpstreamBuilders>,
  topicRegistryPath: string,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  const rawRegistry = await loadLegacyTopicRegistry(topicRegistryPath);
  const registryVersion = parseRegistryVersion(rawRegistry.version);
  const content: TopicRegistryArtifactContent = {
    registry_version: registryVersion,
    topics: rawRegistry.topics.map((topic) => ({
      topic_id: topic.topic_id,
      canonical_name: topic.topic_name,
      definition: topic.description,
      aliases: topic.theme_variants,
      lifecycle_state: "active",
      created_registry_version: 1,
      updated_registry_version: registryVersion,
      child_topic_ids: [],
      examples: topic.theme_variants,
      created_at: "2026-06-19T00:00:00.000Z",
      updated_at: "2026-06-19T00:00:00.000Z",
    })),
  };

  return runtime.artifactService.createArtifact({
    artifact_type: "topic_registry",
    company_id: null,
    period_id: null,
    content,
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "topic-registry-replay-loader",
      },
    },
    schema_version: "topic-registry-artifact-v1",
    pipeline_version: "topic-registry-pipeline-v1",
    input_hash: calculateArtifactHash(rawRegistry),
    generation_duration_ms: 0,
  });
}

async function writeTopicSignals(
  outputDirectory: string,
  topicSignals: unknown,
): Promise<string> {
  const outputPath = resolve(outputDirectory, "04-topic-signals.json");

  await mkdir(resolve(outputDirectory), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(topicSignals, null, 2)}\n`,
    "utf8",
  );

  return outputPath;
}

function dependencyReference(artifact: Artifact<unknown>): DependencyReference {
  return {
    artifact_id: artifact.identity.artifact_id,
    artifact_type: artifact.identity.artifact_type,
    version: artifact.identity.version,
    artifact_hash: artifact.metadata.artifact_hash,
    input_hash: artifact.metadata.input_hash,
  };
}

async function loadJsonArtifact<T>(path: string): Promise<Artifact<T>> {
  return JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as Artifact<T>;
}

async function loadLegacyTopicRegistry(
  path: string,
): Promise<LegacyTopicRegistryFile> {
  return JSON.parse(
    await readFile(resolve(path), "utf8"),
  ) as LegacyTopicRegistryFile;
}

type LegacyTopicRegistryFile = {
  version: string;
  topics: Array<{
    topic_id: string;
    topic_name: string;
    description: string;
    theme_variants: string[];
  }>;
};

function parseRegistryVersion(version: string): number {
  const majorVersion = Number.parseInt(version.split(".")[0] ?? "", 10);

  if (!Number.isInteger(majorVersion) || majorVersion < 1) {
    throw new ConfigurationError(
      `Invalid Topic Registry version: ${version}`,
      {
        suggestedAction:
          "Update the Topic Registry file to use a positive semantic version.",
      },
    );
  }

  return majorVersion;
}

class UnusedPromptResolver {
  resolve(): never {
    throw new PipelineExecutionError(
      "Topic Assignment replay must not resolve prompts.",
    );
  }

  render(): never {
    throw new PipelineExecutionError(
      "Topic Assignment replay must not render prompts.",
    );
  }
}

class UnusedLLMClient implements LLMClient {
  async callLLM(_request: LLMRequest): Promise<LLMResponse> {
    throw new PipelineExecutionError(
      "Topic Assignment replay must not invoke an LLM.",
    );
  }
}

class UnusedSemanticEmbeddingProvider {
  async embed(_input: {
    model: string;
    texts: string[];
  }): Promise<number[][]> {
    throw new PipelineExecutionError(
      "Topic Assignment replay must not invoke an embedding provider.",
    );
  }
}

class ReplayForbiddenEmbeddingGenerator implements EmbeddingGeneratorReader {
  async generate(
    _input: EmbeddingGeneratorInput,
  ): Promise<EmbeddingExecutionRecord> {
    throw new PipelineExecutionError(
      "Topic Assignment replay must not invoke the Embedding Generator.",
    );
  }
}

class ReplayLoggingEmbeddingResolver implements EmbeddingResolverReader {
  constructor(private readonly delegate: EmbeddingResolverReader) {}

  async resolve(
    request: EmbeddingResolverRequest,
  ): Promise<EmbeddingExecutionRecord> {
    logger.info("Replay embedding resolution started.", {
      source_type: request.source_type,
      source_id: request.source_id,
      source_hash: request.source_hash,
      embedding_model_version: request.embedding_model_version,
    });

    try {
      const record = await this.delegate.resolve(request);

      logger.info("Replay Embedding Store hit.", {
        source_type: request.source_type,
        source_id: request.source_id,
        record_id: record.record_id,
      });

      return record;
    } catch (error) {
      logger.error("Replay missing embedding.", {
        source_type: request.source_type,
        source_id: request.source_id,
        source_hash: request.source_hash,
        embedding_model_version: request.embedding_model_version,
        error_message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}

export async function runTopicAssignmentReplayCli(
  rawArguments: string[],
): Promise<number> {
  loadEnv();
  const debug = rawArguments.includes("--debug");

  try {
    await runTopicAssignmentReplay(rawArguments);
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
  runTopicAssignmentReplayCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
