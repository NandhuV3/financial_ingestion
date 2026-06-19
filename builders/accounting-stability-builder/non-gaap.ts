import {
  ACCOUNTING_STABILITY_CALIBRATION,
  type Materiality,
  type TrendDirection,
} from "./contract.js";
import type {
  AccountingBuildDependencies,
  NonGAAPAnalysis,
  NonGAAPPeriod,
} from "./types.js";

export function buildNonGAAPAnalysis(
  dependencies: AccountingBuildDependencies,
): NonGAAPAnalysis | null {
  const periods = dependencies.sources
    .filter(({ artifact }) =>
      artifact.content.coverage.non_gaap_available
      && artifact.content.non_gaap_measure !== null)
    .map(({ declaration, artifact }): NonGAAPPeriod => {
      const observation = artifact.content.non_gaap_measure!;
      return {
        period: declaration.period_id,
        gaap_value: observation.gaap_value,
        non_gaap_value: observation.non_gaap_value,
        gap_percentage: round(
          Math.abs(observation.non_gaap_value - observation.gaap_value)
          / Math.abs(observation.gaap_value)
          * 100,
        ),
        exclusion_items: [...observation.exclusion_items].sort(),
        evidence_refs: [...new Set(observation.evidence_refs)].sort(),
        source_artifact_ref: artifact.identity.artifact_id,
      };
    })
    .sort((left, right) => left.period.localeCompare(right.period));

  if (periods.length < ACCOUNTING_STABILITY_CALIBRATION.minimum_history_periods) {
    return null;
  }

  const directions = periods.slice(1).map((period, index) =>
    classifyDirection(period.gap_percentage, periods[index]!.gap_percentage));
  const direction = directions.at(-1)!;
  let consecutivePeriods = 1;

  for (let index = directions.length - 2; index >= 0; index -= 1) {
    if (directions[index] !== direction) {
      break;
    }
    consecutivePeriods += 1;
  }

  const latest = periods.at(-1)!;
  const confidenceValues = dependencies.sources
    .filter(({ declaration }) =>
      periods.some(({ period }) => period === declaration.period_id))
    .map(({ artifact }) => artifact.content.non_gaap_measure!.confidence);

  return {
    periods,
    trend_assessment: {
      direction,
      consecutive_periods: consecutivePeriods,
      materiality: classifyMateriality(latest.gap_percentage),
    },
    confidence: round(average(confidenceValues)),
  };
}

function classifyDirection(current: number, prior: number): TrendDirection {
  if (current > prior) {
    return "widening";
  }
  if (current < prior) {
    return "narrowing";
  }
  return "stable";
}

function classifyMateriality(gapPercentage: number): Materiality {
  if (
    gapPercentage
    >= ACCOUNTING_STABILITY_CALIBRATION.non_gaap_materiality
      .high_minimum_percentage
  ) {
    return "high";
  }
  if (
    gapPercentage
    >= ACCOUNTING_STABILITY_CALIBRATION.non_gaap_materiality
      .medium_minimum_percentage
  ) {
    return "medium";
  }
  return "low";
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  const factor = 10 ** ACCOUNTING_STABILITY_CALIBRATION.rounding_precision;
  return Math.round(value * factor) / factor;
}
