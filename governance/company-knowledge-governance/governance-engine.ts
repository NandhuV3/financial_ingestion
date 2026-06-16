import { randomUUID } from "node:crypto";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { ArtifactLineage } from "../../contracts/artifacts/artifact-lineage.js";
import type { CompanyKnowledgeCandidateContent } from "../../builders/company-knowledge-builder/contract.js";
import type { CompanyKnowledgeArtifactContent } from "../../builders/company-knowledge-builder/types.js";
import { calculateArtifactHash, ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE,
  COMPANY_KNOWLEDGE_PIPELINE_VERSION,
  COMPANY_KNOWLEDGE_SCHEMA_VERSION,
} from "./contract.js";
import { buildCompanyKnowledgeAuditEntry } from "./audit.js";
import { evaluatePromotionDecisions, summarizeGovernance } from "./decision-engine.js";
import { GovernanceDecisionRepository } from "./governance-decision.repository.js";
import type { InvalidationPort } from "./invalidation-port.js";
import { buildApprovedCompanyKnowledge } from "./merge-engine.js";
import type { CompanyKnowledgeAuditRepository } from "./audit.repository.js";
import type { ReviewQueueRepository } from "./review-queue.repository.js";
import { buildReviewQueueEntries } from "./review-queue.js";
import type {
  CompanyKnowledgeGovernanceInput,
  CompanyKnowledgeGovernanceResult,
  CompanyKnowledgeRollbackInput,
  CompanyKnowledgeRollbackResult,
  GovernanceClock,
  GovernanceDecisionContent,
  GovernanceIdGenerator,
  InvalidationHandoff,
} from "./types.js";
import {
  validateAuditEntry,
  validateGovernanceDecision,
  validateGovernanceInput,
  validateReviewQueueEntry,
} from "./validator.js";

export class CompanyKnowledgeGovernanceEngine {
  constructor(
    private readonly artifactService: ArtifactService,
    private readonly governanceDecisionRepository: GovernanceDecisionRepository,
    private readonly reviewQueueRepository: ReviewQueueRepository,
    private readonly auditRepository: CompanyKnowledgeAuditRepository,
    private readonly invalidationPort: InvalidationPort,
    private readonly clock: GovernanceClock = systemClock,
    private readonly idGenerator: GovernanceIdGenerator = randomIdGenerator,
  ) {}

  async execute(input: CompanyKnowledgeGovernanceInput): Promise<CompanyKnowledgeGovernanceResult> {
    validateGovernanceInput(input);

    const generatedAt = input.generated_at ?? this.clock.now();
    const decisions = evaluatePromotionDecisions(input.candidate_artifact.content.candidate_changes);
    const approvedKnowledge = buildApprovedCompanyKnowledge(
      input.current_company_knowledge?.content ?? null,
      input.candidate_artifact.content.candidate_changes,
      decisions,
      input.company_id,
      input.period_id,
    );
    const resultingCompanyKnowledgeArtifactId = approvedKnowledge === null
      ? null
      : this.artifactService.reserveArtifactId();
    const governanceDecisionContent = buildGovernanceDecisionContent(
      input,
      decisions,
      resultingCompanyKnowledgeArtifactId,
    );
    validateGovernanceDecision(governanceDecisionContent);

    const governanceDecision = await this.governanceDecisionRepository.save(
      governanceDecisionContent,
      buildGovernanceDecisionLineage(input),
      calculateArtifactHash({
        candidate: input.candidate_artifact.identity.artifact_id,
        current: input.current_company_knowledge?.identity.artifact_id ?? null,
        promotion_rules_version: input.promotion_rules_version,
      }),
      generatedAt,
    );

    const companyKnowledge = approvedKnowledge === null
      ? null
      : await this.persistCompanyKnowledge(
        approvedKnowledge,
        input,
        governanceDecision,
        generatedAt,
        resultingCompanyKnowledgeArtifactId ?? undefined,
      );

    const reviewQueueEntries = buildReviewQueueEntries({
      decisions,
      governanceDecision: governanceDecision.content,
      governanceDecisionArtifactId: governanceDecision.identity.artifact_id,
      idGenerator: this.idGenerator,
      createdAt: generatedAt,
    });

    for (const entry of reviewQueueEntries) {
      validateReviewQueueEntry(entry);
      await this.reviewQueueRepository.create(entry);
    }

    const auditEntry = buildCompanyKnowledgeAuditEntry({
      idGenerator: this.idGenerator,
      timestamp: generatedAt,
      governanceDecision: governanceDecision.content,
      governanceDecisionArtifactId: governanceDecision.identity.artifact_id,
      beforeVersion: input.current_company_knowledge?.content.company_knowledge_version ?? 0,
      afterVersion: companyKnowledge?.content.company_knowledge_version ?? input.current_company_knowledge?.content.company_knowledge_version ?? 0,
      beforeArtifactId: input.current_company_knowledge?.identity.artifact_id ?? null,
      afterArtifactId: companyKnowledge?.identity.artifact_id ?? null,
      reviewer: input.reviewer,
      notes: input.manual_override?.rationale ?? null,
    });
    validateAuditEntry(auditEntry);
    await this.auditRepository.append(auditEntry);

    const invalidationEvent = companyKnowledge === null
      ? null
      : buildInvalidationHandoff(
        companyKnowledge,
        input.current_company_knowledge,
        governanceDecision,
        this.idGenerator,
        generatedAt,
      );

    if (invalidationEvent !== null) {
      await this.invalidationPort.onCompanyKnowledgeChanged(invalidationEvent);
    }

    return {
      governance_decision: governanceDecision,
      company_knowledge: companyKnowledge,
      review_queue_entries: reviewQueueEntries,
      audit_entry: auditEntry,
      invalidation_event: invalidationEvent,
    };
  }

  async rollback(input: CompanyKnowledgeRollbackInput): Promise<CompanyKnowledgeRollbackResult> {
    validateRollbackInput(input);

    const generatedAt = input.generated_at ?? this.clock.now();
    const lookup = {
      artifact_type: "company_knowledge" as const,
      company_id: input.company_id,
      period_id: input.period_id,
    };
    const current = await this.artifactService.getCurrentArtifact<CompanyKnowledgeArtifactContent>(lookup);

    if (current === null) {
      throw new Error("Cannot rollback Company Knowledge without a current artifact.");
    }

    const history = await this.artifactService.getArtifactHistory<CompanyKnowledgeArtifactContent>(lookup);
    const rollbackTarget = history.find((artifact) => artifact.identity.version === input.target_version);

    if (rollbackTarget === undefined) {
      throw new Error(`Company Knowledge rollback target version ${input.target_version} was not found.`);
    }

    const resultingCompanyKnowledgeArtifactId = this.artifactService.reserveArtifactId();
    const governanceDecisionContent = buildRollbackGovernanceDecisionContent(
      input,
      current,
      rollbackTarget,
      resultingCompanyKnowledgeArtifactId,
    );
    validateGovernanceDecision(governanceDecisionContent);

    const governanceDecision = await this.governanceDecisionRepository.save(
      governanceDecisionContent,
      buildRollbackGovernanceDecisionLineage(current, rollbackTarget),
      calculateArtifactHash({
        current: current.identity.artifact_id,
        rollback_target: rollbackTarget.identity.artifact_id,
        reason: input.reason,
        reviewer: input.reviewer,
      }),
      generatedAt,
    );
    const companyKnowledge = await this.persistRollbackCompanyKnowledge(
      rollbackTarget.content,
      current,
      rollbackTarget,
      governanceDecision,
      input,
      generatedAt,
      resultingCompanyKnowledgeArtifactId,
    );
    const auditEntry = buildCompanyKnowledgeAuditEntry({
      idGenerator: this.idGenerator,
      timestamp: generatedAt,
      governanceDecision: governanceDecision.content,
      governanceDecisionArtifactId: governanceDecision.identity.artifact_id,
      beforeVersion: current.content.company_knowledge_version,
      afterVersion: companyKnowledge.content.company_knowledge_version,
      beforeArtifactId: current.identity.artifact_id,
      afterArtifactId: companyKnowledge.identity.artifact_id,
      reviewer: input.reviewer,
      notes: input.reason,
      eventType: "rollback",
    });
    validateAuditEntry(auditEntry);
    await this.auditRepository.append(auditEntry);

    const invalidationEvent = buildInvalidationHandoff(
      companyKnowledge,
      current,
      governanceDecision,
      this.idGenerator,
      generatedAt,
    );
    await this.invalidationPort.onCompanyKnowledgeChanged(invalidationEvent);

    return {
      governance_decision: governanceDecision,
      company_knowledge: companyKnowledge,
      audit_entry: auditEntry,
      invalidation_event: invalidationEvent,
    };
  }

  private async persistCompanyKnowledge(
    content: CompanyKnowledgeArtifactContent,
    input: CompanyKnowledgeGovernanceInput,
    governanceDecision: Artifact<GovernanceDecisionContent>,
    generatedAt: string,
    artifactId?: string,
  ): Promise<Artifact<CompanyKnowledgeArtifactContent>> {
    return this.artifactService.createArtifact({
      artifact_id: artifactId,
      artifact_type: "company_knowledge",
      company_id: input.company_id,
      period_id: input.period_id,
      content,
      lineage: buildCompanyKnowledgeLineage(input, governanceDecision),
      schema_version: COMPANY_KNOWLEDGE_SCHEMA_VERSION,
      pipeline_version: COMPANY_KNOWLEDGE_PIPELINE_VERSION,
      input_hash: calculateArtifactHash({
        governance_decision: governanceDecision.identity.artifact_id,
        candidate: input.candidate_artifact.identity.artifact_id,
        current: input.current_company_knowledge?.identity.artifact_id ?? null,
      }),
      generation_duration_ms: 0,
      generated_at: generatedAt,
    });
  }

  private async persistRollbackCompanyKnowledge(
    targetContent: CompanyKnowledgeArtifactContent,
    current: Artifact<CompanyKnowledgeArtifactContent>,
    rollbackTarget: Artifact<CompanyKnowledgeArtifactContent>,
    governanceDecision: Artifact<GovernanceDecisionContent>,
    input: CompanyKnowledgeRollbackInput,
    generatedAt: string,
    artifactId: string,
  ): Promise<Artifact<CompanyKnowledgeArtifactContent>> {
    const content: CompanyKnowledgeArtifactContent = {
      ...targetContent,
      company_id: input.company_id,
      period_id: input.period_id,
      company_knowledge_version: current.content.company_knowledge_version + 1,
    };

    return this.artifactService.createArtifact({
      artifact_id: artifactId,
      artifact_type: "company_knowledge",
      company_id: input.company_id,
      period_id: input.period_id,
      content,
      lineage: buildRollbackCompanyKnowledgeLineage(current, rollbackTarget, governanceDecision),
      schema_version: COMPANY_KNOWLEDGE_SCHEMA_VERSION,
      pipeline_version: COMPANY_KNOWLEDGE_PIPELINE_VERSION,
      input_hash: calculateArtifactHash({
        governance_decision: governanceDecision.identity.artifact_id,
        current: current.identity.artifact_id,
        rollback_target: rollbackTarget.identity.artifact_id,
      }),
      generation_duration_ms: 0,
      generated_at: generatedAt,
    });
  }
}

function buildGovernanceDecisionContent(
  input: CompanyKnowledgeGovernanceInput,
  decisions: GovernanceDecisionContent["decisions"],
  resultingCompanyKnowledgeArtifactId: string | null,
): GovernanceDecisionContent {
  return {
    governance_action: "candidate_evaluation",
    company_id: input.company_id,
    period_id: input.period_id,
    candidate_artifact_id: input.candidate_artifact.identity.artifact_id,
    current_company_knowledge_artifact_id: input.current_company_knowledge?.identity.artifact_id ?? null,
    resulting_company_knowledge_artifact_id: resultingCompanyKnowledgeArtifactId,
    rollback_target_artifact_id: null,
    promotion_rules_version: input.promotion_rules_version,
    decisions,
    governance_summary: summarizeGovernance(decisions),
  };
}

function buildRollbackGovernanceDecisionContent(
  input: CompanyKnowledgeRollbackInput,
  current: Artifact<CompanyKnowledgeArtifactContent>,
  rollbackTarget: Artifact<CompanyKnowledgeArtifactContent>,
  resultingCompanyKnowledgeArtifactId: string,
): GovernanceDecisionContent {
  return {
    governance_action: "rollback",
    company_id: input.company_id,
    period_id: input.period_id,
    candidate_artifact_id: null,
    current_company_knowledge_artifact_id: current.identity.artifact_id,
    resulting_company_knowledge_artifact_id: resultingCompanyKnowledgeArtifactId,
    rollback_target_artifact_id: rollbackTarget.identity.artifact_id,
    promotion_rules_version: COMPANY_KNOWLEDGE_PIPELINE_VERSION,
    decisions: [],
    governance_summary: {
      promoted_fields: 0,
      merged_fields: 0,
      retained_fields: 0,
      review_fields: 0,
      overall_decision: "auto_approved",
    },
  };
}

function buildGovernanceDecisionLineage(input: CompanyKnowledgeGovernanceInput): ArtifactLineage {
  return {
    upstream_dependencies: [
      dependencyRef(input.candidate_artifact),
      ...(input.current_company_knowledge ? [dependencyRef(input.current_company_knowledge)] : []),
    ],
    generation_context: {
      builder_type: COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE,
    },
  };
}

function buildCompanyKnowledgeLineage(
  input: CompanyKnowledgeGovernanceInput,
  governanceDecision: Artifact<GovernanceDecisionContent>,
): ArtifactLineage {
  return {
    upstream_dependencies: [
      dependencyRef(input.candidate_artifact),
      dependencyRef(governanceDecision),
      ...(input.current_company_knowledge ? [dependencyRef(input.current_company_knowledge)] : []),
    ],
    generation_context: {
      builder_type: COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE,
    },
  };
}

function buildRollbackGovernanceDecisionLineage(
  current: Artifact<CompanyKnowledgeArtifactContent>,
  rollbackTarget: Artifact<CompanyKnowledgeArtifactContent>,
): ArtifactLineage {
  return {
    upstream_dependencies: [
      dependencyRef(current),
      dependencyRef(rollbackTarget),
    ],
    generation_context: {
      builder_type: COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE,
    },
  };
}

function buildRollbackCompanyKnowledgeLineage(
  current: Artifact<CompanyKnowledgeArtifactContent>,
  rollbackTarget: Artifact<CompanyKnowledgeArtifactContent>,
  governanceDecision: Artifact<GovernanceDecisionContent>,
): ArtifactLineage {
  return {
    upstream_dependencies: [
      dependencyRef(current),
      dependencyRef(rollbackTarget),
      dependencyRef(governanceDecision),
    ],
    generation_context: {
      builder_type: COMPANY_KNOWLEDGE_GOVERNANCE_ENGINE,
    },
  };
}

function dependencyRef(artifact: Artifact<unknown>): ArtifactLineage["upstream_dependencies"][number] {
  return {
    artifact_id: artifact.identity.artifact_id,
    artifact_type: artifact.identity.artifact_type,
    version: artifact.identity.version,
    artifact_hash: artifact.metadata.artifact_hash,
    input_hash: artifact.metadata.input_hash,
  };
}

function buildInvalidationHandoff(
  companyKnowledge: Artifact<CompanyKnowledgeArtifactContent>,
  previous: Artifact<CompanyKnowledgeArtifactContent> | null,
  governanceDecision: Artifact<GovernanceDecisionContent>,
  idGenerator: GovernanceIdGenerator,
  createdAt: string,
): InvalidationHandoff {
  return {
    event_id: idGenerator.nextId("ck-invalidated"),
    company_id: companyKnowledge.identity.company_id ?? "",
    period_id: companyKnowledge.identity.period_id ?? "",
    source_artifact_id: companyKnowledge.identity.artifact_id,
    previous_artifact_id: previous?.identity.artifact_id ?? null,
    governance_decision_artifact_id: governanceDecision.identity.artifact_id,
    reason: "artifact_updated",
    created_at: createdAt,
  };
}

const systemClock: GovernanceClock = {
  now: () => new Date().toISOString(),
};

const randomIdGenerator: GovernanceIdGenerator = {
  nextId: (prefix: string) => `${prefix}-${randomUUID()}`,
};

function validateRollbackInput(input: CompanyKnowledgeRollbackInput): void {
  if (input.company_id.trim() === "") {
    throw new Error("company_id must be a non-empty string.");
  }

  if (input.period_id.trim() === "") {
    throw new Error("period_id must be a non-empty string.");
  }

  if (!Number.isInteger(input.target_version) || input.target_version < 1) {
    throw new Error("target_version must be a positive integer.");
  }

  if (input.reviewer.trim() === "") {
    throw new Error("reviewer must be a non-empty string.");
  }

  if (input.reason.trim() === "") {
    throw new Error("reason must be a non-empty string.");
  }
}
