export const EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION =
  "execution-record-reference-v1";

export type ExecutionRecordReference = {
  schema_version: typeof EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION;
  record_type: string;
  record_id: string;
  record_hash: string;
  producer: string;
  execution_id: string;
};
