/**
 * Validation utilities for bootstrap Governance Engine execution.
 *
 * Validation always precedes policy execution. These checks enforce input
 * ownership, schema compatibility, hash integrity, policy status, and the
 * one-candidate boundary required for producing one Governance Decision.
 */
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import type {
  TopicCandidate,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import {
  GOVERNANCE_DECISION_OUTCOMES,
  GOVERNANCE_DECISION_VERSION,
  GOVERNANCE_ENGINE_VERSION,
  GOVERNANCE_POLICY_EVALUATION_RULE_TYPES,
  GOVERNANCE_REGISTRY_IMPACTS,
} from "../../contracts/governance/governance-engine-contract.js";
import type {
  GovernanceDecision,
  GovernanceEngineInput,
} from "../../contracts/governance/governance-engine-types.js";
import {
  GOVERNANCE_POLICY_SCHEMA_VERSION,
  type GovernancePolicyRuleType,
} from "../../contracts/governance/governance-policy-registry-contract.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  GovernanceError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";

export class GovernanceEngineValidationError extends GovernanceError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the Governance Engine input and retry governance execution.",
      ...options,
    });
    this.name = "GovernanceEngineValidationError";
  }
}

export function validateGovernanceEngineInput(
  input: GovernanceEngineInput,
): TopicCandidate {
  requireObject(input, "governance_engine_input");
  requireNonEmptyString(input.execution_id, "execution_id");
  validateTopicCandidateArtifact(input);
  validateGovernancePolicy(input);
  validateCurrentPlatformRegistry(input);

  return input.topic_candidate_artifact.content.candidates[0]!;
}

export function validateGovernanceDecision(
  decision: GovernanceDecision,
  input: GovernanceEngineInput,
  candidate: TopicCandidate,
): void {
  requireObject(decision, "governance_decision");
  requireNonEmptyString(
    decision.governance_decision_id,
    "governance_decision_id",
  );

  if (decision.governance_policy_version !== input.governance_policy.policy_version) {
    throw new GovernanceEngineValidationError(
      "governance_policy_version does not reconcile with Governance Policy.",
    );
  }

  if (decision.decision_version !== GOVERNANCE_DECISION_VERSION) {
    throw new GovernanceEngineValidationError("decision_version is invalid.");
  }

  if (!GOVERNANCE_DECISION_OUTCOMES.includes(decision.decision_outcome)) {
    throw new GovernanceEngineValidationError("decision_outcome is invalid.");
  }

  if (!GOVERNANCE_REGISTRY_IMPACTS.includes(decision.registry_impact)) {
    throw new GovernanceEngineValidationError("registry_impact is invalid.");
  }

  validateCandidateReference(decision, input, candidate);
  validateRuleEvaluations(decision);
  validateApprovedRegistryChange(decision, candidate);

  if (
    decision.lineage.governance_engine_version !== GOVERNANCE_ENGINE_VERSION
      || decision.lineage.governance_policy.policy_version
        !== input.governance_policy.policy_version
      || decision.lineage.topic_candidate.candidate_id
        !== candidate.candidate_id
  ) {
    throw new GovernanceEngineValidationError(
      "governance_decision.lineage does not reconcile with execution inputs.",
    );
  }

  if (
    decision.governance_metadata.execution_id !== input.execution_id
      || decision.governance_metadata.governance_engine_version
        !== GOVERNANCE_ENGINE_VERSION
      || decision.governance_metadata.governance_policy_version
        !== input.governance_policy.policy_version
  ) {
    throw new GovernanceEngineValidationError(
      "governance_metadata does not reconcile with execution inputs.",
    );
  }
}

function validateApprovedRegistryChange(
  decision: GovernanceDecision,
  candidate: TopicCandidate,
): void {
  requireObject(
    decision.approved_registry_change,
    "approved_registry_change",
  );

  if (decision.registry_impact === "no_registry_change") {
    if (
      decision.approved_registry_change.mutation_type
        !== "no_registry_mutation"
    ) {
      throw new GovernanceEngineValidationError(
        "No-change Governance Decisions must carry a no_registry_mutation approved_registry_change.",
      );
    }

    return;
  }

  if (decision.decision_outcome !== "approved") {
    throw new GovernanceEngineValidationError(
      "Only approved Governance Decisions may authorize registry mutations.",
    );
  }

  if (
    decision.approved_registry_change.mutation_type
      !== "create_registry_entry"
  ) {
    throw new GovernanceEngineValidationError(
      "Approved create_new_registry_entry decisions must carry a create_registry_entry approved_registry_change.",
    );
  }

  const registryEntry = decision.approved_registry_change.registry_entry;
  requireObject(registryEntry, "approved_registry_change.registry_entry");
  requireNonEmptyString(
    registryEntry.topic_id,
    "approved_registry_change.registry_entry.topic_id",
  );
  if (registryEntry.topic_id !== candidate.proposed_concept.proposed_topic_id) {
    throw new GovernanceEngineValidationError(
      "approved_registry_change.registry_entry.topic_id must reconcile with the Topic Candidate proposed concept.",
    );
  }
  requireNonEmptyString(
    registryEntry.canonical_name,
    "approved_registry_change.registry_entry.canonical_name",
  );
  requireNonEmptyString(
    registryEntry.definition,
    "approved_registry_change.registry_entry.definition",
  );
  requireNonEmptyString(
    registryEntry.lifecycle_state,
    "approved_registry_change.registry_entry.lifecycle_state",
  );
  requireNonEmptyString(
    registryEntry.created_at,
    "approved_registry_change.registry_entry.created_at",
  );
  requireNonEmptyString(
    registryEntry.updated_at,
    "approved_registry_change.registry_entry.updated_at",
  );
  requirePositiveInteger(
    registryEntry.created_registry_version,
    "approved_registry_change.registry_entry.created_registry_version",
  );
  requirePositiveInteger(
    registryEntry.updated_registry_version,
    "approved_registry_change.registry_entry.updated_registry_version",
  );

  if (
    !Array.isArray(registryEntry.aliases)
      || !Array.isArray(registryEntry.child_topic_ids)
      || !Array.isArray(registryEntry.examples)
  ) {
    throw new GovernanceEngineValidationError(
      "approved_registry_change registry entry list fields must be arrays.",
    );
  }
}

function validateTopicCandidateArtifact(input: GovernanceEngineInput): void {
  const artifact = input.topic_candidate_artifact;
  requireObject(artifact, "topic_candidate_artifact");

  if (artifact.identity.artifact_type !== "topic_candidate") {
    throw new GovernanceEngineValidationError(
      "Governance Engine must consume a Topic Candidate Governance Artifact.",
    );
  }

  if (artifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new GovernanceEngineValidationError(
      "Topic Candidate Governance Artifact must be active.",
    );
  }

  if (
    artifact.metadata.artifact_hash
      !== calculateArtifactHash(artifact.content)
  ) {
    throw new GovernanceEngineValidationError(
      "Topic Candidate Governance Artifact hash does not reconcile with content.",
    );
  }

  if (
    artifact.metadata.schema_version
      !== input.governance_policy.compatibility.topic_candidate_schema_version
  ) {
    throw new GovernanceEngineValidationError(
      "Topic Candidate schema version is not compatible with Governance Policy.",
    );
  }

  if (
    !Array.isArray(artifact.content.candidates)
      || artifact.content.candidates.length !== 1
  ) {
    throw new GovernanceEngineValidationError(
      "Governance Engine bootstrap requires exactly one Topic Candidate in the artifact content.",
    );
  }

  validateTopicCandidate(artifact.content.candidates[0]!);
}

function validateTopicCandidate(candidate: TopicCandidate): void {
  requireObject(candidate, "topic_candidate");
  requireNonEmptyString(candidate.candidate_id, "candidate_id");

  if (candidate.candidate_type !== "topic_candidate") {
    throw new GovernanceEngineValidationError("candidate_type is invalid.");
  }

  requireNonEmptyString(candidate.candidate_version, "candidate_version");
  requireObject(candidate.proposed_concept, "proposed_concept");
  requireNonEmptyString(
    candidate.proposed_concept.proposed_topic_id,
    "proposed_concept.proposed_topic_id",
  );
  requirePositiveInteger(
    candidate.proposed_concept.registry_version,
    "proposed_concept.registry_version",
  );
  requireObject(candidate.evidence_summary, "evidence_summary");
  requireNonNegativeInteger(
    candidate.evidence_summary.candidate_count,
    "evidence_summary.candidate_count",
  );
  requireNonNegativeInteger(
    candidate.evidence_summary.company_count,
    "evidence_summary.company_count",
  );
  requireObject(candidate.supporting_aggregation, "supporting_aggregation");
  requireNonEmptyString(
    candidate.supporting_aggregation.aggregation_id,
    "supporting_aggregation.aggregation_id",
  );

  if (!Array.isArray(candidate.supporting_aggregation.registry_versions)) {
    throw new GovernanceEngineValidationError(
      "supporting_aggregation.registry_versions must be an array.",
    );
  }
}

function validateGovernancePolicy(input: GovernanceEngineInput): void {
  const policy = input.governance_policy;
  requireObject(policy, "governance_policy");

  if (policy.schema_version !== GOVERNANCE_POLICY_SCHEMA_VERSION) {
    throw new GovernanceEngineValidationError(
      "Governance Policy schema_version is invalid.",
    );
  }

  requireNonEmptyString(policy.policy_id, "governance_policy.policy_id");
  requireNonEmptyString(
    policy.policy_version,
    "governance_policy.policy_version",
  );

  if (policy.status !== "active") {
    throw new GovernanceEngineValidationError(
      "Governance Engine requires an active Governance Policy.",
    );
  }

  if (policy.compatibility.governance_engine_version !== GOVERNANCE_ENGINE_VERSION) {
    throw new GovernanceEngineValidationError(
      "Governance Policy is not compatible with this Governance Engine version.",
    );
  }

  if (!Array.isArray(policy.rules) || policy.rules.length === 0) {
    throw new GovernanceEngineValidationError(
      "Governance Policy requires at least one rule.",
    );
  }

  const ruleIds = new Set<string>();

  for (const rule of policy.rules) {
    requireNonEmptyString(rule.rule_id, "governance_policy.rules[].rule_id");

    if (
      !GOVERNANCE_POLICY_EVALUATION_RULE_TYPES.includes(
        rule.rule_type as GovernancePolicyRuleType,
      )
    ) {
      throw new GovernanceEngineValidationError(
        "Governance Policy contains a rule type unsupported by the bootstrap Governance Engine.",
      );
    }

    if (ruleIds.has(rule.rule_id)) {
      throw new GovernanceEngineValidationError(
        "Governance Policy contains a duplicate rule_id.",
      );
    }

    ruleIds.add(rule.rule_id);
  }
}

function validateCurrentPlatformRegistry(input: GovernanceEngineInput): void {
  const artifact = input.current_platform_registry;
  requireObject(artifact, "current_platform_registry");

  if (artifact.identity.artifact_type !== "topic_registry") {
    throw new GovernanceEngineValidationError(
      "Governance Engine current Platform Registry input must be a Topic Registry Platform Artifact.",
    );
  }

  if (artifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new GovernanceEngineValidationError(
      "Current Platform Registry artifact must be active.",
    );
  }

  if (artifact.metadata.artifact_hash !== calculateArtifactHash(artifact.content)) {
    throw new GovernanceEngineValidationError(
      "Current Platform Registry artifact hash does not reconcile with content.",
    );
  }

  requirePositiveInteger(
    artifact.content.registry_version,
    "current_platform_registry.content.registry_version",
  );

  if (!Array.isArray(artifact.content.topics)) {
    throw new GovernanceEngineValidationError(
      "Current Platform Registry topics must be an array.",
    );
  }

  const topicIds = new Set<string>();

  for (const topic of artifact.content.topics) {
    requireNonEmptyString(topic.topic_id, "current_platform_registry.topics[].topic_id");
    requireNonEmptyString(
      topic.canonical_name,
      "current_platform_registry.topics[].canonical_name",
    );

    if (topicIds.has(topic.topic_id)) {
      throw new GovernanceEngineValidationError(
        "Current Platform Registry contains a duplicate topic_id.",
      );
    }

    topicIds.add(topic.topic_id);
  }
}

function validateCandidateReference(
  decision: GovernanceDecision,
  input: GovernanceEngineInput,
  candidate: TopicCandidate,
): void {
  const reference = decision.candidate_reference;

  if (
    reference.artifact_id
      !== input.topic_candidate_artifact.identity.artifact_id
      || reference.artifact_version
        !== input.topic_candidate_artifact.identity.version
      || reference.artifact_hash
        !== input.topic_candidate_artifact.metadata.artifact_hash
      || reference.candidate_id !== candidate.candidate_id
      || reference.candidate_version !== candidate.candidate_version
  ) {
    throw new GovernanceEngineValidationError(
      "candidate_reference does not reconcile with Topic Candidate input.",
    );
  }
}

function validateRuleEvaluations(decision: GovernanceDecision): void {
  if (
    !Array.isArray(decision.decision_basis.rule_evaluations)
      || decision.decision_basis.rule_evaluations.length === 0
  ) {
    throw new GovernanceEngineValidationError(
      "decision_basis.rule_evaluations must be a non-empty array.",
    );
  }

  const ruleIds = new Set<string>();

  for (const ruleEvaluation of decision.decision_basis.rule_evaluations) {
    requireNonEmptyString(ruleEvaluation.rule_id, "rule_evaluations[].rule_id");

    if (
      !GOVERNANCE_POLICY_EVALUATION_RULE_TYPES.includes(
        ruleEvaluation.rule_type,
      )
    ) {
      throw new GovernanceEngineValidationError(
        "rule_evaluations[].rule_type is invalid.",
      );
    }

    if (!["passed", "failed"].includes(ruleEvaluation.result)) {
      throw new GovernanceEngineValidationError(
        "rule_evaluations[].result is invalid.",
      );
    }

    requireNonEmptyString(ruleEvaluation.reason, "rule_evaluations[].reason");

    if (ruleIds.has(ruleEvaluation.rule_id)) {
      throw new GovernanceEngineValidationError(
        "decision_basis.rule_evaluations contains duplicate rule_id values.",
      );
    }

    ruleIds.add(ruleEvaluation.rule_id);
  }
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new GovernanceEngineValidationError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new GovernanceEngineValidationError(
      `${field} must be a non-empty string.`,
    );
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new GovernanceEngineValidationError(
      `${field} must be a positive integer.`,
    );
  }
}

function requireNonNegativeInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new GovernanceEngineValidationError(
      `${field} must be a non-negative integer.`,
    );
  }
}
