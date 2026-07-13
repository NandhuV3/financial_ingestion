export const PROMPT_REGISTRY_ERROR_CODES = [
  "PROMPT_REGISTRY_VALIDATION_ERROR",
  "PROMPT_REGISTRY_LIFECYCLE_ERROR",
  "PROMPT_REGISTRY_VERSION_ERROR",
  "PROMPT_REGISTRY_ACTIVATION_ERROR",
] as const;

export type PromptRegistryErrorCode =
  typeof PROMPT_REGISTRY_ERROR_CODES[number];

export type PromptRegistryErrorOptions = {
  cause?: unknown;
};

export class PromptRegistryError extends Error {
  readonly code: PromptRegistryErrorCode;

  constructor(
    message: string,
    code: PromptRegistryErrorCode,
    options: PromptRegistryErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "PromptRegistryError";
    this.code = code;
  }
}

export class PromptRegistryValidationError extends PromptRegistryError {
  constructor(message: string, options: PromptRegistryErrorOptions = {}) {
    super(message, "PROMPT_REGISTRY_VALIDATION_ERROR", options);
    this.name = "PromptRegistryValidationError";
  }
}

export class PromptRegistryLifecycleError extends PromptRegistryError {
  constructor(message: string, options: PromptRegistryErrorOptions = {}) {
    super(message, "PROMPT_REGISTRY_LIFECYCLE_ERROR", options);
    this.name = "PromptRegistryLifecycleError";
  }
}

export class PromptRegistryVersionError extends PromptRegistryError {
  constructor(message: string, options: PromptRegistryErrorOptions = {}) {
    super(message, "PROMPT_REGISTRY_VERSION_ERROR", options);
    this.name = "PromptRegistryVersionError";
  }
}

export class PromptRegistryActivationError extends PromptRegistryError {
  constructor(message: string, options: PromptRegistryErrorOptions = {}) {
    super(message, "PROMPT_REGISTRY_ACTIVATION_ERROR", options);
    this.name = "PromptRegistryActivationError";
  }
}
