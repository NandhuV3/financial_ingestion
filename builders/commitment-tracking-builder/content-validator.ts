import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  COMMITMENT_STATUSES,
  COMMITMENT_TRACKING_RULE_SET,
  COMMITMENT_TYPES,
  RESOLUTION_RESULTS_BY_STATUS,
  SOURCE_TYPES,
} from "./contract.js";
import { validateCommitmentTrackingMetadata } from "./metadata-validator.js";
import type {
  Commitment,
  CommitmentTrackingArtifactContent,
} from "./types.js";
import {
  requireAllowed,
  requirePositiveInteger,
  requireProbability,
  requireText,
} from "./validation-helpers.js";
import { isPeriodAfter } from "./period.js";

export function validateCommitmentTrackingArtifactContent(
  content: CommitmentTrackingArtifactContent,
): void {
  if (content.artifact_type !== "commitment_tracking") {
    throw new BuilderValidationError("commitment_tracking.artifact_type is invalid.");
  }

  requireText(content.company, "commitment_tracking.company");
  requireText(content.period, "commitment_tracking.period");

  if (!Array.isArray(content.commitments)) {
    throw new BuilderValidationError("commitment_tracking.commitments must be an array.");
  }

  const commitmentIds = new Set<string>();
  for (const [index, commitment] of content.commitments.entries()) {
    validateCommitment(commitment, content, `commitments[${index}]`);

    if (commitmentIds.has(commitment.commitment_id)) {
      throw new BuilderValidationError(
        `commitment_tracking contains duplicate commitment ${commitment.commitment_id}.`,
      );
    }
    commitmentIds.add(commitment.commitment_id);
  }

  validateSummary(content);
  validateCommitmentTrackingMetadata(content);
}

function validateCommitment(
  commitment: Commitment,
  content: CommitmentTrackingArtifactContent,
  field: string,
): void {
  requireText(commitment.commitment_id, `${field}.commitment_id`);
  requireAllowed(commitment.commitment_type, COMMITMENT_TYPES, `${field}.commitment_type`);
  requireText(commitment.statement, `${field}.statement`);
  requireText(commitment.commitment_period, `${field}.commitment_period`);
  requireAllowed(commitment.status, COMMITMENT_STATUSES, `${field}.status`);
  requireProbability(commitment.confidence, `${field}.confidence`);

  if (typeof commitment.timing.overdue !== "boolean") {
    throw new BuilderValidationError(`${field}.timing.overdue must be boolean.`);
  }

  const expectedOverdue = commitment.expected_resolution_period !== null
    && isPeriodAfter(content.period, commitment.expected_resolution_period)
    && commitment.actual_resolution_period === null
    && !["achieved", "abandoned", "expired"].includes(commitment.status);

  if (commitment.timing.overdue !== expectedOverdue) {
    throw new BuilderValidationError(`${field}.timing.overdue is inconsistent.`);
  }

  if (!Array.isArray(commitment.evidence) || commitment.evidence.length === 0) {
    throw new BuilderValidationError(`${field}.evidence must be a non-empty array.`);
  }

  if (!Array.isArray(commitment.timeline) || commitment.timeline.length === 0) {
    throw new BuilderValidationError(`${field}.timeline must be a non-empty array.`);
  }

  validateIdentity(commitment, content, field);
  validateResolution(commitment, field);

  const evidenceIds = new Set(commitment.evidence.map((evidence) => evidence.evidence_id));

  for (const [index, evidence] of commitment.evidence.entries()) {
    requireText(evidence.source_artifact_ref, `${field}.evidence[${index}].source_artifact_ref`);
    requirePositiveInteger(
      evidence.source_artifact_version,
      `${field}.evidence[${index}].source_artifact_version`,
    );
    requireText(evidence.source_record_ref, `${field}.evidence[${index}].source_record_ref`);
    requireText(evidence.filing_period, `${field}.evidence[${index}].filing_period`);
    requireAllowed(evidence.source_type, SOURCE_TYPES, `${field}.evidence[${index}].source_type`);
    requireProbability(evidence.confidence, `${field}.evidence[${index}].confidence`);
  }

  for (const [index, event] of commitment.timeline.entries()) {
    requireText(event.period, `${field}.timeline[${index}].period`);
    requireAllowed(event.status, COMMITMENT_STATUSES, `${field}.timeline[${index}].status`);
    requireText(event.evidence_ref, `${field}.timeline[${index}].evidence_ref`);
    requireProbability(event.confidence, `${field}.timeline[${index}].confidence`);

    if (!evidenceIds.has(event.evidence_ref)) {
      throw new BuilderValidationError(
        `${field}.timeline[${index}] references unknown evidence ${event.evidence_ref}.`,
      );
    }

    const eventEvidence = commitment.evidence.find(
      (evidence) => evidence.evidence_id === event.evidence_ref,
    );

    if (eventEvidence?.filing_period !== event.period) {
      throw new BuilderValidationError(
        `${field}.timeline[${index}] must reference evidence from the same period.`,
      );
    }
  }
}

function validateIdentity(
  commitment: Commitment,
  content: CommitmentTrackingArtifactContent,
  field: string,
): void {
  const identity = commitment.identity_basis;
  requireText(identity.company_id, `${field}.identity_basis.company_id`);
  requireText(identity.canonical_statement, `${field}.identity_basis.canonical_statement`);
  requireText(identity.initial_commitment_period, `${field}.identity_basis.initial_commitment_period`);
  requireText(identity.creation_evidence_ref, `${field}.identity_basis.creation_evidence_ref`);
  requireText(identity.identity_rule_version, `${field}.identity_basis.identity_rule_version`);

  if (
    identity.company_id !== content.company
    || identity.commitment_type !== commitment.commitment_type
    || identity.initial_commitment_period !== commitment.commitment_period
    || identity.expected_resolution_period !== commitment.expected_resolution_period
  ) {
    throw new BuilderValidationError(`${field}.identity_basis is inconsistent.`);
  }

  if (identity.identity_rule_version !== COMMITMENT_TRACKING_RULE_SET.version) {
    throw new BuilderValidationError(`${field}.identity_basis rule version is unsupported.`);
  }

  const creationEvidence = commitment.evidence.find(
    (evidence) => evidence.evidence_id === identity.creation_evidence_ref,
  );

  if (creationEvidence?.evidence_role !== "creation") {
    throw new BuilderValidationError(
      `${field}.identity_basis must reference creation evidence.`,
    );
  }
}

function validateResolution(commitment: Commitment, field: string): void {
  const allowedResults = RESOLUTION_RESULTS_BY_STATUS[commitment.status];

  if (commitment.status === "new" || commitment.status === "active") {
    if (commitment.resolution !== null) {
      throw new BuilderValidationError(`${field}.resolution is incompatible with status.`);
    }
    return;
  }

  if (commitment.status === "delayed" && commitment.resolution === null) {
    return;
  }

  if (
    commitment.resolution === null
    || !allowedResults.includes(commitment.resolution.result)
  ) {
    throw new BuilderValidationError(`${field}.resolution is incompatible with status.`);
  }

  if (commitment.resolution.rule_version !== COMMITMENT_TRACKING_RULE_SET.version) {
    throw new BuilderValidationError(`${field}.resolution rule version is unsupported.`);
  }

  const evidenceIds = new Set(commitment.evidence.map((evidence) => evidence.evidence_id));
  if (
    commitment.resolution.evidence_refs.length === 0
    || commitment.resolution.evidence_refs.some((reference) => !evidenceIds.has(reference))
  ) {
    throw new BuilderValidationError(`${field}.resolution evidence is invalid.`);
  }
}

function validateSummary(content: CommitmentTrackingArtifactContent): void {
  const summary = content.summary;

  if (summary.total_commitments !== content.commitments.length) {
    throw new BuilderValidationError("summary.total_commitments must match commitments.");
  }

  assertStatusCount(content, "active", summary.active_commitments, "active_commitments");
  assertStatusCount(content, "achieved", summary.achieved_commitments, "achieved_commitments");
  assertStatusCount(content, "delayed", summary.delayed_commitments, "delayed_commitments");
  assertStatusCount(content, "modified", summary.modified_commitments, "modified_commitments");
  assertStatusCount(content, "abandoned", summary.abandoned_commitments, "abandoned_commitments");
  requireProbability(summary.fulfillment_rate, "summary.fulfillment_rate");

  const resolved = content.commitments.filter((commitment) => commitment.resolution !== null);
  const fulfilled = resolved.filter(
    (commitment) => commitment.resolution?.result === "fulfilled",
  ).length;
  const expectedRate = resolved.length === 0 ? 0 : fulfilled / resolved.length;

  if (summary.fulfillment_rate !== expectedRate) {
    throw new BuilderValidationError("summary.fulfillment_rate must match resolved commitments.");
  }
}

function assertStatusCount(
  content: CommitmentTrackingArtifactContent,
  status: Commitment["status"],
  actual: number,
  field: string,
): void {
  const expected = content.commitments.filter((commitment) => commitment.status === status).length;

  if (actual !== expected) {
    throw new BuilderValidationError(`summary.${field} must match commitments.`);
  }
}
