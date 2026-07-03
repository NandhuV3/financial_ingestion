/**
 * Read-only Governance Policy Registry implementation.
 *
 * This module validates immutable registry source content, enforces exactly
 * one active Governance Policy version, and exposes defensive-copy lookup
 * methods for future Governance Engine consumption. It never evaluates
 * policies, mutates registry state, or performs governance decisions.
 */
import {
  GOVERNANCE_POLICY_REGISTRY_SCHEMA_VERSION,
  GOVERNANCE_POLICY_RULE_TYPES,
  GOVERNANCE_POLICY_SCHEMA_VERSION,
  GOVERNANCE_POLICY_STATUSES,
  type GovernancePolicyRuleType,
  type GovernancePolicyStatus,
} from "../../contracts/governance/governance-policy-registry-contract.js";
import type {
  GovernancePolicy,
  GovernancePolicyParameterValue,
  GovernancePolicyRegistryReader,
  GovernancePolicyRegistrySource,
  GovernancePolicyRule,
} from "../../contracts/governance/governance-policy-registry-types.js";
import {
  GovernanceError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";

export class GovernancePolicyRegistryError extends GovernanceError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the Governance Policy Registry source and retry loading the registry.",
      ...options,
    });
    this.name = "GovernancePolicyRegistryError";
  }
}

export class GovernancePolicyRegistry implements GovernancePolicyRegistryReader {
  private readonly policiesByVersion = new Map<string, GovernancePolicy>();
  private readonly activePolicy: GovernancePolicy;
  private readonly policyVersions: string[];

  constructor(source: GovernancePolicyRegistrySource) {
    validateGovernancePolicyRegistrySource(source);

    for (const policy of source.policies) {
      this.policiesByVersion.set(policy.policy_version, clone(policy));
    }

    const activePolicy = source.policies.find((policy) =>
      policy.status === "active");

    if (activePolicy === undefined) {
      throw new GovernancePolicyRegistryError(
        "Governance Policy Registry requires exactly one active policy.",
      );
    }

    this.activePolicy = clone(activePolicy);
    this.policyVersions = [...this.policiesByVersion.keys()]
      .sort((left, right) => left.localeCompare(right));
  }

  getActivePolicy(): GovernancePolicy {
    return clone(this.activePolicy);
  }

  getPolicyByVersion(policyVersion: string): GovernancePolicy {
    const policy = this.policiesByVersion.get(policyVersion);

    if (policy === undefined) {
      throw new GovernancePolicyRegistryError(
        `Governance Policy version not found: ${policyVersion}`,
      );
    }

    return clone(policy);
  }

  hasPolicyVersion(policyVersion: string): boolean {
    return this.policiesByVersion.has(policyVersion);
  }

  listPolicyVersions(): string[] {
    return [...this.policyVersions];
  }
}

export function validateGovernancePolicyRegistrySource(
  source: unknown,
): asserts source is GovernancePolicyRegistrySource {
  requireObject(source, "governance_policy_registry");

  if (source.schema_version !== GOVERNANCE_POLICY_REGISTRY_SCHEMA_VERSION) {
    throw new GovernancePolicyRegistryError(
      "Governance Policy Registry schema_version is invalid.",
    );
  }

  requireNonEmptyString(source.registry_id, "registry_id");

  if (!Array.isArray(source.policies) || source.policies.length === 0) {
    throw new GovernancePolicyRegistryError(
      "Governance Policy Registry requires at least one policy.",
    );
  }

  const versions = new Set<string>();
  let activeCount = 0;

  source.policies.forEach((policy, index) => {
    validateGovernancePolicy(policy, `policies[${index}]`);

    if (versions.has(policy.policy_version)) {
      throw new GovernancePolicyRegistryError(
        `policies[${index}].policy_version duplicates another policy version.`,
      );
    }

    versions.add(policy.policy_version);

    if (policy.status === "active") {
      activeCount += 1;
    }
  });

  if (activeCount !== 1) {
    throw new GovernancePolicyRegistryError(
      "Governance Policy Registry must contain exactly one active policy.",
    );
  }
}

function validateGovernancePolicy(
  policy: unknown,
  field: string,
): asserts policy is GovernancePolicy {
  requireObject(policy, field);

  if (policy.schema_version !== GOVERNANCE_POLICY_SCHEMA_VERSION) {
    throw new GovernancePolicyRegistryError(
      `${field}.schema_version is invalid.`,
    );
  }

  requireNonEmptyString(policy.policy_id, `${field}.policy_id`);
  requireNonEmptyString(policy.policy_version, `${field}.policy_version`);

  if (
    !GOVERNANCE_POLICY_STATUSES.includes(
      policy.status as GovernancePolicyStatus,
    )
  ) {
    throw new GovernancePolicyRegistryError(`${field}.status is invalid.`);
  }

  requireNonEmptyString(policy.description, `${field}.description`);
  requireObject(policy.compatibility, `${field}.compatibility`);
  requireNonEmptyString(
    policy.compatibility.topic_candidate_schema_version,
    `${field}.compatibility.topic_candidate_schema_version`,
  );
  requireNonEmptyString(
    policy.compatibility.governance_engine_version,
    `${field}.compatibility.governance_engine_version`,
  );

  if (!Array.isArray(policy.rules) || policy.rules.length === 0) {
    throw new GovernancePolicyRegistryError(
      `${field}.rules must be a non-empty array.`,
    );
  }

  const ruleIds = new Set<string>();

  policy.rules.forEach((rule, index) => {
    validateGovernancePolicyRule(rule, `${field}.rules[${index}]`);

    if (ruleIds.has(rule.rule_id)) {
      throw new GovernancePolicyRegistryError(
        `${field}.rules[${index}].rule_id duplicates another policy rule.`,
      );
    }

    ruleIds.add(rule.rule_id);
  });
}

function validateGovernancePolicyRule(
  rule: unknown,
  field: string,
): asserts rule is GovernancePolicyRule {
  requireObject(rule, field);
  requireNonEmptyString(rule.rule_id, `${field}.rule_id`);

  if (
    !GOVERNANCE_POLICY_RULE_TYPES.includes(
      rule.rule_type as GovernancePolicyRuleType,
    )
  ) {
    throw new GovernancePolicyRegistryError(`${field}.rule_type is invalid.`);
  }

  requireNonEmptyString(rule.description, `${field}.description`);
  requireObject(rule.parameters, `${field}.parameters`);

  for (const [key, value] of Object.entries(rule.parameters)) {
    requireNonEmptyString(key, `${field}.parameters key`);
    validateParameterValue(value, `${field}.parameters.${key}`);
  }
}

function validateParameterValue(
  value: unknown,
  field: string,
): asserts value is GovernancePolicyParameterValue {
  if (
    typeof value === "string"
      || typeof value === "number" && Number.isFinite(value)
      || typeof value === "boolean"
  ) {
    return;
  }

  if (
    Array.isArray(value)
      && value.every((item) =>
        typeof item === "string"
          || typeof item === "number" && Number.isFinite(item))
  ) {
    return;
  }

  throw new GovernancePolicyRegistryError(
    `${field} must be a deterministic policy parameter value.`,
  );
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new GovernancePolicyRegistryError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new GovernancePolicyRegistryError(
      `${field} must be a non-empty string.`,
    );
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
