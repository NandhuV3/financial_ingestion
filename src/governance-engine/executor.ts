/**
 * Bootstrap Governance Engine executor.
 *
 * The executor consumes one Topic Candidate Governance Artifact and one active
 * Governance Policy, evaluates only the supported deterministic bootstrap
 * rules, and returns one Governance Decision object. It never persists,
 * mutates registries, changes policies, or performs semantic reasoning.
 */
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  GovernanceDecisionArtifactContent,
  GovernanceApprovedRegistryChange,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import type {
  TopicCandidate,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import {
  GOVERNANCE_DECISION_ARTIFACT_TYPE,
  GOVERNANCE_DECISION_PIPELINE_VERSION,
  GOVERNANCE_DECISION_SCHEMA_VERSION,
  GOVERNANCE_DECISION_VERSION,
  GOVERNANCE_ENGINE_ARTIFACT_PRODUCER,
  GOVERNANCE_ENGINE_VERSION,
  type GovernancePolicyEvaluationRuleType,
  type GovernanceRuleResult,
} from "../../contracts/governance/governance-engine-contract.js";
import type {
  GovernanceDecision,
  GovernanceDecisionCandidateReference,
  GovernanceDecisionRuleEvaluation,
  GovernanceEngineInput,
} from "../../contracts/governance/governance-engine-types.js";
import type {
  GovernancePolicyRule,
} from "../../contracts/governance/governance-policy-registry-types.js";
import type { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import { stableHash } from "../shared/hashing/stable-hash.js";
import { createLogger } from "../shared/logger.js";
import {
  validateGovernanceDecision,
  validateGovernanceEngineInput,
} from "./validator.js";

const logger = createLogger("governance-engine");

export type GovernanceDecisionArtifactOptions = {
  generatedAt?: string;
  generationDurationMs?: number;
};

export class GovernanceEngine {
  execute(input: GovernanceEngineInput): GovernanceDecision {
    const startedAt = Date.now();

    logger.info("Governance Engine execution started.", {
      execution_id: input.execution_id,
      governance_engine_version: GOVERNANCE_ENGINE_VERSION,
      governance_policy_version: input.governance_policy.policy_version,
      platform_registry_version:
        input.current_platform_registry.content.registry_version,
    });

    const candidate = validateGovernanceEngineInput(input);

    logger.info("Governance Engine input validation succeeded.", {
      execution_id: input.execution_id,
      candidate_id: candidate.candidate_id,
      policy_rule_count: input.governance_policy.rules.length,
    });

    const ruleEvaluations = input.governance_policy.rules.map((rule) =>
      evaluateRule(rule, candidate));
    const allRulesPassed = ruleEvaluations.every((evaluation) =>
      evaluation.result === "passed");
    const candidateAlreadyExists = platformRegistryContainsCandidate(
      candidate,
      input.current_platform_registry.content,
    );
    const candidateReference = buildCandidateReference(input, candidate);
    const decisionOutcome = allRulesPassed && !candidateAlreadyExists
      ? "approved"
      : "rejected";
    const registryImpact = decisionOutcome === "approved"
      ? "create_new_registry_entry"
      : "no_registry_change";
    const approvedRegistryChange = buildApprovedRegistryChange(
      candidate,
      input,
      registryImpact,
    );
    const decision: GovernanceDecision = {
      governance_decision_id: governanceDecisionId({
        candidateReference,
        governancePolicyVersion: input.governance_policy.policy_version,
        ruleEvaluations,
        decisionOutcome,
        registryImpact,
        approvedRegistryChange,
        platformRegistryArtifactHash:
          input.current_platform_registry.metadata.artifact_hash,
        platformRegistryVersion:
          input.current_platform_registry.content.registry_version,
      }),
      governance_policy_version: input.governance_policy.policy_version,
      decision_version: GOVERNANCE_DECISION_VERSION,
      candidate_reference: candidateReference,
      decision_outcome: decisionOutcome,
      decision_basis: {
        rule_evaluations: ruleEvaluations,
      },
      registry_impact: registryImpact,
      approved_registry_change: approvedRegistryChange,
      lineage: {
        topic_candidate: candidateReference,
        governance_policy: {
          policy_id: input.governance_policy.policy_id,
          policy_version: input.governance_policy.policy_version,
        },
        governance_engine_version: GOVERNANCE_ENGINE_VERSION,
      },
      governance_metadata: {
        governance_engine_version: GOVERNANCE_ENGINE_VERSION,
        governance_policy_version: input.governance_policy.policy_version,
        execution_id: input.execution_id,
      },
    };

    validateGovernanceDecision(decision, input, candidate);

    logger.info("Governance Engine execution completed.", {
      execution_id: input.execution_id,
      candidate_id: candidate.candidate_id,
      governance_decision_id: decision.governance_decision_id,
      decision_outcome: decision.decision_outcome,
      platform_registry_version:
        input.current_platform_registry.content.registry_version,
      candidate_already_exists: candidateAlreadyExists,
      duration_ms: Date.now() - startedAt,
    });

    return decision;
  }

  async executeArtifact(
    input: GovernanceEngineInput,
    artifactService: ArtifactService,
    options: GovernanceDecisionArtifactOptions = {},
  ): Promise<Artifact<GovernanceDecisionArtifactContent>> {
    const startedAt = Date.now();
    const decision = this.execute(input);
    const content = governanceDecisionArtifactContent(decision);

    return artifactService.createArtifact<GovernanceDecisionArtifactContent>({
      artifact_id: governanceDecisionArtifactId(content),
      artifact_type: GOVERNANCE_DECISION_ARTIFACT_TYPE,
      company_id: input.topic_candidate_artifact.identity.company_id,
      period_id: input.topic_candidate_artifact.identity.period_id,
      content,
      lineage: {
        upstream_dependencies: [
          {
            artifact_id:
              input.topic_candidate_artifact.identity.artifact_id,
            artifact_type:
              input.topic_candidate_artifact.identity.artifact_type,
            version: input.topic_candidate_artifact.identity.version,
            artifact_hash:
              input.topic_candidate_artifact.metadata.artifact_hash,
            input_hash:
            input.topic_candidate_artifact.metadata.input_hash,
          },
          {
            artifact_id:
              input.current_platform_registry.identity.artifact_id,
            artifact_type:
              input.current_platform_registry.identity.artifact_type,
            version: input.current_platform_registry.identity.version,
            artifact_hash:
              input.current_platform_registry.metadata.artifact_hash,
            input_hash:
              input.current_platform_registry.metadata.input_hash,
          },
        ],
        generation_context: {
          builder_type: GOVERNANCE_ENGINE_ARTIFACT_PRODUCER,
          execution_id: input.execution_id,
        },
      },
      schema_version: GOVERNANCE_DECISION_SCHEMA_VERSION,
      pipeline_version: GOVERNANCE_DECISION_PIPELINE_VERSION,
      input_hash: governanceDecisionInputHash(input),
      generation_duration_ms:
        options.generationDurationMs ?? Date.now() - startedAt,
      generated_at: options.generatedAt,
    });
  }
}

export function governanceDecisionArtifactContent(
  decision: GovernanceDecision,
): GovernanceDecisionArtifactContent {
  return {
    governance_decision_id: decision.governance_decision_id,
    governance_policy_version: decision.governance_policy_version,
    decision_version: decision.decision_version,
    candidate_reference: {
      artifact_id: decision.candidate_reference.artifact_id,
      artifact_version: decision.candidate_reference.artifact_version,
      candidate_id: decision.candidate_reference.candidate_id,
      candidate_version: decision.candidate_reference.candidate_version,
    },
    decision_outcome: decision.decision_outcome,
    decision_basis: decision.decision_basis,
    registry_impact: decision.registry_impact,
    approved_registry_change: decision.approved_registry_change,
    governance_metadata: decision.governance_metadata,
  };
}

export function governanceDecisionArtifactId(
  content: GovernanceDecisionArtifactContent,
): ReservedArtifactId {
  return `governance-decision-artifact:${stableHash({
    decision_version: content.decision_version,
    governance_decision_id: content.governance_decision_id,
    governance_policy_version: content.governance_policy_version,
  })}` as ReservedArtifactId;
}

function governanceDecisionInputHash(input: GovernanceEngineInput): string {
  return stableHash({
    governance_engine_version: GOVERNANCE_ENGINE_VERSION,
    governance_policy: input.governance_policy,
    topic_candidate_artifact: {
      artifact_hash: input.topic_candidate_artifact.metadata.artifact_hash,
      artifact_id: input.topic_candidate_artifact.identity.artifact_id,
      artifact_type: input.topic_candidate_artifact.identity.artifact_type,
      version: input.topic_candidate_artifact.identity.version,
    },
    current_platform_registry: {
      artifact_hash: input.current_platform_registry.metadata.artifact_hash,
      artifact_id: input.current_platform_registry.identity.artifact_id,
      registry_version: input.current_platform_registry.content.registry_version,
      version: input.current_platform_registry.identity.version,
    },
  });
}

function evaluateRule(
  rule: GovernancePolicyRule,
  candidate: TopicCandidate,
): GovernanceDecisionRuleEvaluation {
  switch (rule.rule_type) {
    case "candidate_eligibility":
      return evaluateCandidateEligibility(rule, candidate);
    case "required_evidence_presence":
      return evaluateRequiredEvidencePresence(rule, candidate);
    case "required_registry_context_presence":
      return evaluateRequiredRegistryContextPresence(rule, candidate);
  }
}

function evaluateCandidateEligibility(
  rule: GovernancePolicyRule,
  candidate: TopicCandidate,
): GovernanceDecisionRuleEvaluation {
  const requiredCandidateType = stringParameter(
    rule,
    "required_candidate_type",
    "topic_candidate",
  );
  const passed =
    candidate.candidate_type === requiredCandidateType
      && candidate.proposed_concept.proposed_topic_id.trim() !== "";

  return ruleEvaluation(
    rule,
    passed,
    passed
      ? "Topic Candidate satisfies bootstrap structural eligibility."
      : "Topic Candidate does not satisfy bootstrap structural eligibility.",
  );
}

function evaluateRequiredEvidencePresence(
  rule: GovernancePolicyRule,
  candidate: TopicCandidate,
): GovernanceDecisionRuleEvaluation {
  const minimumCandidateCount = numberParameter(
    rule,
    "minimum_candidate_count",
    1,
  );
  const minimumCompanyCount = numberParameter(rule, "minimum_company_count", 1);
  const passed =
    candidate.evidence_summary.candidate_count >= minimumCandidateCount
      && candidate.evidence_summary.company_count >= minimumCompanyCount
      && candidate.supporting_aggregation.aggregation_id.trim() !== "";

  return ruleEvaluation(
    rule,
    passed,
    passed
      ? "Topic Candidate preserves required supporting evidence."
      : "Topic Candidate lacks required supporting evidence.",
  );
}

function evaluateRequiredRegistryContextPresence(
  rule: GovernancePolicyRule,
  candidate: TopicCandidate,
): GovernanceDecisionRuleEvaluation {
  const requireRegistryVersion = booleanParameter(
    rule,
    "require_registry_version",
    true,
  );
  const passed = !requireRegistryVersion
    || (
      candidate.proposed_concept.registry_version > 0
        && candidate.supporting_aggregation.registry_versions.includes(
          candidate.proposed_concept.registry_version,
        )
    );

  return ruleEvaluation(
    rule,
    passed,
    passed
      ? "Topic Candidate preserves required registry context."
      : "Topic Candidate lacks required registry context.",
  );
}

function ruleEvaluation(
  rule: GovernancePolicyRule,
  passed: boolean,
  reason: string,
): GovernanceDecisionRuleEvaluation {
  return {
    rule_id: rule.rule_id,
    rule_type: rule.rule_type as GovernancePolicyEvaluationRuleType,
    result: (passed ? "passed" : "failed") as GovernanceRuleResult,
    reason,
  };
}

function buildCandidateReference(
  input: GovernanceEngineInput,
  candidate: TopicCandidate,
): GovernanceDecisionCandidateReference {
  return {
    artifact_id: input.topic_candidate_artifact.identity.artifact_id,
    artifact_version: input.topic_candidate_artifact.identity.version,
    artifact_hash: input.topic_candidate_artifact.metadata.artifact_hash,
    candidate_id: candidate.candidate_id,
    candidate_version: candidate.candidate_version,
  };
}

function buildApprovedRegistryChange(
  candidate: TopicCandidate,
  input: GovernanceEngineInput,
  registryImpact: GovernanceDecision["registry_impact"],
): GovernanceApprovedRegistryChange {
  if (registryImpact === "no_registry_change") {
    return {
      mutation_type: "no_registry_mutation",
    };
  }

  return {
    mutation_type: "create_registry_entry",
    registry_entry: buildApprovedTopicRegistryEntry(candidate, input),
  };
}

function buildApprovedTopicRegistryEntry(
  candidate: TopicCandidate,
  input: GovernanceEngineInput,
): TopicRegistryEntry {
  const topicId = candidate.proposed_concept.proposed_topic_id;
  const canonicalName = canonicalNameFromTopicId(topicId);
  const registryVersion = candidate.proposed_concept.registry_version + 1;

  return {
    topic_id: topicId,
    canonical_name: canonicalName,
    definition:
      `Governance-approved reusable platform topic for ${canonicalName}.`,
    aliases: [],
    lifecycle_state: "active",
    created_registry_version: registryVersion,
    updated_registry_version: registryVersion,
    child_topic_ids: [],
    examples: [],
    created_at: input.topic_candidate_artifact.metadata.generated_at,
    updated_at: input.topic_candidate_artifact.metadata.generated_at,
  };
}

function platformRegistryContainsCandidate(
  candidate: TopicCandidate,
  registry: TopicRegistryArtifactContent,
): boolean {
  const proposedTopicId = candidate.proposed_concept.proposed_topic_id;
  const proposedCanonicalName = normalize(canonicalNameFromTopicId(
    proposedTopicId,
  ));

  return registry.topics.some((topic) =>
    topic.topic_id === proposedTopicId
      || normalize(topic.canonical_name) === proposedCanonicalName);
}

function canonicalNameFromTopicId(topicId: string): string {
  return topicId
    .split("_")
    .filter((part) => part.trim() !== "")
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function governanceDecisionId(input: {
  candidateReference: GovernanceDecisionCandidateReference;
  governancePolicyVersion: string;
  ruleEvaluations: GovernanceDecisionRuleEvaluation[];
  decisionOutcome: string;
  registryImpact: GovernanceDecision["registry_impact"];
  approvedRegistryChange: GovernanceApprovedRegistryChange;
  platformRegistryArtifactHash: string;
  platformRegistryVersion: number;
}): string {
  return `governance-decision:${stableHash({
    approved_registry_change: input.approvedRegistryChange,
    candidate_reference: input.candidateReference,
    decision_outcome: input.decisionOutcome,
    decision_version: GOVERNANCE_DECISION_VERSION,
    governance_engine_version: GOVERNANCE_ENGINE_VERSION,
    governance_policy_version: input.governancePolicyVersion,
    platform_registry_artifact_hash: input.platformRegistryArtifactHash,
    platform_registry_version: input.platformRegistryVersion,
    registry_impact: input.registryImpact,
    rule_evaluations: input.ruleEvaluations,
  })}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function stringParameter(
  rule: GovernancePolicyRule,
  key: string,
  fallback: string,
): string {
  const value = rule.parameters[key];

  return typeof value === "string" ? value : fallback;
}

function numberParameter(
  rule: GovernancePolicyRule,
  key: string,
  fallback: number,
): number {
  const value = rule.parameters[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function booleanParameter(
  rule: GovernancePolicyRule,
  key: string,
  fallback: boolean,
): boolean {
  const value = rule.parameters[key];

  return typeof value === "boolean" ? value : fallback;
}
