import type { Artifact } from "../../contracts/artifacts/artifact.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import {
  COMMITMENT_STATUSES,
  COMMITMENT_TRACKING_CALIBRATION,
  COMMITMENT_TRACKING_RULE_SET,
  COMMITMENT_TYPES,
  EVIDENCE_ROLES,
  RESOLUTION_RESULTS,
  SOURCE_ARTIFACT_TYPES,
  SOURCE_TYPES,
} from "./contract.js";
import type {
  CommitmentSourceArtifactContent,
  CommitmentSourceRecord,
  CommitmentTrackingBuilderInput,
} from "./types.js";
import {
  requireAllowed,
  requireNonEmptyStringArray,
  requireProbability,
  requireText,
} from "./validation-helpers.js";

export function validateCommitmentTrackingBuilderInput(
  input: CommitmentTrackingBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");

  if (!Array.isArray(input.source_dependencies) || input.source_dependencies.length === 0) {
    throw new BuilderValidationError(
      "Commitment Tracking requires at least one declared source dependency.",
    );
  }

  const dependencyNames = new Set<string>();

  for (const [index, source] of input.source_dependencies.entries()) {
    requireText(source.dependency_name, `source_dependencies[${index}].dependency_name`);
    requireText(source.period_id, `source_dependencies[${index}].period_id`);
    requireAllowed(source.source_type, SOURCE_TYPES, `source_dependencies[${index}].source_type`);
    requireAllowed(
      source.artifact_type,
      SOURCE_ARTIFACT_TYPES,
      `source_dependencies[${index}].artifact_type`,
    );

    if (source.absent_reason !== null) {
      requireText(source.absent_reason, `source_dependencies[${index}].absent_reason`);
    }

    if (dependencyNames.has(source.dependency_name)) {
      throw new BuilderValidationError(
        `Duplicate Commitment Tracking dependency name: ${source.dependency_name}.`,
      );
    }
    dependencyNames.add(source.dependency_name);
  }

  if (!input.source_dependencies.some((source) => source.period_id === input.period_id)) {
    throw new BuilderValidationError(
      "Commitment Tracking must declare at least one current-period source.",
    );
  }

  if (
    input.rule_set.rule_set_ref !== COMMITMENT_TRACKING_RULE_SET.ref
    || input.rule_set.rule_version !== COMMITMENT_TRACKING_RULE_SET.version
  ) {
    throw new BuilderValidationError("Commitment Tracking rule set is unsupported.");
  }

  if (
    input.calibration.calibration_ref !== COMMITMENT_TRACKING_CALIBRATION.ref
    || input.calibration.calibration_version !== COMMITMENT_TRACKING_CALIBRATION.version
  ) {
    throw new BuilderValidationError("Commitment Tracking calibration is unsupported.");
  }
}

export function validateCommitmentSourceArtifact(
  artifact: Artifact<CommitmentSourceArtifactContent>,
  dependencyName: string,
): void {
  if (!Array.isArray(artifact.content.commitment_records)) {
    throw new BuilderDependencyError(
      `Commitment Tracking source ${dependencyName} must expose commitment_records.`,
    );
  }

  for (const [index, record] of artifact.content.commitment_records.entries()) {
    validateSourceRecord(record, `${dependencyName}.commitment_records[${index}]`);
  }
}

function validateSourceRecord(record: CommitmentSourceRecord, field: string): void {
  requireText(record.commitment_id, `${field}.commitment_id`);
  requireAllowed(record.commitment_type, COMMITMENT_TYPES, `${field}.commitment_type`);
  requireText(record.statement, `${field}.statement`);
  requireText(record.commitment_period, `${field}.commitment_period`);
  requireAllowed(record.status, COMMITMENT_STATUSES, `${field}.status`);

  if (typeof record.expected_resolution_passed !== "boolean") {
    throw new BuilderValidationError(`${field}.expected_resolution_passed must be boolean.`);
  }

  requireText(record.identity_basis.company_id, `${field}.identity_basis.company_id`);
  requireAllowed(
    record.identity_basis.commitment_type,
    COMMITMENT_TYPES,
    `${field}.identity_basis.commitment_type`,
  );
  requireText(record.identity_basis.canonical_statement, `${field}.identity_basis.canonical_statement`);
  requireText(record.identity_basis.initial_commitment_period, `${field}.identity_basis.initial_commitment_period`);
  requireText(record.identity_basis.creation_evidence_ref, `${field}.identity_basis.creation_evidence_ref`);
  requireText(record.identity_basis.identity_rule_version, `${field}.identity_basis.identity_rule_version`);

  if (record.identity_basis.commitment_type !== record.commitment_type) {
    throw new BuilderValidationError(
      `${field}.identity_basis.commitment_type must match commitment_type.`,
    );
  }

  if (!Array.isArray(record.evidence) || record.evidence.length === 0) {
    throw new BuilderValidationError(`${field}.evidence must be a non-empty array.`);
  }

  for (const [index, evidence] of record.evidence.entries()) {
    const evidenceField = `${field}.evidence[${index}]`;
    requireText(evidence.evidence_id, `${evidenceField}.evidence_id`);
    requireText(evidence.source_record_ref, `${evidenceField}.source_record_ref`);
    requireText(evidence.evidence_text, `${evidenceField}.evidence_text`);
    requireAllowed(evidence.evidence_role, EVIDENCE_ROLES, `${evidenceField}.evidence_role`);
    requireProbability(evidence.confidence, `${evidenceField}.confidence`);
  }

  requireProbability(record.confidence.extraction_confidence, `${field}.confidence.extraction_confidence`);
  requireProbability(record.confidence.linkage_confidence, `${field}.confidence.linkage_confidence`);
  requireProbability(record.confidence.resolution_confidence, `${field}.confidence.resolution_confidence`);

  if (record.resolution !== null) {
    requireAllowed(record.resolution.result, RESOLUTION_RESULTS, `${field}.resolution.result`);
    requireText(record.resolution.assessed_period, `${field}.resolution.assessed_period`);
    requireText(record.resolution.rule_version, `${field}.resolution.rule_version`);
    requireNonEmptyStringArray(record.resolution.evidence_refs, `${field}.resolution.evidence_refs`);
  }
}
