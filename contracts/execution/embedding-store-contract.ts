import type {
  EmbeddingExecutionRecord,
} from "./embedding-execution-record.js";

export const EMBEDDING_STORE_SCHEMA_VERSION = "embedding-store-v1";

export type EmbeddingStoreSource = {
  schema_version: typeof EMBEDDING_STORE_SCHEMA_VERSION;
  records: EmbeddingExecutionRecord[];
};

export type EmbeddingStoreLookupRequest = {
  source_type: string;
  source_id: string;
  source_hash: string;
  embedding_model_version: string;
};

export type EmbeddingStoreReader = {
  getRecord(recordId: string): EmbeddingExecutionRecord;
  hasRecord(recordId: string): boolean;
  listRecordIds(): string[];
  lookupRecord(
    request: EmbeddingStoreLookupRequest,
  ): EmbeddingExecutionRecord | undefined;
};
