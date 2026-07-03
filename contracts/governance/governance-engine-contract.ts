/**
 * Public constants for the bootstrap Governance Engine.
 *
 * The Governance Engine consumes one Topic Candidate Governance Artifact and
 * one active Governance Policy, then produces one deterministic Governance
 * Decision object for later persistence by governance infrastructure.
 */
export const GOVERNANCE_ENGINE_VERSION = "governance-engine-v1";
export const GOVERNANCE_DECISION_VERSION = "governance-decision-v1";

export const GOVERNANCE_DECISION_OUTCOMES = [
  "approved",
  "rejected",
] as const;

export type GovernanceDecisionOutcome =
  typeof GOVERNANCE_DECISION_OUTCOMES[number];

export const GOVERNANCE_REGISTRY_IMPACTS = [
  "no_registry_change",
  "create_new_registry_entry",
] as const;

export type GovernanceRegistryImpact =
  typeof GOVERNANCE_REGISTRY_IMPACTS[number];

export const GOVERNANCE_POLICY_EVALUATION_RULE_TYPES = [
  "candidate_eligibility",
  "required_evidence_presence",
  "required_registry_context_presence",
] as const;

export type GovernancePolicyEvaluationRuleType =
  typeof GOVERNANCE_POLICY_EVALUATION_RULE_TYPES[number];

export const GOVERNANCE_RULE_RESULTS = [
  "passed",
  "failed",
] as const;

export type GovernanceRuleResult = typeof GOVERNANCE_RULE_RESULTS[number];
