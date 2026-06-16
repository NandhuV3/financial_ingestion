import type { PromotionDecision } from "./types.js";
import type {
  GovernanceDecisionContent,
  GovernanceIdGenerator,
  ReviewQueueEntry,
} from "./types.js";

export function buildReviewQueueEntries(params: {
  decisions: PromotionDecision[];
  governanceDecision: GovernanceDecisionContent;
  governanceDecisionArtifactId: string;
  idGenerator: GovernanceIdGenerator;
  createdAt: string;
}): ReviewQueueEntry[] {
  if (params.governanceDecision.candidate_artifact_id === null) {
    return [];
  }

  const candidateArtifactId = params.governanceDecision.candidate_artifact_id;

  return params.decisions
    .filter((decision) => decision.outcome === "flag_review")
    .map((decision) => ({
      review_id: params.idGenerator.nextId("ck-review"),
      company_id: params.governanceDecision.company_id,
      period_id: params.governanceDecision.period_id,
      trigger: triggerForDecision(decision),
      candidate_artifact_id: candidateArtifactId,
      governance_decision_artifact_id: params.governanceDecisionArtifactId,
      assigned_reviewer: null,
      status: "pending",
      created_at: params.createdAt,
      due_date: params.createdAt,
    }));
}

function triggerForDecision(decision: PromotionDecision): ReviewQueueEntry["trigger"] {
  if (decision.reason === "stable_field_change") {
    return "stable_field_change";
  }

  if (decision.reason === "contradiction_detected") {
    return "contradiction_detected";
  }

  if (decision.reason === "threshold_not_met") {
    return "first_population_low_confidence";
  }

  if (decision.reason === "significant_change_detected") {
    return "multi_field_change";
  }

  return "business_model_change";
}
