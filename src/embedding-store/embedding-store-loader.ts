/**
 * Filesystem loader for the static Embedding Store bootstrap.
 *
 * The loader reads the tracked JSON store source, validates it through the
 * read-only Embedding Store implementation, and reports structured load
 * events. It does not generate, mutate, or persist embeddings.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  EmbeddingStoreSource,
} from "../../contracts/execution/embedding-store-contract.js";
import { createLogger } from "../shared/logger.js";
import {
  EmbeddingStore,
  EmbeddingStoreError,
} from "./embedding-store.js";

export const DEFAULT_EMBEDDING_STORE_PATH =
  "src/embedding-store/embedding-execution-records.json";

const logger = createLogger("embedding-store");

export async function loadEmbeddingStore(
  sourcePath = DEFAULT_EMBEDDING_STORE_PATH,
): Promise<EmbeddingStore> {
  logger.info("Loading Embedding Store.", {
    source_path: sourcePath,
  });

  try {
    const parsed = JSON.parse(
      await readFile(resolve(sourcePath), "utf8"),
    ) as EmbeddingStoreSource;
    const store = new EmbeddingStore(parsed);

    logger.info("Embedding Store validation succeeded.", {
      source_path: sourcePath,
      record_count: store.listRecordIds().length,
    });

    return store;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error("Embedding Store validation failed.", {
      source_path: sourcePath,
      error_message: message,
    });

    if (error instanceof EmbeddingStoreError) {
      throw error;
    }

    throw new EmbeddingStoreError(
      `Failed to load Embedding Store source: ${sourcePath}`,
      {
        cause: error,
        suggestedAction:
          "Verify the Embedding Store source path and JSON syntax.",
      },
    );
  }
}
