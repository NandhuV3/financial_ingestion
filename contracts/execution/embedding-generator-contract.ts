import type {
  EmbeddingExecutionRecord,
  EmbeddingExecutionRecordEmbedding,
  EmbeddingExecutionRecordSource,
} from "./embedding-execution-record.js";

export const EMBEDDING_GENERATOR_CONTRACT_VERSION =
  "embedding-generator-v1";

export type EmbeddingGeneratorExecutionContext = {
  execution_id: string;
  producer: string;
};

export type EmbeddingGeneratorInput = {
  execution_context: EmbeddingGeneratorExecutionContext;
  source: EmbeddingExecutionRecordSource;
  input_text: string;
};

export type EmbeddingProviderInput = {
  input_text: string;
};

export type EmbeddingProviderResult = EmbeddingExecutionRecordEmbedding;

export type EmbeddingProvider = {
  generateEmbedding(input: EmbeddingProviderInput): Promise<EmbeddingProviderResult>;
};

export type EmbeddingGeneratorReader = {
  generate(input: EmbeddingGeneratorInput): Promise<EmbeddingExecutionRecord>;
};
