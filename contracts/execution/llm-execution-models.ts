/**
 * Canonical execution data models for the LLM Execution Framework.
 *
 * These models are provider-agnostic and business-domain-agnostic. They
 * describe framework execution only; they do not define provider behavior,
 * prompt orchestration, execution records, artifact persistence, or business
 * validation.
 */
export const LLM_EXECUTION_MODELS_CONTRACT_VERSION =
  "llm-execution-models-v1";

export const EXECUTION_STATUSES = [
  "succeeded",
  "failed",
] as const;

export type ExecutionStatus = typeof EXECUTION_STATUSES[number];

export const EXECUTION_MODES = [
  "ORIGINAL_EXECUTION",
  "REPLAY",
] as const;

export type ExecutionMode = typeof EXECUTION_MODES[number];

export const EXECUTION_ERROR_TYPES = [
  "prompt_resolution_failure",
  "provider_invocation_failure",
  "structured_output_validation_failure",
  "execution_recording_failure",
  "replay_resolution_failure",
  "framework_failure",
] as const;

export type ExecutionErrorType = typeof EXECUTION_ERROR_TYPES[number];

/**
 * Framework execution request.
 *
 * Business layers and Prompt Framework components provide typed inputs, but
 * the LLM Execution Framework treats them only as execution inputs. It never
 * consumes business artifacts directly.
 */
export type ExecutionRequest<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
> = {
  prompt_package: TPromptPackage;
  execution_context: TExecutionContext;
  provider_configuration: TProviderConfiguration;
};

/**
 * Replay-stable execution context fields consumed by the framework.
 *
 * The canonical Execution Context remains owned by Platform Foundation. This
 * model captures only the fields required by LLM execution models.
 */
export type ExecutionContextReference = {
  execution_id: string;
  execution_mode: ExecutionMode;
  producer: string;
  generated_at: string;
};

/**
 * Execution metadata returned by the framework.
 *
 * This metadata supports audit and replay. It is not business artifact content
 * and must remain outside intelligence-layer schemas.
 */
export type ExecutionMetadata = {
  execution_id: string;
  execution_mode: ExecutionMode;
  producer: string;
  generated_at: string;
  prompt_id: string;
  prompt_version: string;
  model_id: string;
  model_version: string;
  provider_id: string;
};

/**
 * Provider-agnostic framework execution error.
 *
 * Provider-specific error payloads are intentionally excluded from this model.
 */
export type ExecutionError = {
  error_type: ExecutionErrorType;
  error_code: string;
  message: string;
};

export type SuccessfulExecutionResult<TStructuredOutput> = {
  status: "succeeded";
  output: TStructuredOutput;
  metadata: ExecutionMetadata;
};

export type FailedExecutionResult = {
  status: "failed";
  error: ExecutionError;
  metadata: ExecutionMetadata;
};

/**
 * Atomic framework execution result.
 *
 * A result is either a validated structured output or an execution failure.
 * Partial business outputs are not represented.
 */
export type ExecutionResult<TStructuredOutput> =
  | SuccessfulExecutionResult<TStructuredOutput>
  | FailedExecutionResult;
