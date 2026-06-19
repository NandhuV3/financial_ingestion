import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import { NARRATIVE_CONSISTENCY_CALIBRATION } from "./contract.js";
import type {
  NarrativeBuildDependencies,
  NarrativeCoverageStatus,
  NarrativeDepthIndicator,
} from "./types.js";
import { isPeriodAfter } from "./period.js";

export function buildCoverageAndDepth(
  dependencies: NarrativeBuildDependencies,
): {
  coverage: NarrativeCoverageStatus;
  depth: NarrativeDepthIndicator;
} {
  const sourcePeriods = new Set(
    dependencies.sources.map(({ declaration }) => declaration.period_id),
  );
  const priorPeriods = dependencies.prior?.content.depth_indicator
    .historical_periods_available ?? 0;
  const newSourcePeriods = dependencies.prior === null
    ? sourcePeriods.size
    : [...sourcePeriods].filter((period) =>
        isPeriodAfter(period, dependencies.prior!.content.period)).length;
  const availablePeriods = dependencies.prior === null
    ? newSourcePeriods
    : priorPeriods + newSourcePeriods;

  if (availablePeriods < NARRATIVE_CONSISTENCY_CALIBRATION.persistent_after_consecutive_periods) {
    throw new BuilderDependencyError(
      "Narrative Consistency requires at least two historical periods.",
    );
  }

  return {
    coverage: {
      status: dependencies.missing_periods.length === 0 ? "complete" : "partial",
      available_periods: availablePeriods,
      missing_periods: dependencies.missing_periods,
    },
    depth: {
      historical_periods_available: availablePeriods,
      minimum_history_available: true,
      preferred_history_available:
        availablePeriods >= NARRATIVE_CONSISTENCY_CALIBRATION.preferred_history_periods,
    },
  };
}
