import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import { validateArtifact } from "../../packages/artifact-framework/src/artifact-validation.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  ArtifactValidationError,
  ConfigurationError,
  PipelineExecutionError,
  PlatformError,
  platformErrorMessage,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  normalizePlatformError,
  renderPlatformError,
} from "../../packages/builder-framework/src/platform-error-renderer.js";
import { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import type { FilingArtifactContent } from "../structured-intelligence/types.js";
import type {
  TopicRegistryArtifactContent,
} from "../topic-assignment-builder/types.js";
import { createArtifactDumpObserver } from "./artifact-dump.js";
import { MemoryArtifactRepository } from "./memory-artifact-repository.js";
import { OpenAIResponsesLLMClient } from "./openai-llm-client.js";
import { registerUpstreamBuilders } from "./register-builders.js";
import { runUpstreamPipeline } from "./run-upstream-pipeline.js";

export type DemoArguments = {
  inputPath: string;
  outputDirectory: string;
  debug: boolean;
};

type StoredTopicRegistryEntry = {
  topic_id: string;
  topic_name: string;
  description?: string;
  theme_variants?: string[];
  embedding: number[];
};

export async function runDemo(rawArguments: string[]): Promise<void> {
  const args = parseArguments(rawArguments);
  const filingArtifact = await loadFilingArtifact(args.inputPath);
  const topicRegistryArtifact = await loadTopicRegistryArtifact();
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
  const artifactDumps = createArtifactDumpObserver(args.outputDirectory);

  await repository.create(filingArtifact);
  await repository.create(topicRegistryArtifact);

  try {
    const result = await runUpstreamPipeline({
      runtime,
      filingArtifact,
      topicRegistryArtifact,
      companyId: requireIdentity(
        filingArtifact.identity.company_id,
        "company_id",
      ),
      periodId: requireIdentity(
        filingArtifact.identity.period_id,
        "period_id",
      ),
      onArtifact: artifactDumps.observer,
    });

    console.log(
      `Upstream pipeline completed for ${result.content.company_id} ${result.content.period_id}.`,
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

async function loadTopicRegistryArtifact(): Promise<
  Artifact<TopicRegistryArtifactContent>
> {
  const registryPath = resolve("data/registry/topic-embeddings.json");
  let parsed: {
    embedding_model?: string;
    input_hash?: string;
    topics?: StoredTopicRegistryEntry[];
  };

  try {
    parsed = JSON.parse(await readFile(registryPath, "utf8")) as typeof parsed;
  } catch (error) {
    throw new ArtifactValidationError(
      `Topic Registry artifact could not be loaded: ${platformErrorMessage(error)}`,
      {
        cause: error,
        suggestedAction:
          "Generate data/registry/topic-embeddings.json and retry.",
      },
    );
  }

  if (
    typeof parsed.embedding_model !== "string"
    || typeof parsed.input_hash !== "string"
    || !Array.isArray(parsed.topics)
  ) {
    throw new ArtifactValidationError(
      "data/registry/topic-embeddings.json must contain model, hash, and topics.",
      {
        suggestedAction:
          "Regenerate the Topic Registry artifact with valid model, hash, and topic entries.",
      },
    );
  }

  const content: TopicRegistryArtifactContent = {
    registry_version: parsed.input_hash,
    registry_status: "active",
    similarity_model_version: parsed.embedding_model,
    topics: parsed.topics.map((topic) => ({
      topic_id: topic.topic_id,
      topic_name: topic.topic_name,
      definition: topic.description ?? topic.topic_name,
      aliases: topic.theme_variants ?? [],
      status: ArtifactStatus.ACTIVE,
      embedding: topic.embedding,
    })),
  };

  return {
    identity: {
      artifact_id: `topic-registry-${parsed.input_hash}`,
      artifact_type: "topic_registry",
      company_id: null,
      period_id: null,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "topic-registry-artifact-v1",
      pipeline_version: "topic-registry-loader-v1",
      generated_at: new Date().toISOString(),
      artifact_hash: calculateArtifactHash(content),
      input_hash: calculateArtifactHash(parsed),
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "topic-registry-loader",
      },
    },
    content,
  };
}

export function parseArguments(args: string[]): DemoArguments {
  let inputPath: string | undefined;
  let outputDirectory = "output/demo";
  let debug = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--input" && value) {
      inputPath = value;
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
          "Use --input <filing-artifact.json>, optional --output <directory>, and optional --debug.",
      },
    );
  }

  if (!inputPath) {
    throw new ConfigurationError(
      "Usage: npm run demo:upstream -- --input <filing-artifact.json> [--output output/demo] [--debug]",
      {
        suggestedAction: "Provide the required --input filing artifact path.",
      },
    );
  }

  return {
    inputPath: resolve(inputPath),
    outputDirectory,
    debug,
  };
}

async function loadFilingArtifact(
  inputPath: string,
): Promise<Artifact<FilingArtifactContent>> {
  let parsed: Artifact<unknown>;

  try {
    parsed = JSON.parse(await readFile(inputPath, "utf8")) as Artifact<unknown>;
    validateArtifact(parsed);
  } catch (error) {
    throw new ArtifactValidationError(
      `Demo filing artifact could not be loaded or validated: ${platformErrorMessage(error)}`,
      {
        cause: error,
        suggestedAction: "Provide a valid filing artifact JSON file and retry.",
      },
    );
  }

  if (parsed.identity.artifact_type !== "filing") {
    throw new ArtifactValidationError(
      "Demo input must be an Artifact<FilingArtifactContent> with artifact_type filing.",
      {
        suggestedAction: "Use a filing artifact as the --input value.",
      },
    );
  }

  if (calculateArtifactHash(parsed.content) !== parsed.metadata.artifact_hash) {
    throw new ArtifactValidationError(
      "Demo filing artifact_hash does not match its content.",
      {
        suggestedAction:
          "Regenerate the filing artifact hash from the unchanged content.",
      },
    );
  }

  return parsed as Artifact<FilingArtifactContent>;
}

function requireIdentity(
  value: string | null,
  field: string,
): string {
  if (!value) {
    throw new ArtifactValidationError(
      `Demo filing identity.${field} must be populated.`,
      {
        suggestedAction: `Populate filing identity.${field} and retry.`,
      },
    );
  }

  return value;
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
