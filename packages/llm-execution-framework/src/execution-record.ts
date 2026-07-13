import type {
  ExecutionRecordReference,
} from "../../../contracts/framework/execution-record-reference.js";
import {
  EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
} from "../../../contracts/framework/execution-record-reference.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import {
  LLM_EXECUTION_RECORD_SCHEMA_VERSION,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  ExecutionMetadata,
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import { LLMExecutionValidationError } from "./errors.js";

export function createLLMExecutionRecord<TStructuredOutput>(input: {
  prompt_package: LLMPromptPackage;
  result: ExecutionResult<TStructuredOutput>;
}): LLMExecutionRecord {
  const metadata = input.result.metadata;
  const outputHash = input.result.status === "succeeded"
    ? stableHash(input.result.output)
    : null;
  const recordWithoutHashes: {
    schema_version: typeof LLM_EXECUTION_RECORD_SCHEMA_VERSION;
    record_type: "llm_execution";
    producer: string;
    execution_id: string;
    prompt: LLMExecutionRecord["prompt"];
    model: LLMExecutionRecord["model"];
    provider: LLMExecutionRecord["provider"];
    execution: LLMExecutionRecord["execution"];
    result: LLMExecutionRecord["result"];
  } = {
    schema_version: LLM_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "llm_execution" as const,
    producer: metadata.producer,
    execution_id: metadata.execution_id,
    prompt: {
      prompt_id: metadata.prompt_id,
      prompt_version: metadata.prompt_version,
      activation_id: input.prompt_package.activation_id,
      render_hash: input.prompt_package.render_hash,
    },
    model: {
      model_id: metadata.model_id,
      model_version: metadata.model_version,
    },
    provider: {
      provider_id: metadata.provider_id,
    },
    execution: executionFromMetadata(metadata),
    result: {
      status: input.result.status,
      output_hash: outputHash,
      error: input.result.status === "failed" ? input.result.error : null,
    },
  };
  const recordId = llmExecutionRecordId(recordWithoutHashes);
  const record: LLMExecutionRecord = {
    ...recordWithoutHashes,
    record_id: recordId,
    record_hash: stableHash({
      ...recordWithoutHashes,
      record_id: recordId,
    }),
  };

  validateLLMExecutionRecord(record);

  return record;
}

export function llmExecutionRecordReference(
  record: LLMExecutionRecord,
): ExecutionRecordReference {
  validateLLMExecutionRecord(record);

  return {
    schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
    record_type: record.record_type,
    record_id: record.record_id,
    record_hash: record.record_hash,
    producer: record.producer,
    execution_id: record.execution_id,
  };
}

export function validateLLMExecutionRecord(
  record: LLMExecutionRecord,
): void {
  requireText(record.schema_version, "LLMExecutionRecord.schema_version");

  if (record.schema_version !== LLM_EXECUTION_RECORD_SCHEMA_VERSION) {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord.schema_version is invalid.",
    );
  }

  if (record.record_type !== "llm_execution") {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord.record_type is invalid.",
    );
  }

  requireText(record.record_id, "LLMExecutionRecord.record_id");
  requireText(record.record_hash, "LLMExecutionRecord.record_hash");
  requireText(record.producer, "LLMExecutionRecord.producer");
  requireText(record.execution_id, "LLMExecutionRecord.execution_id");
  requireText(record.prompt.prompt_id, "LLMExecutionRecord.prompt.prompt_id");
  requireText(
    record.prompt.prompt_version,
    "LLMExecutionRecord.prompt.prompt_version",
  );
  requireText(
    record.prompt.render_hash,
    "LLMExecutionRecord.prompt.render_hash",
  );
  requireText(record.model.model_id, "LLMExecutionRecord.model.model_id");
  requireText(
    record.model.model_version,
    "LLMExecutionRecord.model.model_version",
  );
  requireText(
    record.provider.provider_id,
    "LLMExecutionRecord.provider.provider_id",
  );
  requireText(
    record.execution.execution_id,
    "LLMExecutionRecord.execution.execution_id",
  );

  if (record.execution.execution_id !== record.execution_id) {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord execution_id values must match.",
    );
  }

  if (record.execution.producer !== record.producer) {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord producer values must match.",
    );
  }

  const expectedRecordId = llmExecutionRecordId({
    schema_version: record.schema_version,
    record_type: record.record_type,
    producer: record.producer,
    execution_id: record.execution_id,
    prompt: record.prompt,
    model: record.model,
    provider: record.provider,
    execution: record.execution,
    result: record.result,
  });

  if (record.record_id !== expectedRecordId) {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord.record_id is not deterministic.",
    );
  }

  const expectedRecordHash = stableHash({
    schema_version: record.schema_version,
    record_type: record.record_type,
    producer: record.producer,
    execution_id: record.execution_id,
    prompt: record.prompt,
    model: record.model,
    provider: record.provider,
    execution: record.execution,
    result: record.result,
    record_id: record.record_id,
  });

  if (record.record_hash !== expectedRecordHash) {
    throw new LLMExecutionValidationError(
      "LLMExecutionRecord.record_hash is not deterministic.",
    );
  }
}

function executionFromMetadata(
  metadata: ExecutionMetadata,
): LLMExecutionRecord["execution"] {
  return {
    execution_id: metadata.execution_id,
    execution_mode: metadata.execution_mode,
    producer: metadata.producer,
    generated_at: metadata.generated_at,
  };
}

function llmExecutionRecordId(input: {
  schema_version: typeof LLM_EXECUTION_RECORD_SCHEMA_VERSION;
  record_type: LLMExecutionRecord["record_type"];
  producer: string;
  execution_id: string;
  prompt: LLMExecutionRecord["prompt"];
  model: LLMExecutionRecord["model"];
  provider: LLMExecutionRecord["provider"];
  execution: LLMExecutionRecord["execution"];
  result: LLMExecutionRecord["result"];
}): string {
  return `llm-execution:${stableHash(input)}`;
}

function requireText(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LLMExecutionValidationError(`${fieldName} is required.`);
  }
}
