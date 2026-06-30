import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  TopicRegistryArtifactContent,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  ConfigurationError,
  PipelineExecutionError,
  PlatformError,
  platformErrorMessage,
} from "../../packages/builder-framework/src/platform-error.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import {
  createArtifactDumpObserver,
  resetArtifactDumps,
} from "./artifact-dump.js";
import { MemoryArtifactRepository } from "./memory-artifact-repository.js";
import {
  loadNormalizedFilingBuilderInput,
} from "./normalized-filing-adapter.js";
import { OpenAIResponsesLLMClient } from "./openai-llm-client.js";
import { registerUpstreamBuilders } from "./register-builders.js";
import { runUpstreamPipeline } from "./run-upstream-pipeline.js";

export type DemoArguments = {
  ticker: string;
  filingDate?: string;
  outputDirectory: string;
  debug: boolean;
};

export async function runDemo(rawArguments: string[]): Promise<void> {
  const args = parseArguments(rawArguments);
  const normalizedFiling = await loadNormalizedFilingBuilderInput({
    ticker: args.ticker,
    filingDate: args.filingDate,
  });
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "OPENAI_API_KEY is required. Set it in .env or the process environment.",
      {
        suggestedAction:
          "Set OPENAI_API_KEY in .env or the process environment and rerun the demo.",
      },
    );
  }

  const repository = new MemoryArtifactRepository();
  const modelClient = new OpenAIResponsesLLMClient(apiKey);
  const runtime = registerUpstreamBuilders({
    repository,
    promptResolver: new PromptResolver(),
    llmClient: modelClient,
    semanticEmbeddingProvider: modelClient,
    themesModelVersion: process.env.OPENAI_MODEL,
    structuredIntelligenceModelVersion: process.env.OPENAI_MODEL,
  });
  const topicRegistry = await createDemoTopicRegistryArtifact(runtime);
  const artifactDumps = createArtifactDumpObserver(args.outputDirectory);

  await resetArtifactDumps(args.outputDirectory);

  try {
    const result = await runUpstreamPipeline({
      runtime,
      normalizedFiling: normalizedFiling.builderInput,
      topicRegistry,
      onArtifact: artifactDumps.observer,
    });

    console.log(
      `Sprint 002 upstream pipeline completed for ${result.content.company_id} ${result.content.period_id}.`,
    );
    console.log(`Artifacts saved to ${artifactDumps.outputDirectory}`);
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }

    throw new PipelineExecutionError(platformErrorMessage(error), {
      cause: error,
      suggestedAction:
        "Run again with --debug and inspect the failing pipeline stage.",
    });
  }
}

async function createDemoTopicRegistryArtifact(
  runtime: ReturnType<typeof registerUpstreamBuilders>,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  const registryPath = resolve("data/registry/topics.json");
  const rawRegistry = JSON.parse(
    await readFile(registryPath, "utf8"),
  ) as LegacyTopicRegistryFile;
  const content: TopicRegistryArtifactContent = {
    registry_version: parseRegistryVersion(rawRegistry.version),
    topics: rawRegistry.topics.map((topic) => ({
      topic_id: topic.topic_id,
      canonical_name: topic.topic_name,
      definition: topic.description,
      aliases: topic.theme_variants,
      lifecycle_state: "active",
      created_registry_version: 1,
      updated_registry_version: parseRegistryVersion(rawRegistry.version),
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
        builder_type: "topic-registry-demo-loader",
      },
    },
    schema_version: "topic-registry-artifact-v1",
    pipeline_version: "topic-registry-pipeline-v1",
    input_hash: calculateArtifactHash(rawRegistry),
    generation_duration_ms: 0,
  });
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
      `Invalid Topic Registry version in data/registry/topics.json: ${version}`,
      {
        suggestedAction:
          "Update data/registry/topics.json to use a positive semantic version.",
      },
    );
  }

  return majorVersion;
}

export function parseArguments(args: string[]): DemoArguments {
  let ticker = "MSFT";
  let filingDate: string | undefined;
  let outputDirectory = "output/demo";
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--ticker" && value) {
      ticker = value;
      index += 1;
      continue;
    }

    if (argument === "--filing-date" && value) {
      filingDate = value;
      index += 1;
      continue;
    }

    if (argument === "--output" && value) {
      outputDirectory = value;
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
          "Use optional --ticker <ticker>, --filing-date <YYYY-MM-DD>, --output <directory>, and --debug.",
      },
    );
  }

  if (ticker.trim() === "") {
    throw new ConfigurationError(
      "Ticker must be a non-empty value.",
      {
        suggestedAction: "Provide a valid ticker with --ticker.",
      },
    );
  }

  return {
    ticker: ticker.trim().toUpperCase(),
    filingDate,
    outputDirectory,
    debug,
  };
}

export async function runDemoCli(rawArguments: string[]): Promise<number> {
  loadEnv();
  const debug = rawArguments.includes("--debug");

  try {
    await runDemo(rawArguments);
    return 0;
  } catch (error) {
    console.error(
      renderPlatformError(normalizePlatformError(error), { debug }),
    );
    return 1;
  }
}

if (require.main === module) {
  runDemoCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
