import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { CommitmentTrackingArtifactContent } from "./types.js";
import {
  COMMITMENT_TRACKING_CALIBRATION,
  COMMITMENT_TRACKING_RULE_SET,
  COMMITMENT_TRACKING_SCHEMA_VERSION,
} from "./contract.js";
import {
  requireNonEmptyStringArray,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireProbability,
  requireStringArray,
  requireText,
} from "./validation-helpers.js";

export function validateCommitmentTrackingMetadata(
  content: CommitmentTrackingArtifactContent,
): void {
  validateCoverage(content);
  validateDepth(content);
  validateConfidence(content);
  validateReplayability(content);
}

function validateCoverage(content: CommitmentTrackingArtifactContent): void {
  if (!["complete", "partial"].includes(content.coverage.status)) {
    throw new BuilderValidationError("coverage.status is invalid.");
  }

  requireNonNegativeInteger(
    content.coverage.current_period_source_count,
    "coverage.current_period_source_count",
  );
  requirePositiveInteger(
    content.coverage.historical_period_count,
    "coverage.historical_period_count",
  );

  if (content.coverage.current_period_source_count === 0) {
    throw new BuilderValidationError("coverage requires a current-period source.");
  }

  if (content.coverage.status === "complete" && content.coverage.missing_sources.length > 0) {
    throw new BuilderValidationError("complete coverage cannot contain missing_sources.");
  }

  if (content.coverage.status === "partial" && content.coverage.missing_sources.length === 0) {
    throw new BuilderValidationError("partial coverage requires missing_sources.");
  }
}

function validateDepth(content: CommitmentTrackingArtifactContent): void {
  const depth = content.depth_indicator;
  requirePositiveInteger(
    depth.historical_periods_available,
    "depth_indicator.historical_periods_available",
  );

  if (depth.historical_periods_available !== content.coverage.historical_period_count) {
    throw new BuilderValidationError(
      "depth_indicator historical periods must match coverage historical periods.",
    );
  }

  if (depth.first_population !== (depth.historical_periods_available === 1)) {
    throw new BuilderValidationError("depth_indicator.first_population is inconsistent.");
  }

  if (depth.longitudinal_tracking_available !== (depth.historical_periods_available >= 2)) {
    throw new BuilderValidationError(
      "depth_indicator.longitudinal_tracking_available is inconsistent.",
    );
  }

  if (depth.preferred_history_available !== (depth.historical_periods_available >= 4)) {
    throw new BuilderValidationError(
      "depth_indicator.preferred_history_available is inconsistent.",
    );
  }
}

function validateConfidence(content: CommitmentTrackingArtifactContent): void {
  requireProbability(content.confidence.overall, "confidence.overall");
  requireProbability(content.confidence.extraction_confidence, "confidence.extraction_confidence");
  requireProbability(content.confidence.linkage_confidence, "confidence.linkage_confidence");
  requireProbability(content.confidence.resolution_confidence, "confidence.resolution_confidence");
  requireProbability(content.confidence.history_depth_score, "confidence.history_depth_score");

  if (content.depth_indicator.first_population && content.confidence.linkage_confidence !== 0) {
    throw new BuilderValidationError("first population linkage confidence must be 0.");
  }
}

function validateReplayability(content: CommitmentTrackingArtifactContent): void {
  const replay = content.replayability_metadata;
  requireText(replay.schema_version, "replayability_metadata.schema_version");
  requireNonEmptyStringArray(
    replay.source_artifact_references,
    "replayability_metadata.source_artifact_references",
  );

  if (
    replay.source_artifact_versions.length !== replay.source_artifact_references.length
    || replay.source_artifact_versions.some((version) => !Number.isInteger(version) || version <= 0)
  ) {
    throw new BuilderValidationError(
      "replayability_metadata source artifact versions must match references.",
    );
  }

  requireStringArray(
    replay.source_record_references,
    "replayability_metadata.source_record_references",
  );
  requireText(replay.rule_set_ref, "replayability_metadata.rule_set_ref");
  requireText(replay.rule_version, "replayability_metadata.rule_version");
  requireText(replay.calibration_ref, "replayability_metadata.calibration_ref");
  requireText(replay.calibration_version, "replayability_metadata.calibration_version");
  requireStringArray(replay.evidence_references, "replayability_metadata.evidence_references");
  requireStringArray(replay.lifecycle_references, "replayability_metadata.lifecycle_references");

  if (
    replay.schema_version !== COMMITMENT_TRACKING_SCHEMA_VERSION
    || replay.rule_set_ref !== COMMITMENT_TRACKING_RULE_SET.ref
    || replay.rule_version !== COMMITMENT_TRACKING_RULE_SET.version
    || replay.calibration_ref !== COMMITMENT_TRACKING_CALIBRATION.ref
    || replay.calibration_version !== COMMITMENT_TRACKING_CALIBRATION.version
  ) {
    throw new BuilderValidationError("replayability_metadata versions are unsupported.");
  }

  if (
    (replay.prior_commitment_tracking_ref === null)
    !== (replay.prior_commitment_tracking_version === null)
  ) {
    throw new BuilderValidationError(
      "replayability_metadata prior artifact reference and version must appear together.",
    );
  }

  validateReplayabilityReferences(content);
}

function validateReplayabilityReferences(content: CommitmentTrackingArtifactContent): void {
  const replay = content.replayability_metadata;
  const artifactPairs = replay.source_artifact_references.map(
    (artifactRef, index) => `${artifactRef}:${replay.source_artifact_versions[index]}`,
  );
  const artifactPairSet = new Set(artifactPairs);

  if (artifactPairSet.size !== artifactPairs.length) {
    throw new BuilderValidationError(
      "replayability_metadata source artifact/version pairs must be unique.",
    );
  }

  const evidence = content.commitments.flatMap((commitment) => commitment.evidence);
  for (const item of evidence) {
    if (!artifactPairSet.has(`${item.source_artifact_ref}:${item.source_artifact_version}`)) {
      throw new BuilderValidationError(
        "replayability_metadata must include every evidence artifact/version pair.",
      );
    }
  }

  assertSameStrings(
    replay.source_record_references,
    evidence.map((item) => item.source_record_ref),
    "source_record_references",
  );
  assertSameStrings(
    replay.evidence_references,
    evidence.map((item) => item.evidence_id),
    "evidence_references",
  );
  assertSameStrings(
    replay.lifecycle_references,
    content.commitments.flatMap((commitment) =>
      commitment.timeline.map((event) =>
        `${commitment.commitment_id}:${event.period}:${event.status}`)),
    "lifecycle_references",
  );
}

function assertSameStrings(actual: string[], expected: string[], field: string): void {
  const normalizedActual = [...new Set(actual)].sort();
  const normalizedExpected = [...new Set(expected)].sort();

  if (
    normalizedActual.length !== normalizedExpected.length
    || normalizedActual.some((value, index) => value !== normalizedExpected[index])
  ) {
    throw new BuilderValidationError(
      `replayability_metadata.${field} does not reconcile with artifact content.`,
    );
  }
}
