import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { EnrichmentInputStatus } from "./types.js";

export function validateEnrichmentInputStatus(status: EnrichmentInputStatus, field: string): void {
  if (status === null || typeof status !== "object") {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  if (typeof status.available !== "boolean") {
    throw new BuilderValidationError(`${field}.available must be boolean.`);
  }

  if (status.available) {
    requireText(status.artifact_path, `${field}.artifact_path`);

    if (!Number.isSafeInteger(status.artifact_version)
      || status.artifact_version === null
      || status.artifact_version <= 0) {
      throw new BuilderValidationError(`${field}.artifact_version must be a positive integer when available.`);
    }

    if (status.absent_reason !== null && status.absent_reason !== undefined) {
      throw new BuilderValidationError(`${field}.absent_reason must be absent when available.`);
    }

    return;
  }

  if (status.artifact_path !== null && status.artifact_path !== undefined) {
    throw new BuilderValidationError(`${field}.artifact_path must be absent when unavailable.`);
  }

  if (status.artifact_version !== null && status.artifact_version !== undefined) {
    throw new BuilderValidationError(`${field}.artifact_version must be absent when unavailable.`);
  }

  requireText(status.absent_reason, `${field}.absent_reason`);
}

export function requireAllowed<T extends readonly string[]>(value: unknown, allowed: T, field: string): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

export function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

export function requireNonEmptyStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BuilderValidationError(`${field} must be a non-empty array.`);
  }

  for (const item of value) {
    requireText(item, field);
  }
}

export function requireStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }

  for (const item of value) {
    requireText(item, field);
  }
}
