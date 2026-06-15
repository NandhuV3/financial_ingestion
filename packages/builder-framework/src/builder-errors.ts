export type BuilderErrorCode =
  | "BUILDER_VALIDATION_ERROR"
  | "BUILDER_EXECUTION_ERROR"
  | "BUILDER_DEPENDENCY_ERROR";

export class BuilderError extends Error {
  constructor(
    message: string,
    readonly code: BuilderErrorCode,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "BuilderError";
  }
}

export class BuilderValidationError extends BuilderError {
  constructor(message: string, cause?: unknown) {
    super(message, "BUILDER_VALIDATION_ERROR", cause);
    this.name = "BuilderValidationError";
  }
}

export class BuilderExecutionError extends BuilderError {
  constructor(message: string, cause?: unknown) {
    super(message, "BUILDER_EXECUTION_ERROR", cause);
    this.name = "BuilderExecutionError";
  }
}

export class BuilderDependencyError extends BuilderError {
  constructor(message: string, cause?: unknown) {
    super(message, "BUILDER_DEPENDENCY_ERROR", cause);
    this.name = "BuilderDependencyError";
  }
}

export function builderErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

