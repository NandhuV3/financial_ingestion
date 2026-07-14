import type {
  DependencyReference,
} from "../artifacts/artifact-lineage.js";

/**
 * Canonical Structured Intelligence domain models.
 *
 * These models describe filing-scoped business understanding only. They do not
 * implement prompt execution, provider invocation, replay policy, artifact
 * persistence, governance, or downstream Company Intelligence behavior.
 */
export const STRUCTURED_INTELLIGENCE_MODELS_CONTRACT_VERSION =
  "structured-intelligence-models-v1";

export const STRUCTURED_INTELLIGENCE_SCHEMA_VERSION =
  "structured-intelligence-artifact-v1";

export const STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE =
  "single_filing" as const;

export const STRUCTURED_INTELLIGENCE_SECTION_IDS = [
  "business_model",
  "products",
  "customers",
  "revenue_model",
  "revenue_drivers",
  "competitive_positioning",
  "strategic_priorities",
  "management_focus",
  "risks",
  "dependencies",
] as const;

export type StructuredIntelligenceSectionId =
  typeof STRUCTURED_INTELLIGENCE_SECTION_IDS[number];

export const STRUCTURED_INTELLIGENCE_STATUSES = [
  "complete",
  "partial",
  "insufficient_filing",
] as const;

export type StructuredIntelligenceStatus =
  typeof STRUCTURED_INTELLIGENCE_STATUSES[number];

export const STRUCTURED_INTELLIGENCE_PRODUCT_IMPORTANCE_VALUES = [
  "high",
  "medium",
  "low",
] as const;

export type StructuredIntelligenceProductImportance =
  typeof STRUCTURED_INTELLIGENCE_PRODUCT_IMPORTANCE_VALUES[number];

/**
 * Immutable evidence attribution for one Structured Intelligence statement.
 *
 * Evidence references remain filing-scoped and attributable to filing evidence,
 * Evidence Identity, and Themes. The model intentionally carries no prompt,
 * provider, execution, lineage, or governance metadata.
 */
export interface StructuredIntelligenceEvidenceReference {
  evidence_ref: string;
  evidence_hash: string;
  evidence_identity_id: string;
  filing_section: string;
  source_excerpt: string;
  theme_ids: readonly string[];
}

export interface StructuredIntelligenceGrounding {
  confidence: number;
  evidence: readonly StructuredIntelligenceEvidenceReference[];
}

export interface StructuredIntelligenceBusinessModel
  extends StructuredIntelligenceGrounding {
  summary: string;
  value_creation: string;
}

export interface StructuredIntelligenceProduct
  extends StructuredIntelligenceGrounding {
  product_name: string;
  description: string;
  importance: StructuredIntelligenceProductImportance;
}

export interface StructuredIntelligenceCustomer
  extends StructuredIntelligenceGrounding {
  customer_segment: string;
  description: string;
}

export interface StructuredIntelligenceRevenueModel
  extends StructuredIntelligenceGrounding {
  summary: string;
  recurring_components: readonly string[];
  transactional_components: readonly string[];
}

export interface StructuredIntelligenceRevenueDriver
  extends StructuredIntelligenceGrounding {
  driver: string;
  explanation: string;
}

export interface StructuredIntelligenceCompetitivePositioning
  extends StructuredIntelligenceGrounding {
  position: string;
  supporting_reasoning: string;
}

export interface StructuredIntelligenceStrategicPriority
  extends StructuredIntelligenceGrounding {
  priority: string;
  rationale: string;
}

export interface StructuredIntelligenceManagementFocus
  extends StructuredIntelligenceGrounding {
  focus_area: string;
  explanation: string;
}

export interface StructuredIntelligenceRisk
  extends StructuredIntelligenceGrounding {
  risk: string;
  explanation: string;
}

export interface StructuredIntelligenceDependency
  extends StructuredIntelligenceGrounding {
  dependency: string;
  explanation: string;
}

/**
 * Governed business payload for one filing-scoped Structured Intelligence
 * artifact. This is not durable Company Knowledge and contains no downstream
 * interpretation.
 */
export interface StructuredIntelligencePayload {
  business_model: StructuredIntelligenceBusinessModel | null;
  products: readonly StructuredIntelligenceProduct[];
  customers: readonly StructuredIntelligenceCustomer[];
  revenue_model: StructuredIntelligenceRevenueModel | null;
  revenue_drivers: readonly StructuredIntelligenceRevenueDriver[];
  competitive_positioning:
    readonly StructuredIntelligenceCompetitivePositioning[];
  strategic_priorities: readonly StructuredIntelligenceStrategicPriority[];
  management_focus: readonly StructuredIntelligenceManagementFocus[];
  risks: readonly StructuredIntelligenceRisk[];
  dependencies: readonly StructuredIntelligenceDependency[];
}

/**
 * Section wrapper used by prompt plans and business validation to reason about
 * governed Structured Intelligence fields without changing their payload shape.
 */
export interface StructuredIntelligenceSection<TSectionPayload> {
  section_id: StructuredIntelligenceSectionId;
  payload: TSectionPayload;
  evidence: readonly StructuredIntelligenceEvidenceReference[];
}

export interface StructuredIntelligenceInputReferences {
  filing_artifact: DependencyReference;
  themes_artifact: DependencyReference;
}

/**
 * Required business input contract for Structured Intelligence.
 *
 * Version 1 consumes only Filing Artifact and Themes references. Platform
 * Intelligence and downstream Company Intelligence artifacts are intentionally
 * not represented.
 */
export interface StructuredIntelligenceInput {
  company_id: string;
  period_id: string;
  filing_id: string;
  inputs: StructuredIntelligenceInputReferences;
}

export interface StructuredIntelligenceEvidenceSummary {
  evidence_reference_count: number;
  theme_reference_count: number;
}

/**
 * Business-owned Structured Intelligence metadata.
 *
 * Operational metadata such as generated_at, prompt package references, model
 * references, execution records, replay references, artifact identity, hashes,
 * and lineage are owned by Platform Foundation contracts.
 */
export interface StructuredIntelligenceMetadata {
  schema_version: typeof STRUCTURED_INTELLIGENCE_SCHEMA_VERSION;
  status: StructuredIntelligenceStatus;
  business_scope: typeof STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE;
  evidence_summary: StructuredIntelligenceEvidenceSummary;
}

/**
 * Complete layer-owned Structured Intelligence content.
 *
 * Artifact Framework metadata and lineage wrap this model when an artifact is
 * constructed by later implementation packages.
 */
export interface StructuredIntelligence {
  artifact_type: "structured_intelligence";
  company_id: string;
  period_id: string;
  filing_id: string;
  metadata: StructuredIntelligenceMetadata;
  payload: StructuredIntelligencePayload;
}
