import type { BuilderContext } from "./builder-context.js";
import type { BuilderDefinition } from "./builder-definition.js";
import { BuilderValidationError } from "./builder-errors.js";
import type { BuilderResult } from "./builder-result.js";

export function validateBuilderDefinition(definition: BuilderDefinition): void {
  requireNonEmptyString(definition.builder_type, "builder_type");
  requireNonEmptyString(definition.artifact_type, "artifact_type");
  requireNonEmptyString(definition.version, "version");
  requireNonEmptyString(definition.schema_version, "schema_version");
  requireNonEmptyString(definition.pipeline_version, "pipeline_version");
}

export function validateBuilderInput<TInput>(context: BuilderContext<TInput>): void {
  requireNonEmptyString(context.companyId, "companyId");
  requireNonEmptyString(context.periodId, "periodId");
  requireNonEmptyString(context.executionId, "executionId");

  if (context.input === undefined) {
    throw new BuilderValidationError("Builder input must not be undefined.");
  }

  if (context.dependencies === null || typeof context.dependencies !== "object") {
    throw new BuilderValidationError("Builder dependencies must be an object.");
  }
}

export function validateBuilderOutput<TOutput>(result: BuilderResult<TOutput>): void {
  if (result === null || typeof result !== "object") {
    throw new BuilderValidationError("Builder result must be an object.");
  }

  if (result.content === undefined) {
    throw new BuilderValidationError("Builder result content must not be undefined.");
  }

  if (result.confidence !== undefined
    && (!Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1)) {
    throw new BuilderValidationError("Builder result confidence must be between 0 and 1.");
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`Builder ${field} must be a non-empty string.`);
  }
}

