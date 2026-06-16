import type {
  CapitalAllocationCoverageStatus,
  CapitalAllocationGap,
  CapitalAllocationPeriodSummary,
  CapitalAllocationPriority,
  CapitalDeployment,
  FinancialStatementsContent,
} from "./types.js";

export function buildCapitalAllocationCoverageStatus(input: {
  priorities: CapitalAllocationPriority[];
  deployments: CapitalDeployment[];
  priorPeriodAvailable: boolean;
  financialStatements: FinancialStatementsContent;
}): CapitalAllocationCoverageStatus {
  return {
    priorities_available: input.priorities.length > 0,
    deployments_available: input.deployments.length > 0,
    prior_period_available: input.priorPeriodAvailable,
    financial_statement_coverage: input.financialStatements.coverage ?? "complete",
  };
}

export function buildCapitalAllocationPeriodSummary(input: {
  priorities: CapitalAllocationPriority[];
  deployments: CapitalDeployment[];
  gaps: CapitalAllocationGap[];
}): CapitalAllocationPeriodSummary {
  return {
    priority_count: input.priorities.length,
    deployment_count: input.deployments.length,
    gap_count: input.gaps.length,
    aligned_gap_count: countGaps(input.gaps, "aligned"),
    under_supported_gap_count: countGaps(input.gaps, "under_supported"),
    unsupported_deployment_gap_count: countGaps(input.gaps, "unsupported_deployment"),
    insufficient_evidence_gap_count: countGaps(input.gaps, "insufficient_evidence"),
  };
}

function countGaps(gaps: CapitalAllocationGap[], gapType: CapitalAllocationGap["gap_type"]): number {
  return gaps.filter((gap) => gap.gap_type === gapType).length;
}
