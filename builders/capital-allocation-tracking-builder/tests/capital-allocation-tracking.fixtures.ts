import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type {
  CapitalAllocationFilingContent,
  CapitalAllocationTrackingArtifactContent,
  CapitalAllocationTrackingBuilderInput,
  FinancialStatementsContent,
} from "../types.js";

export function input(): CapitalAllocationTrackingBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
  };
}

export function companyKnowledgeArtifact(): Artifact<CompanyKnowledgeArtifactContent> {
  return artifact("company-knowledge-1", "company_knowledge", {
    company_id: "MSFT",
    period_id: "2026-Q2",
    company_knowledge_version: 1,
    knowledge: {
      business_model: {
        summary: "Microsoft sells software and cloud services.",
        value_creation: "Customers use Microsoft platforms for productivity and workloads.",
        revenue_structure: "Subscriptions and usage.",
        confidence: 0.9,
        supporting_periods: ["2026-Q2"],
        last_updated_period: "2026-Q2",
      },
      products: [],
      customers: [],
      revenue_structure: {
        summary: "Recurring software and cloud revenue.",
        recurring_components: [],
        transactional_components: [],
        confidence: 0.9,
        supporting_periods: ["2026-Q2"],
        last_updated_period: "2026-Q2",
      },
      revenue_drivers: [],
      competitive_positioning: [],
      strategic_priorities: [],
      management_focus: [],
      dependencies: [],
    },
    confidence: {
      overall: 0.9,
      evidence_depth: 0.9,
      history_length: 1,
      consistency_score: 0.9,
      governance_confidence: 0.9,
    },
  });
}

export function filingArtifact(
  content: CapitalAllocationFilingContent = filingContent(),
): Artifact<CapitalAllocationFilingContent> {
  return artifact("filing-1", "filing", content);
}

export function financialStatementsArtifact(
  content: FinancialStatementsContent = financialStatementsContent(),
): Artifact<FinancialStatementsContent> {
  return artifact("financial-statements-1", "financial_statements", content);
}

export function priorCapitalAllocationArtifact(): Artifact<CapitalAllocationTrackingArtifactContent> {
  return artifact("capital-allocation-prior-1", "capital_allocation_tracking", validCapitalAllocationContent());
}

export function priorFinancialStatementsArtifact(): Artifact<FinancialStatementsContent> {
  return artifact("prior-financial-statements-1", "financial_statements", {
    capital_deployments: [],
    coverage: "partial",
  });
}

export function filingContent(): CapitalAllocationFilingContent {
  return {
    capital_allocation_priorities: [
      {
        priority_id: "priority-buybacks",
        priority_type: "buybacks",
        description: "Return excess capital through share repurchases.",
        evidence_refs: ["filing:capital-allocation:priority-buybacks"],
        filing_refs: ["filing-1:item2"],
      },
    ],
  };
}

export function financialStatementsContent(): FinancialStatementsContent {
  return {
    coverage: "complete",
    capital_deployments: [
      {
        deployment_id: "deployment-buybacks",
        deployment_type: "buybacks",
        amount: 1200000000,
        evidence_refs: ["financials:cash-flow:buybacks"],
        filing_refs: ["filing-1:cash-flow"],
        financial_statement_refs: ["financial-statements-1:cash-flow"],
      },
    ],
  };
}

export function validCapitalAllocationContent(): CapitalAllocationTrackingArtifactContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    stated_priorities: [
      {
        priority_id: "priority-buybacks",
        priority_type: "buybacks",
        description: "Return excess capital through share repurchases.",
        evidence_refs: ["filing:capital-allocation:priority-buybacks"],
        filing_refs: ["filing-1:item2"],
      },
    ],
    observed_deployments: [
      {
        deployment_id: "deployment-buybacks",
        deployment_type: "buybacks",
        amount: 1200000000,
        evidence_refs: ["financials:cash-flow:buybacks"],
        filing_refs: ["filing-1:cash-flow"],
        financial_statement_refs: ["financial-statements-1:cash-flow"],
      },
    ],
    gaps: [
      {
        gap_id: "aligned:priority-buybacks:deployment-buybacks",
        gap_type: "aligned",
        priority_refs: ["priority-buybacks"],
        deployment_refs: ["deployment-buybacks"],
        evidence_refs: [
          "filing:capital-allocation:priority-buybacks",
          "financials:cash-flow:buybacks",
        ],
        explanation: "Observed deployment aligns with stated capital priority: Return excess capital through share repurchases.",
      },
    ],
    coverage_status: {
      priorities_available: true,
      deployments_available: true,
      prior_period_available: false,
      financial_statement_coverage: "complete",
    },
    period_summary: {
      priority_count: 1,
      deployment_count: 1,
      gap_count: 1,
      aligned_gap_count: 1,
      under_supported_gap_count: 0,
      unsupported_deployment_gap_count: 0,
      insufficient_evidence_gap_count: 0,
    },
    enrichment_status: {
      prior_capital_allocation_tracking: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Prior Capital Allocation Tracking enrichment was not provided.",
      },
      prior_financial_statements: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Prior Financial Statements enrichment was not provided.",
      },
    },
    depth_indicator: {
      overall: "base",
      prior_period_dimension: "absent",
    },
  };
}

export function artifact<T>(artifactId: string, artifactType: ArtifactType, content: T): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: `${artifactType}-artifact-hash`,
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
      },
    },
    content,
  };
}

export class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifactValue: Artifact<T>): Promise<void> {
    this.artifacts.set(artifactValue.identity.artifact_id, cloneArtifact(artifactValue));
    this.current.set(lookupKey(artifactValue.identity), artifactValue.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifactValue = this.artifacts.get(artifactId);

    return artifactValue ? cloneArtifact(artifactValue) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifactValue) =>
        artifactValue.identity.artifact_type === lookup.artifact_type
        && artifactValue.identity.company_id === lookup.company_id
        && artifactValue.identity.period_id === lookup.period_id)
      .map((artifactValue) => cloneArtifact(artifactValue) as Artifact<T>);
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifactValue: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifactValue)) as Artifact<T>;
}
