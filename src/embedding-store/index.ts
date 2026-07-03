/**
 * Public entry point for Embedding Store bootstrap consumers.
 *
 * Exports the read-only store, validation error, and filesystem loader used
 * by downstream execution to retrieve immutable Embedding Execution Records.
 */
export {
  EmbeddingStore,
  EmbeddingStoreError,
  validateEmbeddingStoreSource,
} from "./embedding-store.js";
export {
  DEFAULT_EMBEDDING_STORE_PATH,
  loadEmbeddingStore,
} from "./embedding-store-loader.js";
