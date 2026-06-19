import { COMMITMENT_TRACKING_SCHEMA_VERSION } from "./contract.js";
import type {
  Commitment,
  CommitmentTrackingBuildDependencies,
  CommitmentTrackingBuilderInput,
  CommitmentTrackingReplayabilityMetadata,
} from "./types.js";

export function buildReplayabilityMetadata(
  input: CommitmentTrackingBuilderInput,
  dependencies: CommitmentTrackingBuildDependencies,
  commitments: Commitment[],
): CommitmentTrackingReplayabilityMetadata {
  return {
    schema_version: COMMITMENT_TRACKING_SCHEMA_VERSION,
    source_artifact_references: sortedUnique(
      dependencies.sources.map(({ artifact }) => artifact.identity.artifact_id),
    ),
    source_artifact_versions: [...dependencies.sources]
      .sort((left, right) => left.artifact.identity.artifact_id.localeCompare(
        right.artifact.identity.artifact_id,
      ))
      .map(({ artifact }) => artifact.identity.version),
    source_record_references: sortedUnique(
      commitments.flatMap((commitment) =>
        commitment.evidence.map((evidence) => evidence.source_record_ref)),
    ),
    prior_commitment_tracking_ref: dependencies.prior?.identity.artifact_id ?? null,
    prior_commitment_tracking_version: dependencies.prior?.identity.version ?? null,
    rule_set_ref: input.rule_set.rule_set_ref,
    rule_version: input.rule_set.rule_version,
    calibration_ref: input.calibration.calibration_ref,
    calibration_version: input.calibration.calibration_version,
    evidence_references: sortedUnique(
      commitments.flatMap((commitment) =>
        commitment.evidence.map((evidence) => evidence.evidence_id)),
    ),
    lifecycle_references: sortedUnique(
      commitments.flatMap((commitment) =>
        commitment.timeline.map((event) =>
          `${commitment.commitment_id}:${event.period}:${event.status}`)),
    ),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
