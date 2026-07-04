import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  EmbeddingProvider,
  EmbeddingProviderInput,
  EmbeddingProviderResult,
} from "../../contracts/execution/embedding-generator-contract.js";
import {
  EMBEDDING_STORE_SCHEMA_VERSION,
  type EmbeddingStoreSource,
} from "../../contracts/execution/embedding-store-contract.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  ConfigurationError,
  PipelineExecutionError,
  PlatformError,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { EmbeddingGenerator } from "../../src/embedding-generator/index.js";
import { EmbeddingResolver } from "../../src/embedding-resolver/index.js";
import {
  EmbeddingStore,
  validateEmbeddingStoreSource,
} from "../../src/embedding-store/index.js";
import { createLogger } from "../../src/shared/logger.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import {
  DEMO_ARTIFACTS_DIRECTORY,
  DEMO_EXECUTION_DIRECTORY,
} from "../upstream-pipeline/demo-output-paths.js";
import { OpenAIResponsesLLMClient } from "../upstream-pipeline/openai-llm-client.js";
import { MemoryArtifactRepository } from "../upstream-pipeline/memory-artifact-repository.js";
import { registerUpstreamBuilders } from "../upstream-pipeline/register-builders.js";
import {
  TOPIC_ASSIGNMENT_BUILDER_TYPE,
  TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
} from "./contract.js";
import { TopicAssignmentBuilder } from "./builder.js";
import type { TopicAssignmentBuilderInput } from "./types.js";
import type { ThemesArtifactContent } from "../themes/contract.js";

const logger = createLogger("demo-embedding-store-builder");

export type DemoEmbeddingStoreArguments = {
  themesPath: string;
  topicRegistryPath: string;
  outputPath: string;
  debug: boolean;
};

export async function buildDemoEmbeddingStore(
  rawArguments: string[],
): Promise<void> {
  const args = parseArguments(rawArguments);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "OPENAI_API_KEY is required to build the demo Embedding Store.",
      {
        suggestedAction:
          "Set OPENAI_API_KEY in .env or the process environment and rerun the demo Embedding Store builder.",
      },
    );
  }

  const themes = await loadJsonArtifact<ThemesArtifactContent>(args.themesPath);
  const repository = new MemoryArtifactRepository();
  const embeddingClient = new OpenAIResponsesLLMClient(apiKey);
  const runtime = registerUpstreamBuilders({
    repository,
    promptResolver: new UnusedPromptResolver(),
    llmClient: new UnusedLLMClient(),
    semanticEmbeddingProvider: embeddingClient,
  });
  const topicRegistry = await createTopicRegistryArtifact(
    runtime,
    args.topicRegistryPath,
  );
  const input: TopicAssignmentBuilderInput = {
    company_id: themes.content.company_id,
    period_id: themes.content.period_id,
    filing_id: themes.content.filing_id,
    embedding_execution_mode: "ORIGINAL_EXECUTION",
  };
  const executionId = [
    input.company_id,
    input.period_id,
    "topic-assignment-original",
  ].join(":");
  const embeddingStore = new EmbeddingStore({
    schema_version: EMBEDDING_STORE_SCHEMA_VERSION,
    records: [],
  });
  const embeddingProvider = new CountingEmbeddingProvider(
    new SemanticEmbeddingProviderAdapter(embeddingClient),
  );
  const embeddingResolver = new EmbeddingResolver({
    store: embeddingStore,
    generator: new EmbeddingGenerator(embeddingProvider),
    execution_context: {
      execution_id: executionId,
      producer: TOPIC_ASSIGNMENT_BUILDER_TYPE,
    },
  });
  const builder = new TopicAssignmentBuilder(embeddingResolver);

  logger.info("Demo Embedding Store build started.", {
    company_id: input.company_id,
    period_id: input.period_id,
    themes_path: args.themesPath,
    topic_registry_path: args.topicRegistryPath,
  });

  await builder.executeWithTopicSignals({
    companyId: input.company_id,
    periodId: input.period_id,
    executionId,
    input,
    dependencies: {
      themes,
      topic_registry: topicRegistry,
    },
    recordPromptReference() {},
    recordModelReference() {},
  }, {
    generatedAt: new Date().toISOString(),
  });

  const embeddingStoreSource = exportEmbeddingStoreSource(embeddingStore);

  validateEmbeddingStoreSource(embeddingStoreSource);
  validateDemoCoverage({
    store: embeddingStoreSource,
    themeCount: themes.content.themes.length,
    topicCount: topicRegistry.content.topics.filter(
      ({ lifecycle_state }) => lifecycle_state === "active",
    ).length,
  });

  const outputPath = await writeEmbeddingStoreSource(
    args.outputPath,
    embeddingStoreSource,
  );

  logger.info("Demo Embedding Store build completed.", {
    embedding_generation_count: embeddingProvider.generationCount(),
    persisted_record_count: embeddingStore.listRecordIds().length,
    exported_record_count: embeddingStoreSource.records.length,
    output_path: outputPath,
  });
}

export function parseArguments(args: string[]): DemoEmbeddingStoreArguments {
  let themesPath = `${DEMO_ARTIFACTS_DIRECTORY}/02-themes.json`;
  let topicRegistryPath = "data/registry/topics.json";
  let outputPath =
    `${DEMO_EXECUTION_DIRECTORY}/07-embedding-execution-records.json`;
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

    if (argument === "--output" && value) {
      outputPath = value;
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
          "Use optional --themes <path>, --topic-registry <path>, --output <path>, and --debug.",
      },
    );
  }

  return {
    themesPath,
    topicRegistryPath,
    outputPath,
    debug,
  };
}

function exportEmbeddingStoreSource(
  store: EmbeddingStore,
): EmbeddingStoreSource {
  return {
    schema_version: EMBEDDING_STORE_SCHEMA_VERSION,
    records: store.listRecordIds()
      .map((recordId) => store.getRecord(recordId))
      .sort((left, right) =>
        [
          left.source.source_type.localeCompare(right.source.source_type),
          left.source.source_id.localeCompare(right.source.source_id),
          left.embedding.model_version.localeCompare(
            right.embedding.model_version,
          ),
        ].find((comparison) => comparison !== 0) ?? 0),
  };
}

function validateDemoCoverage(input: {
  store: EmbeddingStoreSource;
  themeCount: number;
  topicCount: number;
}): void {
  const themeEmbeddingCount = input.store.records.filter(({ source }) =>
    source.source_type === "topic_assignment_theme").length;
  const topicEmbeddingCount = input.store.records.filter(({ source }) =>
    source.source_type === "topic_assignment_topic").length;

  if (themeEmbeddingCount !== input.themeCount) {
    throw new ConfigurationError(
      "Demo Embedding Store does not contain one embedding for every Theme.",
      {
        suggestedAction:
          "Rerun original Topic Assignment embedding generation with the complete Themes artifact.",
      },
    );
  }

  if (topicEmbeddingCount !== input.topicCount) {
    throw new ConfigurationError(
      "Demo Embedding Store does not contain one embedding for every active Topic.",
      {
        suggestedAction:
          "Rerun original Topic Assignment embedding generation with the complete Topic Registry.",
      },
    );
  }
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
        builder_type: "topic-registry-demo-embedding-store-loader",
      },
    },
    schema_version: "topic-registry-artifact-v1",
    pipeline_version: "topic-registry-pipeline-v1",
    input_hash: calculateArtifactHash(rawRegistry),
    generation_duration_ms: 0,
  });
}

async function writeEmbeddingStoreSource(
  outputPath: string,
  source: EmbeddingStoreSource,
): Promise<string> {
  const resolvedOutputPath = resolve(outputPath);

  await mkdir(resolve(resolvedOutputPath, ".."), { recursive: true });
  await writeFile(
    resolvedOutputPath,
    `${JSON.stringify(source, null, 2)}\n`,
    "utf8",
  );

  return resolvedOutputPath;
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

class CountingEmbeddingProvider implements EmbeddingProvider {
  private count = 0;

  constructor(private readonly delegate: EmbeddingProvider) {}

  async generateEmbedding(
    input: EmbeddingProviderInput,
  ): Promise<EmbeddingProviderResult> {
    this.count += 1;

    return this.delegate.generateEmbedding(input);
  }

  generationCount(): number {
    return this.count;
  }
}

class SemanticEmbeddingProviderAdapter implements EmbeddingProvider {
  constructor(private readonly provider: {
    embed(input: {
      model: string;
      texts: string[];
    }): Promise<number[][]>;
  }) {}

  async generateEmbedding(
    input: EmbeddingProviderInput,
  ): Promise<EmbeddingProviderResult> {
    const embeddings = await this.provider.embed({
      model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      texts: [input.input_text],
    });
    const vector = embeddings[0];

    if (vector === undefined) {
      throw new PipelineExecutionError(
        "Semantic embedding provider did not return an embedding vector.",
      );
    }

    return {
      model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      dimensions: vector.length,
      vector,
    };
  }
}

class UnusedPromptResolver {
  resolve(): never {
    throw new PipelineExecutionError(
      "Demo Embedding Store generation must not resolve prompts.",
    );
  }

  render(): never {
    throw new PipelineExecutionError(
      "Demo Embedding Store generation must not render prompts.",
    );
  }
}

class UnusedLLMClient {
  async callLLM(): Promise<never> {
    throw new PipelineExecutionError(
      "Demo Embedding Store generation must not invoke an LLM.",
    );
  }
}

export async function buildDemoEmbeddingStoreCli(
  rawArguments: string[],
): Promise<number> {
  loadEnv();
  const debug = rawArguments.includes("--debug");

  try {
    await buildDemoEmbeddingStore(rawArguments);
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
  buildDemoEmbeddingStoreCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
