import { BuilderDependencyError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  ACCOUNTING_STABILITY_CALIBRATION,
  type CoverageState,
} from "./contract.js";
import type {
  AccountingBuildDependencies,
  AccountingStabilityCoverage,
  AccountingStabilityDepthIndicator,
} from "./types.js";

export function buildCoverageAndDepth(
  dependencies: AccountingBuildDependencies,
): {
  coverage: AccountingStabilityCoverage;
  depth: AccountingStabilityDepthIndicator;
} {
  const periodCount = new Set(
    dependencies.sources.map(({ declaration }) => declaration.period_id),
  ).size;

  if (periodCount < ACCOUNTING_STABILITY_CALIBRATION.minimum_history_periods) {
    throw new BuilderDependencyError(
      "Accounting Stability requires at least two unique historical periods.",
    );
  }

  const accountingPolicies = coverageFor(
    dependencies.sources.map(
      ({ artifact }) => artifact.content.coverage.accounting_policies_available,
    ),
  );
  const segments = coverageFor(
    dependencies.sources.map(
      ({ artifact }) => artifact.content.coverage.segments_available,
    ),
  );
  const nonGaap = coverageFor(
    dependencies.sources.map(
      ({ artifact }) => artifact.content.coverage.non_gaap_available,
    ),
  );
  const restatements = coverageFor(
    dependencies.sources.map(
      ({ artifact }) => artifact.content.coverage.restatements_available,
    ),
  );
  const states = [accountingPolicies, segments, nonGaap, restatements];
  const overall: CoverageState = states.every((state) => state === "complete")
    ? "complete"
    : states.every((state) => state === "unavailable")
    ? "unavailable"
    : "partial";

  if (overall === "unavailable") {
    throw new BuilderDependencyError(
      "Accounting Stability requires at least one available accounting dimension.",
    );
  }

  return {
    coverage: {
      accounting_policies: accountingPolicies,
      segments,
      non_gaap: nonGaap,
      restatements,
      overall,
    },
    depth: {
      overall: periodCount >= ACCOUNTING_STABILITY_CALIBRATION.full_history_periods
        ? "full"
        : periodCount >= ACCOUNTING_STABILITY_CALIBRATION.standard_history_periods
        ? "standard"
        : "base",
      period_count: periodCount,
    },
  };
}

function coverageFor(values: boolean[]): CoverageState {
  const available = values.filter(Boolean).length;
  if (available === 0) {
    return "unavailable";
  }
  return available === values.length ? "complete" : "partial";
}
