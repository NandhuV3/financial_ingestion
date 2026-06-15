import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactEvaluation } from "../../../contracts/artifacts/artifact-evaluation.js";
import type { ArtifactGovernance } from "../../../contracts/artifacts/artifact-governance.js";
import type { ArtifactLineage } from "../../../contracts/artifacts/artifact-lineage.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import { ARTIFACT_TYPES } from "../../../contracts/artifacts/artifact-type.js";

export function validateArtifact(artifact: Artifact<unknown>): void {
  validateIdentity(artifact);
  validateMetadata(artifact);
  validateLineage(artifact.lineage);

  if (artifact.evaluation !== undefined) {
    validateEvaluation(artifact.evaluation);
  }

  if (artifact.governance !== undefined) {
    validateGovernance(artifact.governance);
  }
}

export function validateMetadata(artifact: Artifact<unknown>): void {
  const { metadata } = artifact;

  requirePositiveInteger(metadata.version, "metadata.version");
  requireNonEmptyString(metadata.schema_version, "metadata.schema_version");
  requireNonEmptyString(metadata.pipeline_version, "metadata.pipeline_version");
  requireNonEmptyString(metadata.generated_at, "metadata.generated_at");
  requireNonEmptyString(metadata.artifact_hash, "metadata.artifact_hash");
  requireNonEmptyString(metadata.input_hash, "metadata.input_hash");

  if (!Number.isFinite(metadata.generation_duration_ms) || metadata.generation_duration_ms < 0) {
    throw new Error("metadata.generation_duration_ms must be a non-negative number.");
  }

  if (!Object.values(ArtifactStatus).includes(metadata.status)) {
    throw new Error(`metadata.status is not supported: ${String(metadata.status)}`);
  }

  if (artifact.identity.version !== metadata.version) {
    throw new Error("artifact identity version must match metadata version.");
  }
}

export function validateLineage(lineage: ArtifactLineage): void {
  if (!Array.isArray(lineage.upstream_dependencies)) {
    throw new Error("lineage.upstream_dependencies must be an array.");
  }

  for (const dependency of lineage.upstream_dependencies) {
    requireNonEmptyString(dependency.artifact_id, "lineage.upstream_dependencies[].artifact_id");

    if (!ARTIFACT_TYPES.includes(dependency.artifact_type)) {
      throw new Error(`lineage dependency artifact_type is not supported: ${String(dependency.artifact_type)}`);
    }

    requirePositiveInteger(dependency.version, "lineage.upstream_dependencies[].version");
    requireNonEmptyString(dependency.artifact_hash, "lineage.upstream_dependencies[].artifact_hash");
    requireNonEmptyString(dependency.input_hash, "lineage.upstream_dependencies[].input_hash");
  }

  requireNonEmptyString(lineage.generation_context.builder_type, "lineage.generation_context.builder_type");

  if (lineage.model_reference !== undefined && lineage.model_reference.temperature !== 0) {
    throw new Error("lineage.model_reference.temperature must be 0 for production replayability.");
  }
}

function validateIdentity(artifact: Artifact<unknown>): void {
  const { identity } = artifact;

  requireNonEmptyString(identity.artifact_id, "identity.artifact_id");

  if (!ARTIFACT_TYPES.includes(identity.artifact_type)) {
    throw new Error(`identity.artifact_type is not supported: ${String(identity.artifact_type)}`);
  }

  requirePositiveInteger(identity.version, "identity.version");
}

function validateEvaluation(evaluation: ArtifactEvaluation): void {
  requireNonEmptyString(evaluation.evaluation_version, "evaluation.evaluation_version");

  if (typeof evaluation.structural_passed !== "boolean") {
    throw new Error("evaluation.structural_passed must be a boolean.");
  }

  if (!Number.isFinite(evaluation.confidence_score)
    || evaluation.confidence_score < 0
    || evaluation.confidence_score > 1) {
    throw new Error("evaluation.confidence_score must be between 0 and 1.");
  }

  if (!Array.isArray(evaluation.warnings)) {
    throw new Error("evaluation.warnings must be an array.");
  }

  requireNonEmptyString(evaluation.evaluation_timestamp, "evaluation.evaluation_timestamp");
}

function validateGovernance(governance: ArtifactGovernance): void {
  if (typeof governance.review_required !== "boolean") {
    throw new Error("governance.review_required must be a boolean.");
  }

  if (!["not_required", "pending", "approved", "rejected"].includes(governance.review_status)) {
    throw new Error(`governance.review_status is not supported: ${String(governance.review_status)}`);
  }

  if (!Array.isArray(governance.governance_flags)) {
    throw new Error("governance.governance_flags must be an array.");
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string.`);
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
}
