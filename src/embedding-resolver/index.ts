/**
 * Public entry point for Embedding Resolver consumers.
 *
 * Exports the resolver policy implementation and its validation error. Builders
 * should obtain Embedding Execution Records through this abstraction rather
 * than calling the store or generator directly.
 */
export {
  EmbeddingResolver,
  EmbeddingResolverError,
} from "./embedding-resolver.js";
export type {
  EmbeddingResolverDependencies,
} from "./types.js";
