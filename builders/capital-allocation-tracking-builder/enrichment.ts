import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { DepthIndicator, EnrichmentInputStatus, EnrichmentStatus } from "./types.js";

export function buildCapitalAllocationEnrichmentStatus(dependencies: {
  prior_capital_allocation_tracking?: Artifact<unknown>;
  prior_financial_statements?: Artifact<unknown>;
}): EnrichmentStatus {
  return {
    prior_capital_allocation_tracking: statusFor(
      dependencies.prior_capital_allocation_tracking,
      "Prior Capital Allocation Tracking enrichment was not provided.",
    ),
    prior_financial_statements: statusFor(
      dependencies.prior_financial_statements,
      "Prior Financial Statements enrichment was not provided.",
    ),
  };
}

export function buildCapitalAllocationDepthIndicator(enrichmentStatus: EnrichmentStatus): DepthIndicator {
  const priorCapitalAvailable = enrichmentStatus.prior_capital_allocation_tracking.available;
  const priorFinancialsAvailable = enrichmentStatus.prior_financial_statements.available;
  const priorPeriodPresent = priorCapitalAvailable || priorFinancialsAvailable;

  if (priorCapitalAvailable && priorFinancialsAvailable) {
    return {
      overall: "full",
      prior_period_dimension: "present",
    };
  }

  if (priorPeriodPresent) {
    return {
      overall: "standard",
      prior_period_dimension: "present",
    };
  }

  return {
    overall: "base",
    prior_period_dimension: "absent",
  };
}

function statusFor(artifact: Artifact<unknown> | undefined, absentReason: string): EnrichmentInputStatus {
  if (artifact === undefined) {
    return {
      available: false,
      artifact_path: null,
      artifact_version: null,
      absent_reason: absentReason,
    };
  }

  return {
    available: true,
    artifact_path: artifact.identity.artifact_id,
    artifact_version: artifact.identity.version,
    absent_reason: null,
  };
}
