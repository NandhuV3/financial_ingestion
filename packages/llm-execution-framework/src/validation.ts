import {
  EXECUTION_ERROR_TYPES,
  EXECUTION_MODES,
  EXECUTION_STATUSES,
  type ExecutionContextReference,
  type ExecutionError,
  type ExecutionMetadata,
  type ExecutionRequest,
  type ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import { LLMExecutionValidationError } from "./errors.js";

export function validateExecutionRequest<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
>(
  request: ExecutionRequest<
    TPromptPackage,
    TExecutionContext,
    TProviderConfiguration
  >,
): void {
  if (!isObject(request)) {
    throw new LLMExecutionValidationError(
      "ExecutionRequest must be an object.",
    );
  }

  if (request.prompt_package === undefined || request.prompt_package === null) {
    throw new LLMExecutionValidationError(
      "ExecutionRequest.prompt_package is required.",
    );
  }

  validateExecutionContextReference(request.execution_context);

  if (
    request.provider_configuration === undefined
      || request.provider_configuration === null
  ) {
    throw new LLMExecutionValidationError(
      "ExecutionRequest.provider_configuration is required.",
    );
  }
}

export function validateExecutionResult<TStructuredOutput>(
  result: ExecutionResult<TStructuredOutput>,
): void {
  if (!isObject(result)) {
    throw new LLMExecutionValidationError(
      "ExecutionResult must be an object.",
    );
  }

  if (!EXECUTION_STATUSES.includes(result.status)) {
    throw new LLMExecutionValidationError(
      "ExecutionResult.status is invalid.",
    );
  }

  validateExecutionMetadata(result.metadata);

  if (result.status === "succeeded") {
    if (result.output === undefined) {
      throw new LLMExecutionValidationError(
        "Successful ExecutionResult.output is required.",
      );
    }

    return;
  }

  validateExecutionError(result.error);
}

export function validateExecutionMetadata(
  metadata: ExecutionMetadata,
): void {
  if (!isObject(metadata)) {
    throw new LLMExecutionValidationError(
      "ExecutionMetadata must be an object.",
    );
  }

  requireNonEmptyText(metadata.execution_id, "ExecutionMetadata.execution_id");

  if (!EXECUTION_MODES.includes(metadata.execution_mode)) {
    throw new LLMExecutionValidationError(
      "ExecutionMetadata.execution_mode is invalid.",
    );
  }

  requireNonEmptyText(metadata.producer, "ExecutionMetadata.producer");
  requireNonEmptyText(metadata.generated_at, "ExecutionMetadata.generated_at");
  requireNonEmptyText(metadata.prompt_id, "ExecutionMetadata.prompt_id");
  requireNonEmptyText(metadata.prompt_version, "ExecutionMetadata.prompt_version");
  requireNonEmptyText(metadata.model_id, "ExecutionMetadata.model_id");
  requireNonEmptyText(metadata.model_version, "ExecutionMetadata.model_version");
  requireNonEmptyText(metadata.provider_id, "ExecutionMetadata.provider_id");
}

export function validateExecutionError(error: ExecutionError): void {
  if (!isObject(error)) {
    throw new LLMExecutionValidationError(
      "ExecutionError must be an object.",
    );
  }

  if (!EXECUTION_ERROR_TYPES.includes(error.error_type)) {
    throw new LLMExecutionValidationError(
      "ExecutionError.error_type is invalid.",
    );
  }

  requireNonEmptyText(error.error_code, "ExecutionError.error_code");
  requireNonEmptyText(error.message, "ExecutionError.message");
}

function validateExecutionContextReference(
  context: ExecutionContextReference,
): void {
  if (!isObject(context)) {
    throw new LLMExecutionValidationError(
      "ExecutionRequest.execution_context must be an object.",
    );
  }

  requireNonEmptyText(
    context.execution_id,
    "ExecutionRequest.execution_context.execution_id",
  );

  if (!EXECUTION_MODES.includes(context.execution_mode)) {
    throw new LLMExecutionValidationError(
      "ExecutionRequest.execution_context.execution_mode is invalid.",
    );
  }

  requireNonEmptyText(
    context.producer,
    "ExecutionRequest.execution_context.producer",
  );
  requireNonEmptyText(
    context.generated_at,
    "ExecutionRequest.execution_context.generated_at",
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireNonEmptyText(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LLMExecutionValidationError(`${fieldName} is required.`);
  }
}
