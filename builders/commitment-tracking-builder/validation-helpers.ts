import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";

export function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

export function requireAllowed<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): asserts value is T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

export function requireProbability(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

export function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new BuilderValidationError(`${field} must be a positive integer.`);
  }
}

export function requireNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new BuilderValidationError(`${field} must be a non-negative integer.`);
  }
}

export function requireNonEmptyStringArray(
  value: unknown,
  field: string,
): asserts value is string[] {
  if (
    !Array.isArray(value)
    || value.length === 0
    || value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new BuilderValidationError(`${field} must be a non-empty string array.`);
  }
}

export function requireStringArray(value: unknown, field: string): asserts value is string[] {
  if (
    !Array.isArray(value)
    || value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new BuilderValidationError(`${field} must be a string array.`);
  }
}
