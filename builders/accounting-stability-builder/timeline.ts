import type {
  AccountingBuildDependencies,
  AccountingTimeline,
  PolicyChange,
  RestatementRecord,
  SegmentChange,
} from "./types.js";

export function buildAccountingTimeline(input: {
  dependencies: AccountingBuildDependencies;
  policyChanges: PolicyChange[];
  segmentChanges: SegmentChange[];
  restatements: RestatementRecord[];
}): AccountingTimeline[] {
  return input.dependencies.sources.map(({ declaration }) => ({
    period: declaration.period_id,
    policy_change_refs: input.policyChanges
      .filter((change) => change.change_detected_period === declaration.period_id)
      .map(({ policy_change_id }) => policy_change_id)
      .sort(),
    segment_change_refs: input.segmentChanges
      .filter((change) => change.change_detected_period === declaration.period_id)
      .map(({ segment_change_id }) => segment_change_id)
      .sort(),
    restatement_refs: input.restatements
      .filter((record) => record.period_announced === declaration.period_id)
      .map(({ restatement_id }) => restatement_id)
      .sort(),
  }));
}
