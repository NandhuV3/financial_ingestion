import type {
  GovernancePolicyRuleType,
  GovernancePolicyStatus,
} from "./governance-policy-registry-contract.js";

/**
 * Shared type contract for immutable Governance Policy Registry content.
 *
 * The registry supplies versioned Governance Policies to future Governance
 * Engine implementations. These types describe registry input, read-only
 * lookup behavior, policy compatibility, and deterministic rule parameters.
 */
export type GovernancePolicyParameterValue =
  | string
  | number
  | boolean
  | string[]
  | number[];

export type GovernancePolicyRule = {
  rule_id: string;
  rule_type: GovernancePolicyRuleType;
  description: string;
  parameters: Record<string, GovernancePolicyParameterValue>;
};

export type GovernancePolicyCompatibility = {
  topic_candidate_schema_version: string;
  governance_engine_version: string;
};

export type GovernancePolicy = {
  schema_version: string;
  policy_id: string;
  policy_version: string;
  status: GovernancePolicyStatus;
  description: string;
  compatibility: GovernancePolicyCompatibility;
  rules: GovernancePolicyRule[];
};

export type GovernancePolicyRegistrySource = {
  schema_version: string;
  registry_id: string;
  policies: GovernancePolicy[];
};

export type GovernancePolicyRegistryReader = {
  getActivePolicy(): GovernancePolicy;
  getPolicyByVersion(policyVersion: string): GovernancePolicy;
  hasPolicyVersion(policyVersion: string): boolean;
  listPolicyVersions(): string[];
};
