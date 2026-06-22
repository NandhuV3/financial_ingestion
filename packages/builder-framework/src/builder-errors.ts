import {
  PlatformError,
  type PlatformErrorContext,
} from "./platform-error.js";

export type BuilderErrorCode =
  | "BUILDER_VALIDATION_ERROR"
  | "BUILDER_EXECUTION_ERROR"
  | "BUILDER_DEPENDENCY_ERROR";

export type BuilderErrorOptions = {
  cause?: unknown;
  context?: PlatformErrorContext;
  suggestedAction?: string;
};

export class BuilderError extends PlatformError {
  constructor(
    message: string,
    readonly code: BuilderErrorCode,
    options: BuilderErrorOptions = {},
  ) {
    super(message, code, options);
    this.name = "BuilderError";
  }
}

export class BuilderValidationError extends BuilderError {
  constructor(message: string, causeOrOptions?: unknown | BuilderErrorOptions) {
    super(
      message,
      "BUILDER_VALIDATION_ERROR",
      normalizeBuilderErrorOptions(causeOrOptions),
    );
    this.name = "BuilderValidationError";
  }
}

export class BuilderExecutionError extends BuilderError {
  constructor(message: string, causeOrOptions?: unknown | BuilderErrorOptions) {
    super(
      message,
      "BUILDER_EXECUTION_ERROR",
      normalizeBuilderErrorOptions(causeOrOptions),
    );
    this.name = "BuilderExecutionError";
  }
}

export class BuilderDependencyError extends BuilderError {
  constructor(message: string, causeOrOptions?: unknown | BuilderErrorOptions) {
    super(
      message,
      "BUILDER_DEPENDENCY_ERROR",
      normalizeBuilderErrorOptions(causeOrOptions),
    );
    this.name = "BuilderDependencyError";
  }
}

export function builderErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeBuilderErrorOptions(
  value: unknown | BuilderErrorOptions,
): BuilderErrorOptions {
  if (
    value !== null
    && typeof value === "object"
    && (
      "cause" in value
      || "context" in value
      || "suggestedAction" in value
    )
  ) {
    return value as BuilderErrorOptions;
  }

  return value === undefined ? {} : { cause: value };
}
