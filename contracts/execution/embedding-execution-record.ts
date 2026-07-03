export const EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION =
  "embedding-execution-record-v1";

export type EmbeddingExecutionRecordType = "embedding";

export type EmbeddingExecutionRecordSource = {
  source_type: string;
  source_id: string;
  source_hash: string;
};

export type EmbeddingExecutionRecordEmbedding = {
  model: string;
  model_version: string;
  dimensions: number;
  vector: number[];
};

export type EmbeddingExecutionRecord = {
  schema_version: typeof EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION;
  record_type: EmbeddingExecutionRecordType;
  record_id: string;
  record_hash: string;
  producer: string;
  execution_id: string;
  source: EmbeddingExecutionRecordSource;
  embedding: EmbeddingExecutionRecordEmbedding;
};
