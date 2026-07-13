export const LLM_EXECUTION_ERROR_CODES = [
  "LLM_EXECUTION_VALIDATION_ERROR",
  "LLM_EXECUTION_ENGINE_ERROR",
] as const;

export type LLMExecutionErrorCode = typeof LLM_EXECUTION_ERROR_CODES[number];

export type LLMExecutionErrorOptions = {
  cause?: unknown;
};

export class LLMExecutionFrameworkError extends Error {
  readonly code: LLMExecutionErrorCode;

  constructor(
    message: string,
    code: LLMExecutionErrorCode,
    options: LLMExecutionErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "LLMExecutionFrameworkError";
    this.code = code;
  }
}

export class LLMExecutionValidationError extends LLMExecutionFrameworkError {
  constructor(message: string, options: LLMExecutionErrorOptions = {}) {
    super(message, "LLM_EXECUTION_VALIDATION_ERROR", options);
    this.name = "LLMExecutionValidationError";
  }
}

export class LLMExecutionEngineError extends LLMExecutionFrameworkError {
  constructor(message: string, options: LLMExecutionErrorOptions = {}) {
    super(message, "LLM_EXECUTION_ENGINE_ERROR", options);
    this.name = "LLMExecutionEngineError";
  }
}

export function llmExecutionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
