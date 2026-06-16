import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { CompanyKnowledgeCandidateContent } from "../../../builders/company-knowledge-builder/contract.js";
import type {
  CompanyKnowledgeArtifactContent,
} from "../../../builders/company-knowledge-builder/types.js";
import { InMemoryCompanyKnowledgeAuditRepository } from "../audit.repository.js";
import { CompanyKnowledgeGovernanceEngine } from "../governance-engine.js";
import { GovernanceDecisionRepository } from "../governance-decision.repository.js";
import { RecordingInvalidationPort } from "../invalidation-port.js";
import { InMemoryReviewQueueRepository } from "../review-queue.repository.js";
import type { GovernanceClock, GovernanceIdGenerator } from "../types.js";
import { artifact, TestArtifactRepository } from "./artifact-fixtures.js";
import { knowledge } from "./knowledge-fixtures.js";

export { knowledge } from "./knowledge-fixtures.js";

export function governanceHarness(): {
  repository: TestArtifactRepository;
  reviewQueue: InMemoryReviewQueueRepository;
  audit: InMemoryCompanyKnowledgeAuditRepository;
  invalidation: RecordingInvalidationPort;
  clock: GovernanceClock;
  engine: CompanyKnowledgeGovernanceEngine;
} {
  const repository = new TestArtifactRepository();
  const artifactService = new ArtifactService(repository);
  const reviewQueue = new InMemoryReviewQueueRepository();
  const audit = new InMemoryCompanyKnowledgeAuditRepository();
  const invalidation = new RecordingInvalidationPort();
  const clock = { now: () => "2026-06-15T00:00:00.000Z" };
  const idGenerator = deterministicIdGenerator();

  return {
    repository,
    reviewQueue,
    audit,
    invalidation,
    clock,
    engine: new CompanyKnowledgeGovernanceEngine(
      artifactService,
      new GovernanceDecisionRepository(artifactService),
      reviewQueue,
      audit,
      invalidation,
      clock,
      idGenerator,
    ),
  };
}

export function firstPopulationCandidate(): CompanyKnowledgeCandidateContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2",
    candidate_changes: [
      change("business_model", null, knowledge().business_model, "new_information", 0.82),
      change("products", null, knowledge().products, "new_information", 0.82),
      change("customers", null, knowledge().customers, "new_information", 0.82),
      change("revenue_structure", null, knowledge().revenue_structure, "new_information", 0.82),
      change("revenue_drivers", null, knowledge().revenue_drivers, "new_information", 0.82),
      change("competitive_positioning", null, knowledge().competitive_positioning, "new_information", 0.82),
      change("strategic_priorities", null, knowledge().strategic_priorities, "new_information", 0.82),
      change("management_focus", null, knowledge().management_focus, "new_information", 0.82),
      change("dependencies", null, knowledge().dependencies, "new_information", 0.82),
    ],
    candidate_summary: {
      total_fields_evaluated: 9,
      unchanged_fields: 0,
      changed_fields: 9,
      major_changes: 0,
      contradictions: 0,
      review_candidates: 0,
    },
    evaluation_hooks: {
      comparison_engine_version: "test",
      promotion_rules_version: "test",
      total_fields_evaluated: 9,
      changed_fields: 9,
      unchanged_fields: 0,
      contradiction_count: 0,
      evidence_accumulation_count: 0,
      review_candidate_count: 0,
      recommendation_distribution: {
        candidate_promote: 9,
        candidate_merge: 0,
        candidate_review: 0,
        candidate_retain: 0,
      },
      stability_class_distribution: {
        stable: 3,
        semi_stable: 3,
        dynamic: 3,
      },
    },
  };
}

export function candidateWithStableFieldChange(): CompanyKnowledgeCandidateContent {
  return singleChangeCandidate(change(
    "business_model",
    knowledge().business_model,
    {
      ...knowledge().business_model,
      value_creation: "Consumer retail distribution.",
    },
    "minor_update",
    0.1,
  ));
}

export function candidateWithConfidenceRegression(): CompanyKnowledgeCandidateContent {
  return singleChangeCandidate(change(
    "management_focus",
    knowledge().management_focus,
    knowledge().management_focus,
    "minor_update",
    -0.2,
  ));
}

export function candidateWithCustomerMerge(): CompanyKnowledgeCandidateContent {
  return singleChangeCandidate({
    ...change(
      "customers",
      knowledge().customers,
      [
        ...knowledge().customers,
        {
          customer_segment: "Developers",
          description: "Builders using Microsoft tools.",
          confidence: 0.86,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      "minor_update",
      0.1,
    ),
    semantic_similarity: 0.8,
  });
}

export function candidateArtifact(content: CompanyKnowledgeCandidateContent): Artifact<CompanyKnowledgeCandidateContent> {
  return artifact("candidate-1", "company_knowledge_candidate", content);
}

export function companyKnowledgeArtifact(
  knowledgeContent: CompanyKnowledge,
  options: {
    artifactId?: string;
    version?: number;
    companyKnowledgeVersion?: number;
  } = {},
): Artifact<CompanyKnowledgeArtifactContent> {
  const artifactValue = artifact(options.artifactId ?? "company-knowledge-1", "company_knowledge", {
    company_id: "MSFT",
    period_id: "2026-Q2",
    company_knowledge_version: options.companyKnowledgeVersion ?? options.version ?? 1,
    knowledge: knowledgeContent,
    confidence: {
      overall: 0.82,
      evidence_depth: 0.82,
      history_length: 1,
      consistency_score: 0.82,
      governance_confidence: 0.82,
    },
  });
  artifactValue.identity.version = options.version ?? 1;
  artifactValue.metadata.version = options.version ?? 1;

  return artifactValue;
}

function deterministicIdGenerator(): GovernanceIdGenerator {
  let count = 0;

  return {
    nextId(prefix: string): string {
      count += 1;
      return `${prefix}-${count}`;
    },
  };
}

function singleChangeCandidate(candidateChange: CompanyKnowledgeCandidateContent["candidate_changes"][number]): CompanyKnowledgeCandidateContent {
  return {
    ...firstPopulationCandidate(),
    candidate_changes: [candidateChange],
    candidate_summary: {
      total_fields_evaluated: 1,
      unchanged_fields: 0,
      changed_fields: 1,
      major_changes: candidateChange.change_type === "major_update" ? 1 : 0,
      contradictions: candidateChange.change_type === "contradiction" ? 1 : 0,
      review_candidates: candidateChange.review_required ? 1 : 0,
    },
  };
}

function change(
  fieldPath: string,
  currentValue: unknown,
  candidateValue: unknown,
  changeType: CompanyKnowledgeCandidateContent["candidate_changes"][number]["change_type"],
  confidenceDelta: number,
): CompanyKnowledgeCandidateContent["candidate_changes"][number] {
  return {
    field_path: fieldPath,
    current_value: currentValue,
    candidate_value: candidateValue,
    change_type: changeType,
    semantic_similarity: changeType === "new_information" ? 0 : 0.8,
    confidence_delta: confidenceDelta,
    evidence_delta: 1,
    builder_recommendation: "candidate_promote",
    review_required: fieldPath === "business_model",
    supporting_evidence: ["evidence-1"],
  };
}
