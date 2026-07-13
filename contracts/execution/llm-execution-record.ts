import type {
  ExecutionError,
  ExecutionMetadata,
  ExecutionStatus,
} from "./llm-execution-models.js";

export const LLM_EXECUTION_RECORD_SCHEMA_VERSION =
  "llm-execution-record-v1";

export type LLMExecutionRecordType = "llm_execution";

export type LLMExecutionRecordPrompt = {
  prompt_id: string;
  prompt_version: string;
  activation_id: string | null;
  render_hash: string;
};

export type LLMExecutionRecordModel = {
  model_id: string;
  model_version: string;
};

export type LLMExecutionRecordProvider = {
  provider_id: string;
};

export type LLMExecutionRecordExecution = {
  execution_id: string;
  execution_mode: ExecutionMetadata["execution_mode"];
  producer: string;
  generated_at: string;
};

export type LLMExecutionRecordResult = {
  status: ExecutionStatus;
  output_hash: string | null;
  error: ExecutionError | null;
};

export type LLMExecutionRecord = {
  schema_version: typeof LLM_EXECUTION_RECORD_SCHEMA_VERSION;
  record_type: LLMExecutionRecordType;
  record_id: string;
  record_hash: string;
  producer: string;
  execution_id: string;
  prompt: LLMExecutionRecordPrompt;
  model: LLMExecutionRecordModel;
  provider: LLMExecutionRecordProvider;
  execution: LLMExecutionRecordExecution;
  result: LLMExecutionRecordResult;
};
