import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import { createLogger } from "../shared/logger.js";
import type { TopicDefinition, TopicRegistry } from "./topic.types.js";
import type { EmbeddingVector, TopicEmbeddingRegistry } from "./semantic-topic.types.js";
import { loadEnv } from "../shared/config/load.env.js";

const logger = createLogger("topic-embeddings");
const registryPath = join(process.cwd(), "data", "registry", "topics.json");
const embeddingRegistryPath = join(process.cwd(), "data", "registry", "topic-embeddings.json");
loadEnv();
export const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const openAIEmbeddingsUrl = "https://api.openai.com/v1/embeddings";

export async function generateTopicEmbeddings(): Promise<TopicEmbeddingRegistry> {
  const startedAt = Date.now();
  const registry = await readJsonFile<TopicRegistry>(registryPath);
  const topics = validateTopicDefinitions(registry.topics);
  const inputHash = calculateTopicEmbeddingInputHash(topics);
  const existing = await readExistingTopicEmbeddings();

  if (isTopicEmbeddingCacheValid(existing, inputHash, embeddingModel)) {
    logger.info("Topic embeddings skipped because source hash is unchanged.", {
      duration_ms: Date.now() - startedAt,
    });
    return existing as TopicEmbeddingRegistry;
  }

  if (topics.length === 0) {
    const emptyRegistry = buildTopicEmbeddingRegistry([], [], inputHash);
    await writeJsonFile(embeddingRegistryPath, emptyRegistry);
    logger.info("Topic embeddings written for empty registry.", {
      duration_ms: Date.now() - startedAt,
    });
    return emptyRegistry;
  }

  const embeddings = await createEmbeddings(topics.map(buildTopicEmbeddingInput));
  const output = buildTopicEmbeddingRegistry(topics, embeddings, inputHash);

  await writeJsonFile(embeddingRegistryPath, output);
  logger.info("Topic embeddings generated.", {
    duration_ms: Date.now() - startedAt,
    topic_count: topics.length,
  });

  return output;
}

export function calculateTopicEmbeddingInputHash(topics: TopicDefinition[]): string {
  return calculateStringHash(JSON.stringify(topics.map((topic) => ({
    topic_id: topic.topic_id,
    topic_name: topic.topic_name,
    description: topic.description ?? "",
  })).sort((left, right) => left.topic_id.localeCompare(right.topic_id))));
}

export function validateTopicDefinitions(topics: TopicDefinition[]): TopicDefinition[] {
  for (const topic of topics) {
    if (!topic.topic_id?.trim()) {
      throw new Error("Topic definition is missing topic_id.");
    }

    if (!topic.topic_name?.trim()) {
      throw new Error(`Topic "${topic.topic_id}" is missing topic_name.`);
    }
  }

  return [...topics].sort((left, right) => left.topic_id.localeCompare(right.topic_id));
}

export function buildTopicEmbeddingInput(topic: TopicDefinition): string {
  return `${topic.topic_name}\n${topic.description ?? ""}`.trim();
}

export function isTopicEmbeddingCacheValid(
  existing: TopicEmbeddingRegistry | null,
  inputHash: string,
  model: string,
): boolean {
  return Boolean(existing && existing.input_hash === inputHash && existing.embedding_model === model);
}

export async function createEmbeddings(inputs: string[]): Promise<EmbeddingVector[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings.");
  }

  const response = await fetch(openAIEmbeddingsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: inputs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embeddings request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const body = await response.json() as { data?: Array<{ embedding?: number[] }> };
  const embeddings = body.data?.map((item) => item.embedding);

  if (!embeddings || embeddings.some((embedding) => !Array.isArray(embedding))) {
    throw new Error("OpenAI embeddings response did not include valid embeddings.");
  }

  return embeddings as EmbeddingVector[];
}

async function readExistingTopicEmbeddings(): Promise<TopicEmbeddingRegistry | null> {
  if (!fileExists(embeddingRegistryPath)) {
    return null;
  }

  return readJsonFile<TopicEmbeddingRegistry>(embeddingRegistryPath);
}

function buildTopicEmbeddingRegistry(
  topics: TopicDefinition[],
  embeddings: EmbeddingVector[],
  inputHash: string,
): TopicEmbeddingRegistry {
  return {
    generated_at: getCurrentTimestamp(),
    embedding_model: embeddingModel,
    input_hash: inputHash,
    topics: topics.map((topic, index) => ({
      ...topic,
      embedding: embeddings[index] ?? [],
    })),
  };
}

if (require.main === module) {
  generateTopicEmbeddings().catch((error) => {
    logger.error("Topic embedding generation failed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  });
}
