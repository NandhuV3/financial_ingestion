import type { ComparabilityImpact, SegmentChangeType } from "./contract.js";
import { stableRecordId } from "./identity.js";
import type {
  AccountingBuildDependencies,
  SegmentChange,
  SegmentObservation,
} from "./types.js";
import { sortedUnique } from "./validation-helpers.js";

export function buildSegmentChanges(
  dependencies: AccountingBuildDependencies,
): SegmentChange[] {
  const changes: SegmentChange[] = [];

  for (let index = 1; index < dependencies.sources.length; index += 1) {
    const prior = dependencies.sources[index - 1]!;
    const current = dependencies.sources[index]!;
    if (
      !prior.artifact.content.coverage.segments_available
      || !current.artifact.content.coverage.segments_available
    ) {
      continue;
    }

    const priorSegments = sortedUnique(
      prior.artifact.content.segments.map(({ segment_name }) => segment_name),
    );
    const currentSegments = sortedUnique(
      current.artifact.content.segments.map(({ segment_name }) => segment_name),
    );
    if (sameStrings(priorSegments, currentSegments)) {
      continue;
    }

    const removed = priorSegments.filter((value) => !currentSegments.includes(value));
    const added = currentSegments.filter((value) => !priorSegments.includes(value));
    const changedObservations = current.artifact.content.segments.filter(
      ({ segment_name }) => added.includes(segment_name),
    );
    const evidence = [
      ...prior.artifact.content.segments.flatMap(({ evidence_refs }) => evidence_refs),
      ...current.artifact.content.segments.flatMap(({ evidence_refs }) => evidence_refs),
    ];
    const confidenceValues = [
      ...prior.artifact.content.segments.map(({ confidence }) => confidence),
      ...current.artifact.content.segments.map(({ confidence }) => confidence),
    ];

    changes.push({
      segment_change_id: stableRecordId("segment-change", [
        current.declaration.period_id,
        priorSegments.join("\u001f"),
        currentSegments.join("\u001f"),
      ]),
      change_detected_period: current.declaration.period_id,
      prior_segments: priorSegments,
      current_segments: currentSegments,
      change_type: classifyChange(removed.length, added.length),
      disclosed_reason: firstDisclosedReason(changedObservations),
      comparability_impact: highestImpact(changedObservations),
      evidence_refs: sortedUnique(evidence),
      source_artifact_refs: sortedUnique([
        prior.artifact.identity.artifact_id,
        current.artifact.identity.artifact_id,
      ]),
      confidence: average(confidenceValues),
    });
  }

  return changes.sort((left, right) =>
    left.segment_change_id.localeCompare(right.segment_change_id));
}

function classifyChange(removed: number, added: number): SegmentChangeType {
  if (removed === 1 && added === 1) {
    return "renamed";
  }
  if (removed === 0 && added === 1) {
    return "added";
  }
  if (removed === 1 && added === 0) {
    return "removed";
  }
  if (removed === 1 && added > 1) {
    return "split";
  }
  if (removed > 1 && added === 1) {
    return "merged";
  }
  return "restructured";
}

function firstDisclosedReason(observations: SegmentObservation[]): string | null {
  return observations
    .map(({ disclosed_reason }) => disclosed_reason)
    .filter((value): value is string => value !== null)
    .sort()[0] ?? null;
}

function highestImpact(observations: SegmentObservation[]): ComparabilityImpact {
  const order: ComparabilityImpact[] = ["none", "minor", "moderate", "material"];
  return observations.reduce<ComparabilityImpact>(
    (highest, observation) =>
      order.indexOf(observation.comparability_impact) > order.indexOf(highest)
        ? observation.comparability_impact
        : highest,
    "none",
  );
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
