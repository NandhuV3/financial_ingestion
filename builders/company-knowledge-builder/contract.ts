export const COMPANY_KNOWLEDGE_BUILDER_TYPE = "company-knowledge-builder";
export const COMPANY_KNOWLEDGE_BUILDER_VERSION = "company-knowledge-builder-v1";
export const COMPANY_KNOWLEDGE_CANDIDATE_SCHEMA_VERSION = "company-knowledge-candidate-v1";
export const COMPANY_KNOWLEDGE_CANDIDATE_PIPELINE_VERSION = "company-knowledge-candidate-pipeline-v1";

export const STABILITY_CLASSES = [
  "stable",
  "semi_stable",
  "dynamic",
] as const;

export type StabilityClass = typeof STABILITY_CLASSES[number];

export const CHANGE_TYPES = [
  "new_information",
  "minor_update",
  "major_update",
  "contradiction",
  "evidence_accumulation",
  "no_change",
] as const;

export type ChangeType = typeof CHANGE_TYPES[number];

export const BUILDER_RECOMMENDATIONS = [
  "candidate_promote",
  "candidate_merge",
  "candidate_review",
  "candidate_retain",
] as const;

export type BuilderRecommendation = typeof BUILDER_RECOMMENDATIONS[number];

export type EvidenceReference = string;

export type CandidateChange = {
  field_path: string;
  current_value: unknown;
  candidate_value: unknown;
  change_type: ChangeType;
  semantic_similarity: number;
  confidence_delta: number;
  evidence_delta: number;
  builder_recommendation: BuilderRecommendation;
  review_required: boolean;
  supporting_evidence: EvidenceReference[];
};

export type CandidateSummary = {
  total_fields_evaluated: number;
  unchanged_fields: number;
  changed_fields: number;
  major_changes: number;
  contradictions: number;
  review_candidates: number;
};

export type CompanyKnowledgeCandidateEvaluationHooks = {
  comparison_engine_version: string;
  promotion_rules_version: string;
  total_fields_evaluated: number;
  changed_fields: number;
  unchanged_fields: number;
  contradiction_count: number;
  evidence_accumulation_count: number;
  review_candidate_count: number;
  recommendation_distribution: Record<BuilderRecommendation, number>;
  stability_class_distribution: Record<StabilityClass, number>;
};

export type CompanyKnowledgeCandidateContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  candidate_changes: CandidateChange[];
  candidate_summary: CandidateSummary;
  evaluation_hooks: CompanyKnowledgeCandidateEvaluationHooks;
};
