import type {
  StructuredUnderstanding,
} from "../structured-intelligence/contract.js";
import type { CandidateChange, StabilityClass } from "./contract.js";

export type CompanyKnowledgeBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

export type KnowledgeFieldPath =
  | "business_model"
  | "products"
  | "customers"
  | "revenue_structure"
  | "revenue_drivers"
  | "competitive_positioning"
  | "strategic_priorities"
  | "management_focus"
  | "dependencies";

export type CompanyKnowledgeConfidence = {
  overall: number;
  evidence_depth: number;
  history_length: number;
  consistency_score: number;
  governance_confidence: number;
};

export type CompanyKnowledgeArtifactContent = {
  company_id: string;
  period_id?: string;
  company_knowledge_version: number;
  knowledge: CompanyKnowledge;
  confidence: CompanyKnowledgeConfidence;
};

export type CompanyKnowledge = {
  business_model: BusinessModelKnowledge;
  products: ProductKnowledge[];
  customers: CustomerKnowledge[];
  revenue_structure: RevenueStructureKnowledge;
  revenue_drivers: RevenueDriverKnowledge[];
  competitive_positioning: CompetitivePositionKnowledge[];
  strategic_priorities: StrategicPriorityKnowledge[];
  management_focus: ManagementFocusKnowledge[];
  dependencies: DependencyKnowledge[];
};

export type KnowledgeValueBase = {
  confidence: number;
  supporting_periods: string[];
  last_updated_period: string;
};

export type BusinessModelKnowledge = KnowledgeValueBase & {
  summary: string;
  value_creation: string;
  revenue_structure: string;
};

export type ProductKnowledge = KnowledgeValueBase & {
  product_name: string;
  description: string;
  importance: "high" | "medium" | "low";
};

export type CustomerKnowledge = KnowledgeValueBase & {
  customer_segment: string;
  description: string;
};

export type RevenueStructureKnowledge = KnowledgeValueBase & {
  summary: string;
  recurring_components: string[];
  transactional_components: string[];
};

export type RevenueDriverKnowledge = KnowledgeValueBase & {
  driver: string;
  description: string;
};

export type CompetitivePositionKnowledge = KnowledgeValueBase & {
  positioning: string;
  rationale: string;
};

export type StrategicPriorityKnowledge = KnowledgeValueBase & {
  priority: string;
  description: string;
};

export type ManagementFocusKnowledge = KnowledgeValueBase & {
  focus_area: string;
  description: string;
};

export type DependencyKnowledge = KnowledgeValueBase & {
  dependency: string;
  description: string;
};

export type StructuredIntelligenceArtifactContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_period: string;
  understanding: StructuredUnderstanding;
  confidence: {
    overall: number;
  };
};

export type CompanyKnowledgeHistoryContent = {
  versions: CompanyKnowledgeArtifactContent[];
};

export type FieldComparisonInput = {
  field_path: KnowledgeFieldPath;
  stability_class: StabilityClass;
  current_value: unknown;
  candidate_value: unknown;
  supporting_evidence: string[];
  current_confidence: number;
  candidate_confidence: number;
  current_supporting_periods: string[];
  candidate_supporting_periods: string[];
  historical_supporting_periods: string[];
};

export type ComparisonResult = CandidateChange & {
  stability_class: StabilityClass;
};
