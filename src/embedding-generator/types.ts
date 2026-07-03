export type EmbeddingRecordIdentityInput = {
  source_type: string;
  source_id: string;
  source_hash: string;
  model_version: string;
  vector: number[];
};
