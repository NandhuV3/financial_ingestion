import { AUDIT_EVENT_TYPES, GOVERNANCE_OUTCOMES, PROMOTION_REASONS, REVIEW_STATUSES } from "./contract.js";
import type {
  CompanyKnowledgeAuditEntry,
  CompanyKnowledgeGovernanceInput,
  GovernanceDecisionContent,
  ReviewQueueEntry,
} from "./types.js";

export class GovernanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GovernanceValidationError";
  }
}

export function validateGovernanceInput(input: CompanyKnowledgeGovernanceInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.promotion_rules_version, "promotion_rules_version");

  if (input.candidate_artifact.identity.artifact_type !== "company_knowledge_candidate") {
    throw new GovernanceValidationError("candidate_artifact must be company_knowledge_candidate.");
  }
}

export function validateGovernanceDecision(content: GovernanceDecisionContent): void {
  requireText(content.company_id, "governance_decision.company_id");
  requireText(content.period_id, "governance_decision.period_id");
  requireText(content.promotion_rules_version, "governance_decision.promotion_rules_version");

  if (!["candidate_evaluation", "rollback"].includes(content.governance_action)) {
    throw new GovernanceValidationError("governance_decision.governance_action is invalid.");
  }

  if (content.governance_action === "candidate_evaluation") {
    requireText(content.candidate_artifact_id, "governance_decision.candidate_artifact_id");
  }

  if (content.governance_action === "rollback") {
    requireText(content.rollback_target_artifact_id, "governance_decision.rollback_target_artifact_id");
    requireText(
      content.resulting_company_knowledge_artifact_id,
      "governance_decision.resulting_company_knowledge_artifact_id",
    );
  }

  if (!Array.isArray(content.decisions)) {
    throw new GovernanceValidationError("governance_decision.decisions must be an array.");
  }

  for (const [index, decision] of content.decisions.entries()) {
    requireText(decision.field_path, `governance_decision.decisions[${index}].field_path`);

    if (!GOVERNANCE_OUTCOMES.includes(decision.outcome)) {
      throw new GovernanceValidationError(`governance_decision.decisions[${index}].outcome is invalid.`);
    }

    if (!PROMOTION_REASONS.includes(decision.reason)) {
      throw new GovernanceValidationError(`governance_decision.decisions[${index}].reason is invalid.`);
    }

    if (typeof decision.review_required !== "boolean") {
      throw new GovernanceValidationError(`governance_decision.decisions[${index}].review_required must be boolean.`);
    }

    requireText(decision.prior_value_hash, `governance_decision.decisions[${index}].prior_value_hash`);
    requireText(decision.candidate_value_hash, `governance_decision.decisions[${index}].candidate_value_hash`);
    requireNumber(decision.confidence_delta, `governance_decision.decisions[${index}].confidence_delta`);
    requireConfidence(decision.decision_confidence, `governance_decision.decisions[${index}].decision_confidence`);
  }

  if (content.governance_summary.promoted_fields !== countOutcome(content, "promote")
    || content.governance_summary.merged_fields !== countOutcome(content, "merge")
    || content.governance_summary.retained_fields !== countOutcome(content, "retain")
    || content.governance_summary.review_fields !== countOutcome(content, "flag_review")) {
    throw new GovernanceValidationError("governance_summary counts must match decisions.");
  }
}

export function validateReviewQueueEntry(entry: ReviewQueueEntry): void {
  requireText(entry.review_id, "review.review_id");
  requireText(entry.company_id, "review.company_id");
  requireText(entry.period_id, "review.period_id");
  requireText(entry.candidate_artifact_id, "review.candidate_artifact_id");
  requireText(entry.governance_decision_artifact_id, "review.governance_decision_artifact_id");
  requireText(entry.created_at, "review.created_at");
  requireText(entry.due_date, "review.due_date");

  if (!REVIEW_STATUSES.includes(entry.status)) {
    throw new GovernanceValidationError("review.status is invalid.");
  }
}

export function validateAuditEntry(entry: CompanyKnowledgeAuditEntry): void {
  requireText(entry.entry_id, "audit.entry_id");
  requireText(entry.company_id, "audit.company_id");
  requireText(entry.timestamp, "audit.timestamp");
  requireText(entry.governance_decision_artifact_id, "audit.governance_decision_artifact_id");
  requireText(entry.promotion_rules_version, "audit.promotion_rules_version");

  if (!AUDIT_EVENT_TYPES.includes(entry.event_type)) {
    throw new GovernanceValidationError("audit.event_type is invalid.");
  }

  if (!Array.isArray(entry.field_decisions)) {
    throw new GovernanceValidationError("audit.field_decisions must be an array.");
  }
}

function countOutcome(content: GovernanceDecisionContent, outcome: string): number {
  return content.decisions.filter((decision) => decision.outcome === outcome).length;
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new GovernanceValidationError(`${field} must be a non-empty string.`);
  }
}

function requireNumber(value: unknown, field: string): void {
  if (!Number.isFinite(value)) {
    throw new GovernanceValidationError(`${field} must be finite.`);
  }
}

function requireConfidence(value: unknown, field: string): void {
  if (!Number.isFinite(value) || typeof value !== "number" || value < 0 || value > 1) {
    throw new GovernanceValidationError(`${field} must be between 0 and 1.`);
  }
}
