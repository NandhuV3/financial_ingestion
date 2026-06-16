import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import { CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE } from "./contract.js";
import { analyzeCapitalDeployments } from "./deployment-analysis.js";
import {
  buildCapitalAllocationDepthIndicator,
  buildCapitalAllocationEnrichmentStatus,
} from "./enrichment.js";
import { analyzeCapitalAllocationGaps } from "./gap-analysis.js";
import { extractCapitalAllocationPriorities } from "./priority-extraction.js";
import {
  buildCapitalAllocationCoverageStatus,
  buildCapitalAllocationPeriodSummary,
} from "./summary.js";
import type {
  CapitalAllocationFilingContent,
  CapitalAllocationTrackingArtifactContent,
  CapitalAllocationTrackingBuilderInput,
  FinancialStatementsContent,
} from "./types.js";
import {
  optionalDependency,
  requireDependency,
  validateCapitalAllocationTrackingArtifactContent,
  validateCapitalAllocationTrackingBuilderInput,
} from "./validator.js";

export class CapitalAllocationTrackingBuilder implements Builder<
  CapitalAllocationTrackingBuilderInput,
  CapitalAllocationTrackingArtifactContent
> {
  builderType(): string {
    return CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE;
  }

  async validateInput(input: CapitalAllocationTrackingBuilderInput): Promise<void> {
    validateCapitalAllocationTrackingBuilderInput(input);
  }

  async execute(
    context: BuilderContext<CapitalAllocationTrackingBuilderInput>,
  ): Promise<BuilderResult<CapitalAllocationTrackingArtifactContent>> {
    requireDependency<CompanyKnowledgeArtifactContent>(
      context.dependencies.company_knowledge,
      "company_knowledge",
      "company_knowledge",
    );
    const filingArtifact = requireDependency<CapitalAllocationFilingContent>(
      context.dependencies.current_filing,
      "current_filing",
      "filing",
    );
    const financialStatementsArtifact = requireDependency<FinancialStatementsContent>(
      context.dependencies.current_financial_statements,
      "current_financial_statements",
      "financial_statements",
    );
    const priorCapitalAllocationArtifact = optionalDependency<CapitalAllocationTrackingArtifactContent>(
      context.dependencies.prior_capital_allocation_tracking,
      "prior_capital_allocation_tracking",
      "capital_allocation_tracking",
    );
    const priorFinancialStatementsArtifact = optionalDependency<FinancialStatementsContent>(
      context.dependencies.prior_financial_statements,
      "prior_financial_statements",
      "financial_statements",
    );
    const statedPriorities = extractCapitalAllocationPriorities(
      filingArtifact.content.capital_allocation_priorities,
    );
    const observedDeployments = analyzeCapitalDeployments(
      financialStatementsArtifact.content.capital_deployments,
    );
    const gaps = analyzeCapitalAllocationGaps(statedPriorities, observedDeployments);
    const enrichmentStatus = buildCapitalAllocationEnrichmentStatus({
      prior_capital_allocation_tracking: priorCapitalAllocationArtifact ?? undefined,
      prior_financial_statements: priorFinancialStatementsArtifact ?? undefined,
    });
    const content: CapitalAllocationTrackingArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      stated_priorities: statedPriorities,
      observed_deployments: observedDeployments,
      gaps,
      coverage_status: buildCapitalAllocationCoverageStatus({
        priorities: statedPriorities,
        deployments: observedDeployments,
        priorPeriodAvailable: priorCapitalAllocationArtifact !== null || priorFinancialStatementsArtifact !== null,
        financialStatements: financialStatementsArtifact.content,
      }),
      period_summary: buildCapitalAllocationPeriodSummary({
        priorities: statedPriorities,
        deployments: observedDeployments,
        gaps,
      }),
      enrichment_status: enrichmentStatus,
      depth_indicator: buildCapitalAllocationDepthIndicator(enrichmentStatus),
    };

    validateCapitalAllocationTrackingArtifactContent(content);

    return {
      content,
    };
  }
}
