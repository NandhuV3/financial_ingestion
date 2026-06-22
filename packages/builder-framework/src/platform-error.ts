export type PlatformErrorCode =
  | "BUILDER_VALIDATION_ERROR"
  | "BUILDER_EXECUTION_ERROR"
  | "BUILDER_DEPENDENCY_ERROR"
  | "ARTIFACT_VALIDATION_ERROR"
  | "PIPELINE_EXECUTION_ERROR"
  | "GOVERNANCE_ERROR"
  | "CONFIGURATION_ERROR";

export type PlatformErrorContext = {
  builder_type?: string;
  artifact_type?: string;
  execution_id?: string;
  company_id?: string;
  period_id?: string;
};

export type PlatformErrorOptions = {
  cause?: unknown;
  context?: PlatformErrorContext;
  suggestedAction?: string;
};

export class PlatformError extends Error {
  readonly code: PlatformErrorCode;
  readonly context: Readonly<PlatformErrorContext>;
  readonly suggestedAction?: string;

  constructor(
    message: string,
    code: PlatformErrorCode,
    options: PlatformErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "PlatformError";
    this.code = code;
    this.context = Object.freeze({ ...options.context });
    this.suggestedAction = options.suggestedAction;
  }
}

export class ArtifactValidationError extends PlatformError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, "ARTIFACT_VALIDATION_ERROR", options);
    this.name = "ArtifactValidationError";
  }
}

export class PipelineExecutionError extends PlatformError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, "PIPELINE_EXECUTION_ERROR", options);
    this.name = "PipelineExecutionError";
  }
}

export class GovernanceError extends PlatformError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, "GOVERNANCE_ERROR", options);
    this.name = "GovernanceError";
  }
}

export class ConfigurationError extends PlatformError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, "CONFIGURATION_ERROR", options);
    this.name = "ConfigurationError";
  }
}

export function platformErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
