export const PROMPT_FRAMEWORK_ERROR_CODES = [
  "PROMPT_FRAMEWORK_VALIDATION_ERROR",
  "PROMPT_FRAMEWORK_ORCHESTRATION_ERROR",
] as const;

export type PromptFrameworkErrorCode =
  typeof PROMPT_FRAMEWORK_ERROR_CODES[number];

export type PromptFrameworkErrorOptions = {
  cause?: unknown;
};

export class PromptFrameworkError extends Error {
  readonly code: PromptFrameworkErrorCode;

  constructor(
    message: string,
    code: PromptFrameworkErrorCode,
    options: PromptFrameworkErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "PromptFrameworkError";
    this.code = code;
  }
}

export class PromptFrameworkValidationError extends PromptFrameworkError {
  constructor(message: string, options: PromptFrameworkErrorOptions = {}) {
    super(message, "PROMPT_FRAMEWORK_VALIDATION_ERROR", options);
    this.name = "PromptFrameworkValidationError";
  }
}

export class PromptFrameworkOrchestrationError extends PromptFrameworkError {
  constructor(message: string, options: PromptFrameworkErrorOptions = {}) {
    super(message, "PROMPT_FRAMEWORK_ORCHESTRATION_ERROR", options);
    this.name = "PromptFrameworkOrchestrationError";
  }
}
