import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  GOVERNANCE_POLICY_REGISTRY_SCHEMA_VERSION,
  GOVERNANCE_POLICY_SCHEMA_VERSION,
} from "../contracts/governance/governance-policy-registry-contract.js";
import type {
  GovernancePolicyRegistrySource,
} from "../contracts/governance/governance-policy-registry-types.js";
import {
  GovernancePolicyRegistry,
  GovernancePolicyRegistryError,
  loadGovernancePolicyRegistry,
} from "../src/governance-policy-registry/index.js";

describe("Governance Policy Registry", () => {
  it("loads the default static registry and exposes exactly one active policy", async () => {
    const registry = await loadGovernancePolicyRegistry();
    const activePolicy = registry.getActivePolicy();

    assert.equal(activePolicy.policy_version, "topic-candidate-governance-v1");
    assert.equal(activePolicy.status, "active");
    assert.equal(activePolicy.schema_version, GOVERNANCE_POLICY_SCHEMA_VERSION);
    assert.deepEqual(registry.listPolicyVersions(), [
      "topic-candidate-governance-v1",
    ]);
    assert.equal(registry.hasPolicyVersion(activePolicy.policy_version), true);
  });

  it("supports deterministic lookup by policy version", async () => {
    const registry = await loadGovernancePolicyRegistry();
    const byVersion = registry.getPolicyByVersion(
      "topic-candidate-governance-v1",
    );

    assert.equal(byVersion.policy_id, "topic-candidate-governance");
    assert.equal(byVersion.status, "active");
    assert.deepEqual(byVersion, registry.getActivePolicy());
  });

  it("returns defensive copies from the read-only API", () => {
    const registry = new GovernancePolicyRegistry(source());
    const activePolicy = registry.getActivePolicy();

    activePolicy.policy_version = "mutated";
    activePolicy.rules[0]!.parameters.required_candidate_type = "mutated";

    assert.equal(
      registry.getActivePolicy().policy_version,
      "topic-candidate-governance-v1",
    );
    assert.equal(
      registry.getActivePolicy().rules[0]!.parameters.required_candidate_type,
      "topic_candidate",
    );
  });

  it("rejects invalid registry schema versions", () => {
    const invalidSource = {
      ...source(),
      schema_version: "governance-policy-registry-v0",
    };

    assert.throws(
      () => new GovernancePolicyRegistry(invalidSource),
      GovernancePolicyRegistryError,
    );
  });

  it("rejects multiple active policy versions", () => {
    const duplicateActive = source();
    duplicateActive.policies.push({
      ...duplicateActive.policies[0]!,
      policy_version: "topic-candidate-governance-v2",
    });

    assert.throws(
      () => new GovernancePolicyRegistry(duplicateActive),
      GovernancePolicyRegistryError,
    );
  });

  it("rejects duplicate policy versions", () => {
    const duplicateVersion = source();
    duplicateVersion.policies.push({
      ...duplicateVersion.policies[0]!,
      status: "retired",
    });

    assert.throws(
      () => new GovernancePolicyRegistry(duplicateVersion),
      GovernancePolicyRegistryError,
    );
  });

  it("loads a registry from an explicit path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "governance-policy-"));
    const path = join(directory, "governance-policies.json");

    await writeFile(path, `${JSON.stringify(source(), null, 2)}\n`, "utf8");

    const registry = await loadGovernancePolicyRegistry(path);

    assert.equal(
      registry.getActivePolicy().policy_version,
      "topic-candidate-governance-v1",
    );
  });
});

function source(): GovernancePolicyRegistrySource {
  return {
    schema_version: GOVERNANCE_POLICY_REGISTRY_SCHEMA_VERSION,
    registry_id: "governance-policy-registry",
    policies: [
      {
        schema_version: GOVERNANCE_POLICY_SCHEMA_VERSION,
        policy_id: "topic-candidate-governance",
        policy_version: "topic-candidate-governance-v1",
        status: "active",
        description: "Bootstrap deterministic governance policy.",
        compatibility: {
          topic_candidate_schema_version: "topic-candidate-artifact-v1",
          governance_engine_version: "governance-engine-v1",
        },
        rules: [
          {
            rule_id: "candidate-eligibility-v1",
            rule_type: "candidate_eligibility",
            description: "Evaluate candidate eligibility.",
            parameters: {
              required_candidate_type: "topic_candidate",
            },
          },
        ],
      },
    ],
  };
}
