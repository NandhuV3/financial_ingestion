import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import type { CandidateChange } from "../../builders/company-knowledge-builder/contract.js";
import type { GovernanceResult } from "./contract.js";
import type { PromotionDecision } from "./types.js";
import {
  AUTOMATIC_PROMOTION_CONFIDENCE,
  FIRST_POPULATION_PROMOTION_CONFIDENCE,
  isSemiStableField,
  MINIMUM_PROMOTION_CONFIDENCE,
  reasonForReview,
} from "./promotion-rules.js";

export function evaluatePromotionDecisions(
  changes: CandidateChange[],
): PromotionDecision[] {
  const changedCount = changes.filter((change) => change.change_type !== "no_change").length;
  const forceReviewAll = changedCount >= 3
    && changes.some((change) => change.change_type !== "new_information");

  return changes.map((change) => evaluateChange(change, forceReviewAll));
}

export function summarizeGovernance(decisions: PromotionDecision[]): {
  promoted_fields: number;
  merged_fields: number;
  retained_fields: number;
  review_fields: number;
  overall_decision: GovernanceResult;
} {
  const reviewFields = decisions.filter((decision) => decision.outcome === "flag_review").length;

  return {
    promoted_fields: decisions.filter((decision) => decision.outcome === "promote").length,
    merged_fields: decisions.filter((decision) => decision.outcome === "merge").length,
    retained_fields: decisions.filter((decision) => decision.outcome === "retain").length,
    review_fields: reviewFields,
    overall_decision: reviewFields === 0
      ? "auto_approved"
      : reviewFields === decisions.length
        ? "full_review_required"
        : "partial_review_required",
  };
}

function evaluateChange(change: CandidateChange, forceReview: boolean): PromotionDecision {
  const candidateConfidence = normalizeConfidence(change);
  const reviewReason = forceReview ? "significant_change_detected" : reasonForReview(change);

  if (reviewReason !== null) {
    return decision(change, "flag_review", reviewReason, true, candidateConfidence);
  }

  if (change.confidence_delta < 0) {
    return decision(change, "retain", "threshold_not_met", false, candidateConfidence);
  }

  if (change.change_type === "no_change") {
    return decision(change, "retain", "threshold_not_met", false, candidateConfidence);
  }

  if (change.change_type === "new_information") {
    return candidateConfidence >= FIRST_POPULATION_PROMOTION_CONFIDENCE
      ? decision(change, "promote", "first_population", false, candidateConfidence)
      : decision(change, "flag_review", "threshold_not_met", true, candidateConfidence);
  }

  if (candidateConfidence < MINIMUM_PROMOTION_CONFIDENCE) {
    return decision(change, "retain", "threshold_not_met", false, candidateConfidence);
  }

  if (change.change_type === "evidence_accumulation") {
    return decision(change, "promote", "evidence_accumulation", false, candidateConfidence);
  }

  if (isAdditiveChange(change)) {
    return decision(change, "merge", "confidence_improvement", false, candidateConfidence);
  }

  if (isSemiStableField(change.field_path)
    && change.confidence_delta > 0
    && change.semantic_similarity > 0.75) {
    return decision(change, "promote", "confidence_improvement", false, candidateConfidence);
  }

  if (candidateConfidence >= AUTOMATIC_PROMOTION_CONFIDENCE) {
    return decision(change, "promote", "confidence_improvement", false, candidateConfidence);
  }

  if (change.change_type === "minor_update" || change.change_type === "moderate_update") {
    return decision(change, "merge", "confidence_improvement", false, candidateConfidence);
  }

  return decision(change, "retain", "threshold_not_met", false, candidateConfidence);
}

function isAdditiveChange(change: CandidateChange): boolean {
  return Array.isArray(change.current_value)
    && Array.isArray(change.candidate_value)
    && change.candidate_value.length > change.current_value.length
    && change.semantic_similarity > 0.75;
}

function decision(
  change: CandidateChange,
  outcome: PromotionDecision["outcome"],
  reason: PromotionDecision["reason"],
  reviewRequired: boolean,
  decisionConfidence: number,
): PromotionDecision {
  return {
    field_path: change.field_path,
    outcome,
    reason,
    review_required: reviewRequired,
    prior_value_hash: hashValue(change.current_value),
    candidate_value_hash: hashValue(change.candidate_value),
    confidence_delta: change.confidence_delta,
    decision_confidence: decisionConfidence,
  };
}

function normalizeConfidence(change: CandidateChange): number {
  const confidence = change.confidence_delta + currentConfidenceFloor(change);

  return Math.max(0, Math.min(1, Number(confidence.toFixed(4))));
}

function currentConfidenceFloor(change: CandidateChange): number {
  return change.change_type === "new_information" ? 0 : 0.75;
}

function hashValue(value: unknown): string {
  return calculateArtifactHash(value);
}
