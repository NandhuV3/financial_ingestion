/**
 * Bootstrap Governance Engine executor.
 *
 * The executor consumes one Topic Candidate Governance Artifact and one active
 * Governance Policy, evaluates only the supported deterministic bootstrap
 * rules, and returns one Governance Decision object. It never persists,
 * mutates registries, changes policies, or performs semantic reasoning.
 */
import type {
  TopicCandidate,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import {
  GOVERNANCE_DECISION_VERSION,
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
import { stableHash } from "../shared/hashing/stable-hash.js";
import { createLogger } from "../shared/logger.js";
import {
  validateGovernanceDecision,
  validateGovernanceEngineInput,
} from "./validator.js";

const logger = createLogger("governance-engine");

export class GovernanceEngine {
  execute(input: GovernanceEngineInput): GovernanceDecision {
    const startedAt = Date.now();

    logger.info("Governance Engine execution started.", {
      execution_id: input.execution_id,
      governance_engine_version: GOVERNANCE_ENGINE_VERSION,
      governance_policy_version: input.governance_policy.policy_version,
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
    const candidateReference = buildCandidateReference(input, candidate);
    const decisionOutcome = allRulesPassed ? "approved" : "rejected";
    const decision: GovernanceDecision = {
      governance_decision_id: governanceDecisionId({
        candidateReference,
        governancePolicyVersion: input.governance_policy.policy_version,
        ruleEvaluations,
        decisionOutcome,
      }),
      governance_policy_version: input.governance_policy.policy_version,
      decision_version: GOVERNANCE_DECISION_VERSION,
      candidate_reference: candidateReference,
      decision_outcome: decisionOutcome,
      decision_basis: {
        rule_evaluations: ruleEvaluations,
      },
      registry_impact: allRulesPassed
        ? "create_new_registry_entry"
        : "no_registry_change",
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
      duration_ms: Date.now() - startedAt,
    });

    return decision;
  }
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

function governanceDecisionId(input: {
  candidateReference: GovernanceDecisionCandidateReference;
  governancePolicyVersion: string;
  ruleEvaluations: GovernanceDecisionRuleEvaluation[];
  decisionOutcome: string;
}): string {
  return `governance-decision:${stableHash({
    candidate_reference: input.candidateReference,
    decision_outcome: input.decisionOutcome,
    decision_version: GOVERNANCE_DECISION_VERSION,
    governance_engine_version: GOVERNANCE_ENGINE_VERSION,
    governance_policy_version: input.governancePolicyVersion,
    rule_evaluations: input.ruleEvaluations,
  })}`;
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
