export const STRUCTURED_INTELLIGENCE_BUILDER_TYPE = "structured-intelligence";
export const STRUCTURED_INTELLIGENCE_BUILDER_VERSION = "structured-intelligence-builder-v1";
export const STRUCTURED_INTELLIGENCE_SCHEMA_VERSION = "structured-intelligence-artifact-v1";
export const STRUCTURED_INTELLIGENCE_PIPELINE_VERSION = "structured-intelligence-pipeline-v1";
export const STRUCTURED_INTELLIGENCE_PROMPT_ID = "structured-intelligence-builder-system";
export const STRUCTURED_INTELLIGENCE_PROMPT_VERSION = "structured-intelligence-builder-v4";
export const STRUCTURED_INTELLIGENCE_MODEL_VERSION = "gpt-4o-mini";
export const STRUCTURED_INTELLIGENCE_EVALUATION_VERSION = "structured-intelligence-evaluation-v1";
export const STRUCTURED_INTELLIGENCE_TEMPERATURE = 0 as const;
export const STRUCTURED_INTELLIGENCE_TOP_LEVEL_FIELD_COUNT = 10;
export const STRUCTURED_INTELLIGENCE_CONFIDENCE_COMPONENT_COUNT = 3;
export const STRUCTURED_INTELLIGENCE_CONFIDENCE_DECIMALS = 4;

export const STRUCTURED_INTELLIGENCE_STATUS_VALUES = [
  "complete",
  "partial",
  "insufficient_filing",
] as const;

export const PRODUCT_IMPORTANCE_VALUES = [
  "high",
  "medium",
  "low",
] as const;

export type StructuredIntelligenceStatus =
  typeof STRUCTURED_INTELLIGENCE_STATUS_VALUES[number];
export type ProductImportance = typeof PRODUCT_IMPORTANCE_VALUES[number];
export type EvidenceReference = string;
export type NotAssessed = "not_assessed";

export type GroundedUnderstanding = {
  confidence: number;
  evidence_refs: EvidenceReference[];
};

export type BusinessModelUnderstanding = GroundedUnderstanding & {
  summary: string;
  value_creation: string;
};

export type ProductUnderstanding = GroundedUnderstanding & {
  product_name: string;
  description: string;
  importance: ProductImportance;
};

export type CustomerUnderstanding = GroundedUnderstanding & {
  customer_segment: string;
  description: string;
};

export type RevenueModelUnderstanding = GroundedUnderstanding & {
  summary: string;
  recurring_components: string[];
  transactional_components: string[];
};

export type RevenueDriverUnderstanding = GroundedUnderstanding & {
  driver: string;
  explanation: string;
};

export type CompetitiveUnderstanding = GroundedUnderstanding & {
  position: string;
  supporting_reasoning: string;
};

export type StrategicPriorityUnderstanding = GroundedUnderstanding & {
  priority: string;
  rationale: string;
};

export type ManagementFocusUnderstanding = GroundedUnderstanding & {
  focus_area: string;
  explanation: string;
};

export type RiskUnderstanding = GroundedUnderstanding & {
  risk: string;
  explanation: string | null;
};

export type DependencyUnderstanding = GroundedUnderstanding & {
  dependency: string;
  explanation: string;
};

export type StructuredUnderstanding = {
  business_model: BusinessModelUnderstanding | null;
  products: ProductUnderstanding[];
  customers: CustomerUnderstanding[];
  revenue_model: RevenueModelUnderstanding | null;
  revenue_drivers: RevenueDriverUnderstanding[];
  competitive_positioning: CompetitiveUnderstanding[];
  strategic_priorities: StrategicPriorityUnderstanding[];
  management_focus: ManagementFocusUnderstanding[];
  risks: RiskUnderstanding[];
  dependencies: DependencyUnderstanding[];
};

export type StructuredValueReference = {
  value_ref: string;
  field_path: string;
  value_hash: string;
  evidence_refs: EvidenceReference[];
};

export type StructuredIntelligenceConfidence = {
  overall: number;
  evidence_coverage: number;
  field_completeness: number;
  theme_utilization: number;
  hallucination_risk: NotAssessed;
};

export type StructuredIntelligenceReplayabilityMetadata = {
  prompt_id: string;
  prompt_version: string;
  model_version: string;
  temperature: 0;
  filing_input_hash: string;
  themes_input_hash: string;
  context_hash: string;
  output_hash: string;
  evaluation_version: string;
};

export type StructuredIntelligenceEvaluationHooks = {
  schema_compliance: number;
  field_coverage: number;
  evidence_coverage: number;
  theme_utilization: number;
  unsupported_claim_count: NotAssessed;
};

export type StructuredIntelligenceArtifactContent = {
  artifact_type: "structured_intelligence";
  company_id: string;
  period_id: string;
  filing_id: string;
  status: StructuredIntelligenceStatus;
  understanding: StructuredUnderstanding;
  value_references: StructuredValueReference[];
  confidence: StructuredIntelligenceConfidence;
  replayability_metadata: StructuredIntelligenceReplayabilityMetadata;
  evaluation_hooks: StructuredIntelligenceEvaluationHooks;
};
