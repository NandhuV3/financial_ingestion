import { COMMITMENT_TRACKING_CALIBRATION } from "./contract.js";
import type {
  CommitmentSourceRecord,
  CommitmentTrackingConfidence,
  CommitmentTrackingDepthIndicator,
  ResolvedCommitmentSource,
} from "./types.js";

export function buildConfidence(
  sources: ResolvedCommitmentSource[],
  depth: CommitmentTrackingDepthIndicator,
): CommitmentTrackingConfidence {
  const records = uniqueRecords(sources);
  const extraction = average(records.map((record) => record.confidence.extraction_confidence));
  const linkage = depth.first_population
    ? 0
    : average(records.map((record) => record.confidence.linkage_confidence));
  const resolution = average(
    records
      .filter((record) => record.resolution !== null)
      .map((record) => record.confidence.resolution_confidence),
  );
  const historyDepth = historyDepthScore(depth.historical_periods_available);
  const weights = COMMITMENT_TRACKING_CALIBRATION.component_weights;
  const overall = extraction * weights.extraction
    + linkage * weights.linkage
    + resolution * weights.resolution
    + historyDepth * weights.history_depth;

  return {
    overall: round(overall),
    extraction_confidence: round(extraction),
    linkage_confidence: round(linkage),
    resolution_confidence: round(resolution),
    history_depth_score: historyDepth,
  };
}

function uniqueRecords(sources: ResolvedCommitmentSource[]): CommitmentSourceRecord[] {
  const records = new Map<
    string,
    Array<{ period: string; record: CommitmentSourceRecord }>
  >();

  for (const source of sources) {
    for (const record of source.artifact.content.commitment_records) {
      const grouped = records.get(record.commitment_id) ?? [];
      grouped.push({
        period: source.declaration.period_id,
        record,
      });
      records.set(record.commitment_id, grouped);
    }
  }

  return [...records.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([commitmentId, grouped]) => {
      const ordered = [...grouped].sort(
        (left, right) => left.period.localeCompare(right.period),
      );
      const latest = ordered.at(-1)!.record;

      return {
        ...latest,
        commitment_id: commitmentId,
        confidence: {
          extraction_confidence: average(
            ordered.map(({ record }) => record.confidence.extraction_confidence),
          ),
          linkage_confidence: average(
            ordered.map(({ record }) => record.confidence.linkage_confidence),
          ),
          resolution_confidence: average(
            ordered.map(({ record }) => record.confidence.resolution_confidence),
          ),
        },
      };
    });
}

function historyDepthScore(periods: number): number {
  const scores = COMMITMENT_TRACKING_CALIBRATION.history_depth_scores;

  if (periods >= 4) {
    return scores.preferred_history;
  }

  if (periods === 3) {
    return scores.extended_longitudinal;
  }

  if (periods === 2) {
    return scores.minimum_longitudinal;
  }

  return scores.first_population;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  const factor = 10 ** COMMITMENT_TRACKING_CALIBRATION.rounding_precision;
  return Math.round(value * factor) / factor;
}
