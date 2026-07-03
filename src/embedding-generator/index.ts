/**
 * Public entry point for Embedding Generator consumers.
 *
 * Exports the provider boundary, deterministic record identity helpers, and
 * generator implementation. This package does not expose persistence, replay,
 * similarity computation, or provider-specific clients.
 */
export {
  EmbeddingGenerator,
  EmbeddingGeneratorError,
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "./embedding-generator.js";
export type {
  EmbeddingRecordIdentityInput,
} from "./types.js";
