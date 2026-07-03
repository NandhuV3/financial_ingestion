import type {
  EmbeddingExecutionRecord,
} from "./embedding-execution-record.js";
import type {
  EmbeddingGeneratorExecutionContext,
} from "./embedding-generator-contract.js";

export const EMBEDDING_RESOLVER_CONTRACT_VERSION =
  "embedding-resolver-v1";

export const EMBEDDING_RESOLUTION_MODES = [
  "ORIGINAL_EXECUTION",
  "REPLAY",
] as const;

export type EmbeddingResolutionMode =
  typeof EMBEDDING_RESOLUTION_MODES[number];

export type EmbeddingResolverExecutionContext =
  EmbeddingGeneratorExecutionContext;

export type EmbeddingResolverRequest = {
  execution_mode: EmbeddingResolutionMode;
  source_type: string;
  source_id: string;
  source_hash: string;
  embedding_model: string;
  embedding_model_version: string;
  source_text: string;
};

export type EmbeddingResolverReader = {
  resolve(request: EmbeddingResolverRequest): Promise<EmbeddingExecutionRecord>;
};
