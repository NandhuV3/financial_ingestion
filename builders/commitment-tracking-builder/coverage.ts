import type {
  CommitmentTrackingBuildDependencies,
  CommitmentTrackingCoverage,
  CommitmentTrackingDepthIndicator,
} from "./types.js";

export function buildCoverage(
  dependencies: CommitmentTrackingBuildDependencies,
  currentPeriod: string,
): CommitmentTrackingCoverage {
  const historicalPeriodCount = historicalPeriodsAvailable(dependencies, currentPeriod);

  return {
    status: dependencies.missing_sources.length === 0 ? "complete" : "partial",
    current_period_source_count: dependencies.sources.filter(
      ({ declaration }) => declaration.period_id === currentPeriod,
    ).length,
    historical_period_count: historicalPeriodCount,
    missing_sources: [...dependencies.missing_sources].sort(
      (left, right) => left.period_id.localeCompare(right.period_id)
        || left.source_type.localeCompare(right.source_type),
    ),
  };
}

export function buildDepthIndicator(
  dependencies: CommitmentTrackingBuildDependencies,
  currentPeriod: string,
): CommitmentTrackingDepthIndicator {
  const periodCount = historicalPeriodsAvailable(dependencies, currentPeriod);

  return {
    historical_periods_available: periodCount,
    first_population: periodCount === 1,
    longitudinal_tracking_available: periodCount >= 2,
    preferred_history_available: periodCount >= 4,
  };
}

function historicalPeriodsAvailable(
  dependencies: CommitmentTrackingBuildDependencies,
  currentPeriod: string,
): number {
  const sourcePeriodCount = availablePeriods(dependencies, currentPeriod).size;
  const priorDepth = dependencies.prior?.content.depth_indicator.historical_periods_available ?? 0;
  const priorPeriod = dependencies.prior?.content.period;

  return Math.max(
    sourcePeriodCount,
    priorDepth + (priorPeriod !== undefined && priorPeriod !== currentPeriod ? 1 : 0),
  );
}

function availablePeriods(
  dependencies: CommitmentTrackingBuildDependencies,
  currentPeriod: string,
): Set<string> {
  const periods = new Set(dependencies.sources.map(({ declaration }) => declaration.period_id));
  periods.add(currentPeriod);
  return periods;
}
