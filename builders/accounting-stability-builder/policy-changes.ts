import { stableRecordId } from "./identity.js";
import type {
  AccountingBuildDependencies,
  PolicyChange,
} from "./types.js";
import { sortedUnique } from "./validation-helpers.js";

export function buildPolicyChanges(
  dependencies: AccountingBuildDependencies,
): PolicyChange[] {
  const changes: PolicyChange[] = [];

  for (let index = 1; index < dependencies.sources.length; index += 1) {
    const prior = dependencies.sources[index - 1]!;
    const current = dependencies.sources[index]!;
    if (
      !prior.artifact.content.coverage.accounting_policies_available
      || !current.artifact.content.coverage.accounting_policies_available
    ) {
      continue;
    }

    const priorByType = new Map(
      prior.artifact.content.accounting_policies.map((policy) => [
        policy.policy_type,
        policy,
      ]),
    );

    for (const policy of current.artifact.content.accounting_policies) {
      const priorPolicy = priorByType.get(policy.policy_type);
      if (priorPolicy === undefined || priorPolicy.policy_text === policy.policy_text) {
        continue;
      }

      changes.push({
        policy_change_id: stableRecordId("policy-change", [
          current.declaration.period_id,
          policy.policy_type,
          priorPolicy.policy_text,
          policy.policy_text,
        ]),
        policy_type: policy.policy_type,
        prior_policy: priorPolicy.policy_text,
        current_policy: policy.policy_text,
        change_detected_period: current.declaration.period_id,
        proactively_disclosed: policy.proactively_disclosed,
        comparability_impact: policy.comparability_impact,
        evidence_refs: sortedUnique([
          ...priorPolicy.evidence_refs,
          ...policy.evidence_refs,
        ]),
        source_artifact_refs: sortedUnique([
          prior.artifact.identity.artifact_id,
          current.artifact.identity.artifact_id,
        ]),
        confidence: average([priorPolicy.confidence, policy.confidence]),
      });
    }
  }

  return changes.sort((left, right) =>
    left.change_detected_period.localeCompare(right.change_detected_period)
    || left.policy_type.localeCompare(right.policy_type)
    || left.policy_change_id.localeCompare(right.policy_change_id));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

