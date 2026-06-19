import { ACCOUNTING_STABILITY_SCHEMA_VERSION } from "./contract.js";
import type {
  AccountingBuildDependencies,
  AccountingStabilityBuilderInput,
  AccountingStabilityReplayabilityMetadata,
  NonGAAPAnalysis,
  PolicyChange,
  RestatementRecord,
  SegmentChange,
} from "./types.js";
import { sortedUnique } from "./validation-helpers.js";

export function buildAccountingReplayability(input: {
  builderInput: AccountingStabilityBuilderInput;
  dependencies: AccountingBuildDependencies;
  policyChanges: PolicyChange[];
  segmentChanges: SegmentChange[];
  nonGaapAnalysis: NonGAAPAnalysis | null;
  restatements: RestatementRecord[];
}): AccountingStabilityReplayabilityMetadata {
  const sourcePairs = input.dependencies.sources.map(({ artifact }) => ({
    ref: artifact.identity.artifact_id,
    version: artifact.identity.version,
  })).sort(
    (left, right) =>
      left.ref.localeCompare(right.ref) || left.version - right.version,
  );

  return {
    schema_version: ACCOUNTING_STABILITY_SCHEMA_VERSION,
    source_artifact_references: sourcePairs.map(({ ref }) => ref),
    source_artifact_versions: sourcePairs.map(({ version }) => version),
    evidence_references: sortedUnique([
      ...input.policyChanges.flatMap(({ evidence_refs }) => evidence_refs),
      ...input.segmentChanges.flatMap(({ evidence_refs }) => evidence_refs),
      ...input.nonGaapAnalysis?.periods.flatMap(({ evidence_refs }) =>
        evidence_refs) ?? [],
      ...input.restatements.flatMap(({ evidence_refs }) => evidence_refs),
    ]),
    accounting_change_references: sortedUnique([
      ...input.policyChanges.map(({ policy_change_id }) => policy_change_id),
      ...input.segmentChanges.map(({ segment_change_id }) => segment_change_id),
      ...input.restatements.map(({ restatement_id }) => restatement_id),
      ...(input.nonGaapAnalysis === null ? [] : ["non_gaap_analysis"]),
    ]),
    rule_set_ref: input.builderInput.rule_set.rule_set_ref,
    rule_version: input.builderInput.rule_set.rule_version,
    calibration_ref: input.builderInput.calibration.calibration_ref,
    calibration_version: input.builderInput.calibration.calibration_version,
  };
}
