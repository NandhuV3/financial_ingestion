export const COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE = "company-knowledge-governance-engine";
export const GOVERNANCE_DECISION_SCHEMA_VERSION = "company-knowledge-governance-decision-v1";
export const GOVERNANCE_DECISION_PIPELINE_VERSION = "company-knowledge-governance-v1";
export const COMPANY_KNOWLEDGE_SCHEMA_VERSION = "company-knowledge-v1";
export const COMPANY_KNOWLEDGE_PIPELINE_VERSION = "company-knowledge-governance-v1";

export const GOVERNANCE_OUTCOMES = [
  "promote",
  "merge",
  "retain",
  "flag_review",
] as const;

export type GovernanceOutcome = typeof GOVERNANCE_OUTCOMES[number];

export const PROMOTION_REASONS = [
  "first_population",
  "confidence_improvement",
  "evidence_accumulation",
  "threshold_not_met",
  "significant_change_detected",
  "change_exceeds_stability_limit",
  "manual_override",
  "contradiction_detected",
  "stable_field_change",
] as const;

export type PromotionReason = typeof PROMOTION_REASONS[number];

export const GOVERNANCE_RESULTS = [
  "auto_approved",
  "partial_review_required",
  "full_review_required",
] as const;

export type GovernanceResult = typeof GOVERNANCE_RESULTS[number];

export const REVIEW_TRIGGERS = [
  "stable_field_change",
  "business_model_change",
  "multi_field_change",
  "contradiction_detected",
  "confidence_regression",
  "first_population_low_confidence",
  "restatement_context",
  "management_change_context",
  "contradicts_prior_three",
] as const;

export type ReviewTrigger = typeof REVIEW_TRIGGERS[number];

export const REVIEW_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
] as const;

export type ReviewStatus = typeof REVIEW_STATUSES[number];

export const AUDIT_EVENT_TYPES = [
  "promotion",
  "merge",
  "retain",
  "review",
  "review_approved",
  "review_rejected",
  "manual_override",
  "rollback",
] as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[number];
