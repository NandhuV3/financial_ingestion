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
  const sourceArtifacts = sourceArtifactPairs(dependencies, commitments);

  return {
    schema_version: COMMITMENT_TRACKING_SCHEMA_VERSION,
    source_artifact_references: sourceArtifacts.map(({ artifactRef }) => artifactRef),
    source_artifact_versions: sourceArtifacts.map(({ artifactVersion }) => artifactVersion),
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

function sourceArtifactPairs(
  dependencies: CommitmentTrackingBuildDependencies,
  commitments: Commitment[],
): Array<{ artifactRef: string; artifactVersion: number }> {
  const pairs = new Map<string, { artifactRef: string; artifactVersion: number }>();

  for (const source of dependencies.sources) {
    const pair = {
      artifactRef: source.artifact.identity.artifact_id,
      artifactVersion: source.artifact.identity.version,
    };
    pairs.set(`${pair.artifactRef}:${pair.artifactVersion}`, pair);
  }

  for (const evidence of commitments.flatMap((commitment) => commitment.evidence)) {
    const pair = {
      artifactRef: evidence.source_artifact_ref,
      artifactVersion: evidence.source_artifact_version,
    };
    pairs.set(`${pair.artifactRef}:${pair.artifactVersion}`, pair);
  }

  return [...pairs.values()].sort(
    (left, right) => left.artifactRef.localeCompare(right.artifactRef)
      || left.artifactVersion - right.artifactVersion,
  );
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
