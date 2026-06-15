export const STRUCTURED_INTELLIGENCE_BUILDER_TYPE = "structured-intelligence";
export const STRUCTURED_INTELLIGENCE_BUILDER_VERSION = "structured-intelligence-builder-v1";
export const STRUCTURED_INTELLIGENCE_SCHEMA_VERSION = "structured-intelligence-artifact-v1";
export const STRUCTURED_INTELLIGENCE_PIPELINE_VERSION = "structured-intelligence-pipeline-v1";
export const STRUCTURED_INTELLIGENCE_MODEL_VERSION = "gpt-4o-mini";

export const STRUCTURED_INTELLIGENCE_STATUS_VALUES = [
  "complete",
  "partial",
  "insufficient_filing",
] as const;

export type StructuredIntelligenceStatus = typeof STRUCTURED_INTELLIGENCE_STATUS_VALUES[number];

export type EvidenceReference = string;

export type BusinessModelUnderstanding = {
  summary: string;
  value_creation: string;
  revenue_structure: string;
  evidence_refs: EvidenceReference[];
};

export type ProductUnderstanding = {
  product_name: string;
  description: string;
  importance: "high" | "medium" | "low";
  evidence_refs: EvidenceReference[];
};

export type CustomerUnderstanding = {
  customer_segment: string;
  description: string;
  evidence_refs: EvidenceReference[];
};

export type RevenueModelUnderstanding = {
  summary: string;
  recurring_components: string[];
  transactional_components: string[];
  evidence_refs: EvidenceReference[];
};

export type RevenueDriverUnderstanding = {
  driver: string;
  explanation: string;
  evidence_refs: EvidenceReference[];
};

export type CompetitiveUnderstanding = {
  position: string;
  supporting_reasoning: string;
  evidence_refs: EvidenceReference[];
};

export type StrategicPriorityUnderstanding = {
  priority: string;
  rationale: string;
  evidence_refs: EvidenceReference[];
};

export type ManagementFocusUnderstanding = {
  focus_area: string;
  explanation: string;
  evidence_refs: EvidenceReference[];
};

export type RiskUnderstanding = {
  risk: string;
  explanation: string;
  evidence_refs: EvidenceReference[];
};

export type DependencyUnderstanding = {
  dependency: string;
  explanation: string;
  evidence_refs: EvidenceReference[];
};

export type StructuredUnderstanding = {
  business_model: BusinessModelUnderstanding;
  products: ProductUnderstanding[];
  customers: CustomerUnderstanding[];
  revenue_model: RevenueModelUnderstanding;
  revenue_drivers: RevenueDriverUnderstanding[];
  competitive_positioning: CompetitiveUnderstanding[];
  strategic_priorities: StrategicPriorityUnderstanding[];
  management_focus: ManagementFocusUnderstanding[];
  risks: RiskUnderstanding[];
  dependencies: DependencyUnderstanding[];
};

export type StructuredIntelligenceConfidence = {
  overall: number;
  evidence_coverage: number;
  field_completeness: number;
  theme_utilization: number;
  hallucination_risk: number;
};

export type StructuredIntelligenceEvaluationHooks = {
  prompt_version: string;
  model_version: string;
  section_coverage: number;
  field_coverage: number;
  evidence_coverage: number;
  theme_utilization: number;
  confidence_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  generic_language_count: number;
  unsupported_entity_warnings: string[];
};

export type StructuredIntelligenceArtifactContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_period: string;
  status: StructuredIntelligenceStatus;
  understanding: StructuredUnderstanding;
  confidence: StructuredIntelligenceConfidence;
  evaluation_hooks: StructuredIntelligenceEvaluationHooks;
};

