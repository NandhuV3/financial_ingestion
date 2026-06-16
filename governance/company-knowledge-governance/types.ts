import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { CompanyKnowledgeCandidateContent } from "../../builders/company-knowledge-builder/contract.js";
import type {
  CompanyKnowledgeArtifactContent,
} from "../../builders/company-knowledge-builder/types.js";
import type {
  AuditEventType,
  GovernanceOutcome,
  GovernanceResult,
  PromotionReason,
  ReviewStatus,
  ReviewTrigger,
} from "./contract.js";

export type CompanyKnowledgeGovernanceInput = {
  company_id: string;
  period_id: string;
  candidate_artifact: Artifact<CompanyKnowledgeCandidateContent>;
  current_company_knowledge: Artifact<CompanyKnowledgeArtifactContent> | null;
  promotion_rules_version: string;
  reviewer: string | null;
  manual_override: ManualOverride | null;
  generated_at?: string;
};

export type ManualOverride = {
  reviewer: string;
  decision: GovernanceOutcome;
  rationale: string;
  timestamp: string;
};

export type GovernanceAction = "candidate_evaluation" | "rollback";

export type PromotionDecision = {
  field_path: string;
  outcome: GovernanceOutcome;
  reason: PromotionReason;
  review_required: boolean;
  prior_value_hash: string;
  candidate_value_hash: string;
  confidence_delta: number;
  decision_confidence: number;
};

export type GovernanceSummary = {
  promoted_fields: number;
  merged_fields: number;
  retained_fields: number;
  review_fields: number;
  overall_decision: GovernanceResult;
};

export type GovernanceDecisionContent = {
  governance_action: GovernanceAction;
  company_id: string;
  period_id: string;
  candidate_artifact_id: string | null;
  current_company_knowledge_artifact_id: string | null;
  resulting_company_knowledge_artifact_id: string | null;
  rollback_target_artifact_id: string | null;
  promotion_rules_version: string;
  decisions: PromotionDecision[];
  governance_summary: GovernanceSummary;
};

export type ReviewQueueEntry = {
  review_id: string;
  company_id: string;
  period_id: string;
  trigger: ReviewTrigger;
  candidate_artifact_id: string;
  governance_decision_artifact_id: string;
  assigned_reviewer: string | null;
  status: ReviewStatus;
  created_at: string;
  due_date: string;
};

export type CompanyKnowledgeAuditEntry = {
  entry_id: string;
  company_id: string;
  timestamp: string;
  event_type: AuditEventType;
  before_version: number;
  after_version: number;
  candidate_artifact_id: string | null;
  governance_decision_artifact_id: string;
  before_company_knowledge_artifact_id: string | null;
  after_company_knowledge_artifact_id: string | null;
  field_decisions: PromotionDecision[];
  reviewer: string | null;
  notes: string | null;
  promotion_rules_version: string;
};

export type InvalidationHandoff = {
  event_id: string;
  company_id: string;
  period_id: string;
  source_artifact_id: string;
  previous_artifact_id: string | null;
  governance_decision_artifact_id: string;
  reason: "artifact_updated";
  created_at: string;
};

export type CompanyKnowledgeGovernanceResult = {
  governance_decision: Artifact<GovernanceDecisionContent>;
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent> | null;
  review_queue_entries: ReviewQueueEntry[];
  audit_entry: CompanyKnowledgeAuditEntry;
  invalidation_event: InvalidationHandoff | null;
};

export type CompanyKnowledgeRollbackInput = {
  company_id: string;
  period_id: string;
  target_version: number;
  reviewer: string;
  reason: string;
  generated_at?: string;
};

export type CompanyKnowledgeRollbackResult = {
  governance_decision: Artifact<GovernanceDecisionContent>;
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent>;
  audit_entry: CompanyKnowledgeAuditEntry;
  invalidation_event: InvalidationHandoff;
};

export type GovernanceClock = {
  now(): string;
};

export type GovernanceIdGenerator = {
  nextId(prefix: string): string;
};
