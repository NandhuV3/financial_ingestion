import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import { validateArtifact } from "../../packages/artifact-framework/src/artifact-validation.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import { loadEnv } from "../../src/shared/config/load.env.js";
import { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { FilingArtifactContent } from "../structured-intelligence/types.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../topic-assignment-builder/types.js";
import { createArtifactDumpObserver } from "./artifact-dump.js";
import { MemoryArtifactRepository } from "./memory-artifact-repository.js";
import { OpenAIResponsesLLMClient } from "./openai-llm-client.js";
import { registerUpstreamBuilders } from "./register-builders.js";
import { runUpstreamPipeline } from "./run-upstream-pipeline.js";

type DemoArguments = {
  inputPath: string;
  outputDirectory: string;
};

loadEnv();

runDemo(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function runDemo(rawArguments: string[]): Promise<void> {
  const args = parseArguments(rawArguments);
  const filingArtifact = await loadFilingArtifact(args.inputPath);
  const topicRegistryArtifact = await loadTopicRegistryArtifact();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. Set it in .env or the process environment.",
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
  const result = await runUpstreamPipeline({
    runtime,
    filingArtifact,
    topicRegistryArtifact,
    companyId: requireIdentity(filingArtifact.identity.company_id, "company_id"),
    periodId: requireIdentity(filingArtifact.identity.period_id, "period_id"),
    onArtifact: artifactDumps.observer,
  });

  console.log(`Upstream pipeline completed for ${result.content.company_id} ${result.content.period_id}.`);
  console.log(`Artifacts saved to ${artifactDumps.outputDirectory}`);
}

async function loadTopicRegistryArtifact(): Promise<
  Artifact<TopicRegistryArtifactContent>
> {
  const registryPath = resolve("data/registry/topic-embeddings.json");
  const parsed = JSON.parse(await readFile(registryPath, "utf8")) as {
    embedding_model?: string;
    input_hash?: string;
    topics?: Array<Omit<TopicRegistryEntry, "status">>;
  };

  if (
    typeof parsed.embedding_model !== "string"
    || typeof parsed.input_hash !== "string"
    || !Array.isArray(parsed.topics)
  ) {
    throw new Error(
      "data/registry/topic-embeddings.json must contain model, hash, and topics.",
    );
  }

  const content: TopicRegistryArtifactContent = {
    registry_version: parsed.input_hash,
    registry_status: "active",
    similarity_model_version: parsed.embedding_model,
    topics: parsed.topics.map((topic) => ({
      ...topic,
      status: ArtifactStatus.ACTIVE,
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

function parseArguments(args: string[]): DemoArguments {
  let inputPath: string | undefined;
  let outputDirectory = "output/demo";

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

    throw new Error(`Unknown or incomplete argument: ${argument ?? ""}`);
  }

  if (!inputPath) {
    throw new Error(
      "Usage: npm run demo:upstream -- --input <filing-artifact.json> [--output output/demo]",
    );
  }

  return {
    inputPath: resolve(inputPath),
    outputDirectory,
  };
}

async function loadFilingArtifact(
  inputPath: string,
): Promise<Artifact<FilingArtifactContent>> {
  const parsed = JSON.parse(await readFile(inputPath, "utf8")) as Artifact<unknown>;
  validateArtifact(parsed);

  if (parsed.identity.artifact_type !== "filing") {
    throw new Error("Demo input must be an Artifact<FilingArtifactContent> with artifact_type filing.");
  }

  if (calculateArtifactHash(parsed.content) !== parsed.metadata.artifact_hash) {
    throw new Error("Demo filing artifact_hash does not match its content.");
  }

  return parsed as Artifact<FilingArtifactContent>;
}

function requireIdentity(
  value: string | null,
  field: string,
): string {
  if (!value) {
    throw new Error(`Demo filing identity.${field} must be populated.`);
  }

  return value;
}
