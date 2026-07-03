/**
 * Public constants for the read-only Governance Policy Registry bootstrap.
 *
 * These values define the supported registry schema, policy schema, lifecycle
 * states, and deterministic rule categories consumed by the registry loader.
 */
export const GOVERNANCE_POLICY_REGISTRY_SCHEMA_VERSION =
  "governance-policy-registry-v1";
export const GOVERNANCE_POLICY_SCHEMA_VERSION = "governance-policy-v1";

export const GOVERNANCE_POLICY_STATUSES = [
  "active",
  "retired",
] as const;

export type GovernancePolicyStatus =
  typeof GOVERNANCE_POLICY_STATUSES[number];

export const GOVERNANCE_POLICY_RULE_TYPES = [
  "candidate_eligibility",
  "required_evidence_presence",
  "required_registry_context_presence",
] as const;

export type GovernancePolicyRuleType =
  typeof GOVERNANCE_POLICY_RULE_TYPES[number];
