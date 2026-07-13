import type {
  ReplayRequestValidator,
} from "../../../contracts/execution/llm-replay-policy-contract.js";
import {
  REPLAY_MODES,
  type ReplayRequest,
  type ReplayValidationIssue,
  type ReplayValidationResult,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import { LLM_EXECUTION_RECORD_SCHEMA_VERSION } from "../../../contracts/execution/llm-execution-record.js";
import { LLMReplayPolicyValidationError } from "./errors.js";

export class DeterministicReplayRequestValidator
  implements ReplayRequestValidator {
  validate(request: ReplayRequest): ReplayValidationResult {
    return validateReplayRequest(request);
  }
}

export function assertValidReplayRequest(request: ReplayRequest): void {
  const validation = validateReplayRequest(request);

  if (!validation.valid) {
    throw new LLMReplayPolicyValidationError(
      validation.issues.map((issue) => issue.message).join(" "),
    );
  }
}

export function validateReplayRequest(
  request: ReplayRequest,
): ReplayValidationResult {
  const issues: ReplayValidationIssue[] = [];

  if (!isObject(request)) {
    return validationResult([
      issue("invalid_request", "ReplayRequest must be an object."),
    ]);
  }

  if (!REPLAY_MODES.includes(request.replay_mode)) {
    issues.push(issue(
      "invalid_replay_mode",
      "ReplayRequest.replay_mode is invalid.",
    ));
  }

  validatePolicyMetadata(request.policy_metadata, issues);
  validateReplayReference(request.replay_reference, issues);

  return validationResult(issues);
}

function validateReplayReference(
  reference: ReplayRequest["replay_reference"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(reference)) {
    issues.push(issue(
      "invalid_replay_reference",
      "ReplayRequest.replay_reference must be an object.",
    ));
    return;
  }

  validateArtifactReference(reference.artifact_reference, issues);
  validateExecutionRecord(reference.execution_record, issues);
  validatePromptReference(reference.prompt_reference, issues);
  validateExecutionContext(reference.execution_context, issues);
  requireText(reference.model?.model_id, "ReplayReference.model.model_id", issues);
  requireText(
    reference.model?.model_version,
    "ReplayReference.model.model_version",
    issues,
  );
  requireText(
    reference.provider?.provider_id,
    "ReplayReference.provider.provider_id",
    issues,
  );

  if (
    isObject(reference.execution_record)
      && reference.execution_record.prompt?.prompt_id
        !== reference.prompt_reference?.prompt_id
  ) {
    issues.push(issue(
      "prompt_reference_mismatch",
      "ReplayReference.prompt_reference.prompt_id must match execution record prompt_id.",
    ));
  }

  if (
    isObject(reference.execution_record)
      && reference.execution_record.prompt?.prompt_version
        !== reference.prompt_reference?.prompt_version
  ) {
    issues.push(issue(
      "prompt_version_mismatch",
      "ReplayReference.prompt_reference.prompt_version must match execution record prompt_version.",
    ));
  }

  if (
    isObject(reference.execution_record)
      && reference.execution_record.execution?.execution_id
        !== reference.execution_context?.execution_id
  ) {
    issues.push(issue(
      "execution_context_mismatch",
      "ReplayReference.execution_context.execution_id must match execution record execution_id.",
    ));
  }

  if (
    isObject(reference.execution_record)
      && reference.execution_record.model?.model_id !== reference.model?.model_id
  ) {
    issues.push(issue(
      "model_reference_mismatch",
      "ReplayReference.model.model_id must match execution record model_id.",
    ));
  }

  if (
    isObject(reference.execution_record)
      && reference.execution_record.model?.model_version
        !== reference.model?.model_version
  ) {
    issues.push(issue(
      "model_version_mismatch",
      "ReplayReference.model.model_version must match execution record model_version.",
    ));
  }

  if (
    isObject(reference.execution_record)
      && reference.execution_record.provider?.provider_id
        !== reference.provider?.provider_id
  ) {
    issues.push(issue(
      "provider_reference_mismatch",
      "ReplayReference.provider.provider_id must match execution record provider_id.",
    ));
  }
}

function validateArtifactReference(
  artifactReference: ReplayRequest["replay_reference"]["artifact_reference"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(artifactReference)) {
    issues.push(issue(
      "invalid_artifact_reference",
      "ReplayReference.artifact_reference must be an object.",
    ));
    return;
  }

  requireText(
    artifactReference.artifact_id,
    "ReplayReference.artifact_reference.artifact_id",
    issues,
  );
  requireText(
    artifactReference.artifact_type,
    "ReplayReference.artifact_reference.artifact_type",
    issues,
  );
  if (
    typeof artifactReference.version !== "number"
      || !Number.isInteger(artifactReference.version)
      || artifactReference.version <= 0
  ) {
    issues.push(issue(
      "invalid_artifact_version",
      "ReplayReference.artifact_reference.version must be a positive integer.",
    ));
  }
  requireText(
    artifactReference.artifact_hash,
    "ReplayReference.artifact_reference.artifact_hash",
    issues,
  );
  requireText(
    artifactReference.input_hash,
    "ReplayReference.artifact_reference.input_hash",
    issues,
  );
}

function validateExecutionRecord(
  executionRecord: ReplayRequest["replay_reference"]["execution_record"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(executionRecord)) {
    issues.push(issue(
      "invalid_execution_record",
      "ReplayReference.execution_record must be an object.",
    ));
    return;
  }

  if (executionRecord.schema_version !== LLM_EXECUTION_RECORD_SCHEMA_VERSION) {
    issues.push(issue(
      "invalid_execution_record_schema",
      "ReplayReference.execution_record.schema_version is invalid.",
    ));
  }
  if (executionRecord.record_type !== "llm_execution") {
    issues.push(issue(
      "invalid_execution_record_type",
      "ReplayReference.execution_record.record_type is invalid.",
    ));
  }
  requireText(executionRecord.record_id, "ReplayReference.execution_record.record_id", issues);
  requireText(
    executionRecord.record_hash,
    "ReplayReference.execution_record.record_hash",
    issues,
  );
  requireText(executionRecord.producer, "ReplayReference.execution_record.producer", issues);
  requireText(
    executionRecord.execution_id,
    "ReplayReference.execution_record.execution_id",
    issues,
  );
  requireText(
    executionRecord.prompt?.prompt_id,
    "ReplayReference.execution_record.prompt.prompt_id",
    issues,
  );
  requireText(
    executionRecord.prompt?.prompt_version,
    "ReplayReference.execution_record.prompt.prompt_version",
    issues,
  );
  requireText(
    executionRecord.prompt?.render_hash,
    "ReplayReference.execution_record.prompt.render_hash",
    issues,
  );
}

function validatePromptReference(
  promptReference: ReplayRequest["replay_reference"]["prompt_reference"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(promptReference)) {
    issues.push(issue(
      "invalid_prompt_reference",
      "ReplayReference.prompt_reference must be an object.",
    ));
    return;
  }

  requireText(
    promptReference.prompt_id,
    "ReplayReference.prompt_reference.prompt_id",
    issues,
  );
  requireText(
    promptReference.prompt_version,
    "ReplayReference.prompt_reference.prompt_version",
    issues,
  );
  requireText(
    promptReference.content_hash,
    "ReplayReference.prompt_reference.content_hash",
    issues,
  );
}

function validateExecutionContext(
  executionContext: ReplayRequest["replay_reference"]["execution_context"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(executionContext)) {
    issues.push(issue(
      "invalid_execution_context",
      "ReplayReference.execution_context must be an object.",
    ));
    return;
  }

  requireText(
    executionContext.execution_id,
    "ReplayReference.execution_context.execution_id",
    issues,
  );
  requireText(
    executionContext.producer,
    "ReplayReference.execution_context.producer",
    issues,
  );
  requireText(
    executionContext.generated_at,
    "ReplayReference.execution_context.generated_at",
    issues,
  );
}

function validatePolicyMetadata(
  policyMetadata: ReplayRequest["policy_metadata"],
  issues: ReplayValidationIssue[],
): void {
  if (!isObject(policyMetadata)) {
    issues.push(issue(
      "invalid_policy_metadata",
      "ReplayRequest.policy_metadata must be an object.",
    ));
    return;
  }

  requireText(policyMetadata.policy_id, "ReplayPolicyMetadata.policy_id", issues);
  requireText(
    policyMetadata.policy_version,
    "ReplayPolicyMetadata.policy_version",
    issues,
  );
}

function validationResult(
  issues: readonly ReplayValidationIssue[],
): ReplayValidationResult {
  return {
    valid: issues.length === 0,
    issues,
  };
}

function issue(code: string, message: string): ReplayValidationIssue {
  return { code, message };
}

function requireText(
  value: unknown,
  fieldName: string,
  issues: ReplayValidationIssue[],
): void {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(issue("missing_required_field", `${fieldName} is required.`));
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
