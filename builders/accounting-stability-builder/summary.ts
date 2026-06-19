import type {
  AccountingSummary,
  NonGAAPAnalysis,
  PolicyChange,
  RestatementRecord,
  SegmentChange,
} from "./types.js";

export function buildAccountingSummary(input: {
  policyChanges: PolicyChange[];
  segmentChanges: SegmentChange[];
  restatements: RestatementRecord[];
  nonGaapAnalysis: NonGAAPAnalysis | null;
}): AccountingSummary {
  return {
    policy_changes_detected: input.policyChanges.length,
    segment_changes_detected: input.segmentChanges.length,
    restatements_detected: input.restatements.length,
    non_gaap_gap_direction:
      input.nonGaapAnalysis?.trend_assessment.direction ?? null,
  };
}

