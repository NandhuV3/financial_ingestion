import type { AuditEventType } from "./contract.js";
import type {
  CompanyKnowledgeAuditEntry,
  GovernanceDecisionContent,
  GovernanceIdGenerator,
} from "./types.js";

export function buildCompanyKnowledgeAuditEntry(params: {
  idGenerator: GovernanceIdGenerator;
  timestamp: string;
  governanceDecision: GovernanceDecisionContent;
  governanceDecisionArtifactId: string;
  beforeVersion: number;
  afterVersion: number;
  beforeArtifactId: string | null;
  afterArtifactId: string | null;
  reviewer: string | null;
  notes: string | null;
  eventType?: AuditEventType;
}): CompanyKnowledgeAuditEntry {
  return {
    entry_id: params.idGenerator.nextId("ck-audit"),
    company_id: params.governanceDecision.company_id,
    timestamp: params.timestamp,
    event_type: params.eventType ?? auditEventTypeForDecision(params.governanceDecision, params.notes),
    before_version: params.beforeVersion,
    after_version: params.afterVersion,
    candidate_artifact_id: params.governanceDecision.candidate_artifact_id,
    governance_decision_artifact_id: params.governanceDecisionArtifactId,
    before_company_knowledge_artifact_id: params.beforeArtifactId,
    after_company_knowledge_artifact_id: params.afterArtifactId,
    field_decisions: params.governanceDecision.decisions,
    reviewer: params.reviewer,
    notes: params.notes,
    promotion_rules_version: params.governanceDecision.promotion_rules_version,
  };
}

function auditEventTypeForDecision(
  governanceDecision: GovernanceDecisionContent,
  notes: string | null,
): AuditEventType {
  if (governanceDecision.governance_action === "rollback") {
    return "rollback";
  }

  if (notes !== null) {
    return "manual_override";
  }

  if (governanceDecision.decisions.some((decision) => decision.outcome === "flag_review")) {
    return "review";
  }

  if (governanceDecision.decisions.some((decision) => decision.outcome === "merge")) {
    return "merge";
  }

  if (governanceDecision.decisions.some((decision) => decision.outcome === "promote")) {
    return "promotion";
  }

  return "retain";
}
