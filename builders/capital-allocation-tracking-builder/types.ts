import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type {
  CapitalAllocationType,
  DepthLevel,
  FinancialStatementCoverage,
  GapType,
} from "./contract.js";

export type CapitalAllocationTrackingBuilderInput = {
  company_id: string;
  period_id: string;
};

export type CapitalAllocationTrackingBuilderDependencies = {
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent>;
  current_filing: Artifact<CapitalAllocationFilingContent>;
  current_financial_statements: Artifact<FinancialStatementsContent>;
  prior_capital_allocation_tracking?: Artifact<CapitalAllocationTrackingArtifactContent>;
  prior_financial_statements?: Artifact<FinancialStatementsContent>;
};

export type CapitalAllocationFilingContent = {
  capital_allocation_priorities?: CapitalAllocationPriorityInput[];
};

export type CapitalAllocationPriorityInput = {
  priority_id: string;
  priority_type: CapitalAllocationType;
  description: string;
  evidence_refs: string[];
  filing_refs: string[];
};

export type FinancialStatementsContent = {
  capital_deployments?: CapitalDeploymentInput[];
  coverage?: FinancialStatementCoverage;
};

export type CapitalDeploymentInput = {
  deployment_id: string;
  deployment_type: CapitalAllocationType;
  amount: number | null;
  evidence_refs: string[];
  filing_refs: string[];
  financial_statement_refs: string[];
};

export type CapitalAllocationPriority = {
  priority_id: string;
  priority_type: CapitalAllocationType;
  description: string;
  evidence_refs: string[];
  filing_refs: string[];
};

export type CapitalDeployment = {
  deployment_id: string;
  deployment_type: CapitalAllocationType;
  amount: number | null;
  evidence_refs: string[];
  filing_refs: string[];
  financial_statement_refs: string[];
};

export type CapitalAllocationGap = {
  gap_id: string;
  gap_type: GapType;
  priority_refs: string[];
  deployment_refs: string[];
  evidence_refs: string[];
  explanation: string;
};

export type CapitalAllocationCoverageStatus = {
  priorities_available: boolean;
  deployments_available: boolean;
  prior_period_available: boolean;
  financial_statement_coverage: FinancialStatementCoverage;
};

export type CapitalAllocationPeriodSummary = {
  priority_count: number;
  deployment_count: number;
  gap_count: number;
  aligned_gap_count: number;
  under_supported_gap_count: number;
  unsupported_deployment_gap_count: number;
  insufficient_evidence_gap_count: number;
};

export type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

export type EnrichmentStatus = {
  prior_capital_allocation_tracking: EnrichmentInputStatus;
  prior_financial_statements: EnrichmentInputStatus;
};

export type DepthIndicator = {
  overall: DepthLevel;
  prior_period_dimension: "present" | "absent";
};

export type CapitalAllocationTrackingArtifactContent = {
  company_id: string;
  period_id: string;
  stated_priorities: CapitalAllocationPriority[];
  observed_deployments: CapitalDeployment[];
  gaps: CapitalAllocationGap[];
  coverage_status: CapitalAllocationCoverageStatus;
  period_summary: CapitalAllocationPeriodSummary;
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
};

export type CapitalAllocationBuildContext = {
  companyId: string;
  periodId: string;
  companyKnowledgeArtifact: Artifact<CompanyKnowledgeArtifactContent>;
  filingArtifact: Artifact<CapitalAllocationFilingContent>;
  financialStatementsArtifact: Artifact<FinancialStatementsContent>;
  priorCapitalAllocationArtifact: Artifact<CapitalAllocationTrackingArtifactContent> | null;
  priorFinancialStatementsArtifact: Artifact<FinancialStatementsContent> | null;
};
