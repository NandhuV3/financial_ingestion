import { ACCOUNTING_STABILITY_CALIBRATION } from "./contract.js";
import type {
  AccountingBuildDependencies,
  AccountingStabilityConfidence,
  AccountingStabilityDepthIndicator,
} from "./types.js";

export function buildAccountingConfidence(input: {
  dependencies: AccountingBuildDependencies;
  depth: AccountingStabilityDepthIndicator;
}): AccountingStabilityConfidence {
  const totalPeriods = input.dependencies.sources.length;
  const adjacentComparisons = Math.max(totalPeriods - 1, 0);
  const extraction = input.dependencies.sources.filter(
    ({ artifact }) => artifact.content.evidence_refs.length > 0,
  ).length / totalPeriods;
  const policyDetection = adjacentComparisons === 0
    ? 0
    : countAvailableComparisons(
        input.dependencies,
        "accounting_policies_available",
      ) / adjacentComparisons;
  const segmentDetection = adjacentComparisons === 0
    ? 0
    : countAvailableComparisons(
        input.dependencies,
        "segments_available",
      ) / adjacentComparisons;
  const historicalDepth = Math.min(
    input.depth.period_count
      / ACCOUNTING_STABILITY_CALIBRATION.full_history_periods,
    1,
  );
  const weights = ACCOUNTING_STABILITY_CALIBRATION.confidence_weights;

  return {
    overall: round(
      extraction * weights.extraction
      + policyDetection * weights.policy_detection
      + segmentDetection * weights.segment_detection
      + historicalDepth * weights.historical_depth,
    ),
    extraction_confidence: round(extraction),
    policy_detection_confidence: round(policyDetection),
    segment_detection_confidence: round(segmentDetection),
    historical_depth_score: round(historicalDepth),
  };
}

function countAvailableComparisons(
  dependencies: AccountingBuildDependencies,
  field: "accounting_policies_available" | "segments_available",
): number {
  let count = 0;
  for (let index = 1; index < dependencies.sources.length; index += 1) {
    if (
      dependencies.sources[index - 1]!.artifact.content.coverage[field]
      && dependencies.sources[index]!.artifact.content.coverage[field]
    ) {
      count += 1;
    }
  }
  return count;
}

export function recomputeOverallConfidence(
  confidence: Omit<AccountingStabilityConfidence, "overall">,
): number {
  const weights = ACCOUNTING_STABILITY_CALIBRATION.confidence_weights;
  return round(
    confidence.extraction_confidence * weights.extraction
    + confidence.policy_detection_confidence * weights.policy_detection
    + confidence.segment_detection_confidence * weights.segment_detection
    + confidence.historical_depth_score * weights.historical_depth,
  );
}

function round(value: number): number {
  const factor = 10 ** ACCOUNTING_STABILITY_CALIBRATION.rounding_precision;
  return Math.round(value * factor) / factor;
}

