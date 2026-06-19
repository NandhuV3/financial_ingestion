import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  ACCOUNTING_STABILITY_CALIBRATION,
  ACCOUNTING_STABILITY_RULE_SET,
  ACCOUNTING_STABILITY_SCHEMA_VERSION,
  COMPARABILITY_IMPACTS,
  COVERAGE_STATES,
  DEPTH_LEVELS,
  MATERIALITY_LEVELS,
  POLICY_TYPES,
  RESTATEMENT_SCOPES,
  SEGMENT_CHANGE_TYPES,
  TREND_DIRECTIONS,
} from "./contract.js";
import { recomputeOverallConfidence } from "./confidence.js";
import type { AccountingStabilityArtifactContent } from "./types.js";
import {
  requireAllowed,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireProbability,
  requireStringArray,
  requireText,
  sortedUnique,
} from "./validation-helpers.js";

export function validateAccountingContent(
  content: AccountingStabilityArtifactContent,
): void {
  if (content.artifact_type !== "accounting_stability") {
    throw new BuilderValidationError(
      "accounting_stability.artifact_type is invalid.",
    );
  }
  requireText(content.company, "accounting_stability.company");
  requireText(content.period, "accounting_stability.period");

  validateChanges(content);
  validateNonGAAP(content);
  validateRestatements(content);
  validateSummary(content);
  validateCoverageAndDepth(content);
  validateTimeline(content);
  validateConfidence(content);
  validateReplayability(content);
}

function validateChanges(content: AccountingStabilityArtifactContent): void {
  const policyIds = new Set<string>();
  for (const [index, change] of content.policy_changes.entries()) {
    const field = `policy_changes[${index}]`;
    requireText(change.policy_change_id, `${field}.policy_change_id`);
    requireAllowed(change.policy_type, POLICY_TYPES, `${field}.policy_type`);
    requireText(change.prior_policy, `${field}.prior_policy`);
    requireText(change.current_policy, `${field}.current_policy`);
    requireText(change.change_detected_period, `${field}.change_detected_period`);
    if (typeof change.proactively_disclosed !== "boolean") {
      throw new BuilderValidationError(
        `${field}.proactively_disclosed must be boolean.`,
      );
    }
    requireAllowed(
      change.comparability_impact,
      COMPARABILITY_IMPACTS,
      `${field}.comparability_impact`,
    );
    requireStringArray(change.evidence_refs, `${field}.evidence_refs`, false);
    requireStringArray(
      change.source_artifact_refs,
      `${field}.source_artifact_refs`,
      false,
    );
    requireProbability(change.confidence, `${field}.confidence`);
    assertUnique(policyIds, change.policy_change_id, "policy change");
  }

  const segmentIds = new Set<string>();
  for (const [index, change] of content.segment_changes.entries()) {
    const field = `segment_changes[${index}]`;
    requireText(change.segment_change_id, `${field}.segment_change_id`);
    requireText(
      change.change_detected_period,
      `${field}.change_detected_period`,
    );
    requireStringArray(change.prior_segments, `${field}.prior_segments`);
    requireStringArray(change.current_segments, `${field}.current_segments`);
    requireAllowed(
      change.change_type,
      SEGMENT_CHANGE_TYPES,
      `${field}.change_type`,
    );
    if (change.disclosed_reason !== null) {
      requireText(change.disclosed_reason, `${field}.disclosed_reason`);
    }
    requireAllowed(
      change.comparability_impact,
      COMPARABILITY_IMPACTS,
      `${field}.comparability_impact`,
    );
    requireStringArray(change.evidence_refs, `${field}.evidence_refs`, false);
    requireStringArray(
      change.source_artifact_refs,
      `${field}.source_artifact_refs`,
      false,
    );
    requireProbability(change.confidence, `${field}.confidence`);
    assertUnique(segmentIds, change.segment_change_id, "segment change");
  }
}

function validateNonGAAP(content: AccountingStabilityArtifactContent): void {
  const analysis = content.non_gaap_analysis;
  if (analysis === null) {
    if (content.summary.non_gaap_gap_direction !== null) {
      throw new BuilderValidationError(
        "Summary cannot contain a non-GAAP direction without analysis.",
      );
    }
    return;
  }
  if (
    analysis.periods.length
    < ACCOUNTING_STABILITY_CALIBRATION.minimum_history_periods
  ) {
    throw new BuilderValidationError(
      "Non-GAAP analysis requires at least two periods.",
    );
  }
  for (const [index, period] of analysis.periods.entries()) {
    const field = `non_gaap_analysis.periods[${index}]`;
    requireText(period.period, `${field}.period`);
    if (
      !Number.isFinite(period.gaap_value)
      || period.gaap_value === 0
      || !Number.isFinite(period.non_gaap_value)
      || !Number.isFinite(period.gap_percentage)
      || period.gap_percentage < 0
    ) {
      throw new BuilderValidationError(`${field} values are invalid.`);
    }
    requireStringArray(period.exclusion_items, `${field}.exclusion_items`);
    requireStringArray(period.evidence_refs, `${field}.evidence_refs`, false);
    requireText(period.source_artifact_ref, `${field}.source_artifact_ref`);
  }
  requireAllowed(
    analysis.trend_assessment.direction,
    TREND_DIRECTIONS,
    "non_gaap_analysis.trend_assessment.direction",
  );
  requirePositiveInteger(
    analysis.trend_assessment.consecutive_periods,
    "non_gaap_analysis.trend_assessment.consecutive_periods",
  );
  requireAllowed(
    analysis.trend_assessment.materiality,
    MATERIALITY_LEVELS,
    "non_gaap_analysis.trend_assessment.materiality",
  );
  requireProbability(analysis.confidence, "non_gaap_analysis.confidence");

  if (
    analysis.trend_assessment.direction
    !== content.summary.non_gaap_gap_direction
  ) {
    throw new BuilderValidationError(
      "Non-GAAP analysis and summary direction must match.",
    );
  }
}

function validateRestatements(
  content: AccountingStabilityArtifactContent,
): void {
  const ids = new Set<string>();
  for (const [index, record] of content.restatements.entries()) {
    const field = `restatements[${index}]`;
    requireText(record.restatement_id, `${field}.restatement_id`);
    requireText(record.period_announced, `${field}.period_announced`);
    requireStringArray(
      record.periods_affected,
      `${field}.periods_affected`,
      false,
    );
    requireAllowed(record.scope, RESTATEMENT_SCOPES, `${field}.scope`);
    requireText(record.description, `${field}.description`);
    requireAllowed(
      record.materiality,
      MATERIALITY_LEVELS,
      `${field}.materiality`,
    );
    requireStringArray(record.evidence_refs, `${field}.evidence_refs`, false);
    requireStringArray(
      record.source_artifact_refs,
      `${field}.source_artifact_refs`,
      false,
    );
    requireProbability(record.confidence, `${field}.confidence`);
    assertUnique(ids, record.restatement_id, "restatement");
  }
}

function validateSummary(content: AccountingStabilityArtifactContent): void {
  const expected = {
    policy_changes_detected: content.policy_changes.length,
    segment_changes_detected: content.segment_changes.length,
    restatements_detected: content.restatements.length,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (content.summary[field as keyof typeof expected] !== value) {
      throw new BuilderValidationError(`summary.${field} does not reconcile.`);
    }
  }
  if (content.summary.non_gaap_gap_direction !== null) {
    requireAllowed(
      content.summary.non_gaap_gap_direction,
      TREND_DIRECTIONS,
      "summary.non_gaap_gap_direction",
    );
  }
}

function validateCoverageAndDepth(
  content: AccountingStabilityArtifactContent,
): void {
  for (const [field, state] of Object.entries(content.coverage_status)) {
    requireAllowed(state, COVERAGE_STATES, `coverage_status.${field}`);
  }
  const dimensionStates = [
    content.coverage_status.accounting_policies,
    content.coverage_status.segments,
    content.coverage_status.non_gaap,
    content.coverage_status.restatements,
  ];
  const expectedOverall = dimensionStates.every((state) => state === "complete")
    ? "complete"
    : dimensionStates.every((state) => state === "unavailable")
    ? "unavailable"
    : "partial";
  if (
    content.coverage_status.overall !== expectedOverall
    || expectedOverall === "unavailable"
  ) {
    throw new BuilderValidationError("coverage_status.overall is inconsistent.");
  }

  requireAllowed(
    content.depth_indicator.overall,
    DEPTH_LEVELS,
    "depth_indicator.overall",
  );
  requirePositiveInteger(
    content.depth_indicator.period_count,
    "depth_indicator.period_count",
  );
  const expectedDepth =
    content.depth_indicator.period_count
      >= ACCOUNTING_STABILITY_CALIBRATION.full_history_periods
      ? "full"
      : content.depth_indicator.period_count
        >= ACCOUNTING_STABILITY_CALIBRATION.standard_history_periods
      ? "standard"
      : "base";
  if (
    content.depth_indicator.period_count
      < ACCOUNTING_STABILITY_CALIBRATION.minimum_history_periods
    || content.depth_indicator.overall !== expectedDepth
  ) {
    throw new BuilderValidationError("depth_indicator is inconsistent.");
  }
}

function validateTimeline(content: AccountingStabilityArtifactContent): void {
  if (
    content.accounting_timeline.length !== content.depth_indicator.period_count
  ) {
    throw new BuilderValidationError(
      "Accounting timeline and depth period counts must match.",
    );
  }
  const periods = new Set<string>();
  for (const [index, entry] of content.accounting_timeline.entries()) {
    requireText(entry.period, `accounting_timeline[${index}].period`);
    requireStringArray(
      entry.policy_change_refs,
      `accounting_timeline[${index}].policy_change_refs`,
    );
    requireStringArray(
      entry.segment_change_refs,
      `accounting_timeline[${index}].segment_change_refs`,
    );
    requireStringArray(
      entry.restatement_refs,
      `accounting_timeline[${index}].restatement_refs`,
    );
    if (periods.has(entry.period)) {
      throw new BuilderValidationError(
        "Accounting timeline periods must be unique.",
      );
    }
    periods.add(entry.period);
  }
}

function validateConfidence(content: AccountingStabilityArtifactContent): void {
  for (const [field, value] of Object.entries(content.confidence)) {
    requireProbability(value, `confidence.${field}`);
  }
  const expectedOverall = recomputeOverallConfidence({
    extraction_confidence: content.confidence.extraction_confidence,
    policy_detection_confidence:
      content.confidence.policy_detection_confidence,
    segment_detection_confidence:
      content.confidence.segment_detection_confidence,
    historical_depth_score: content.confidence.historical_depth_score,
  });
  if (content.confidence.overall !== expectedOverall) {
    throw new BuilderValidationError("confidence.overall does not reconcile.");
  }
}

function validateReplayability(
  content: AccountingStabilityArtifactContent,
): void {
  const replay = content.replayability_metadata;
  if (
    replay.schema_version !== ACCOUNTING_STABILITY_SCHEMA_VERSION
    || replay.rule_set_ref !== ACCOUNTING_STABILITY_RULE_SET.ref
    || replay.rule_version !== ACCOUNTING_STABILITY_RULE_SET.version
    || replay.calibration_ref !== ACCOUNTING_STABILITY_CALIBRATION.ref
    || replay.calibration_version !== ACCOUNTING_STABILITY_CALIBRATION.version
  ) {
    throw new BuilderValidationError("Replayability versions are invalid.");
  }
  if (
    replay.source_artifact_references.length
    !== replay.source_artifact_versions.length
    || replay.source_artifact_versions.some(
      (version) => !Number.isInteger(version) || version <= 0,
    )
  ) {
    throw new BuilderValidationError(
      "Replayability source references and versions must align.",
    );
  }
  requireStringArray(
    replay.source_artifact_references,
    "replayability.source_artifact_references",
    false,
  );
  requireStringArray(
    replay.evidence_references,
    "replayability.evidence_references",
  );
  requireStringArray(
    replay.accounting_change_references,
    "replayability.accounting_change_references",
  );

  const expectedEvidence = sortedUnique([
    ...content.policy_changes.flatMap(({ evidence_refs }) => evidence_refs),
    ...content.segment_changes.flatMap(({ evidence_refs }) => evidence_refs),
    ...content.non_gaap_analysis?.periods.flatMap(({ evidence_refs }) =>
      evidence_refs) ?? [],
    ...content.restatements.flatMap(({ evidence_refs }) => evidence_refs),
  ]);
  if (!sameStrings(expectedEvidence, replay.evidence_references)) {
    throw new BuilderValidationError(
      "Replayability evidence references do not reconcile.",
    );
  }

  const expectedChanges = sortedUnique([
    ...content.policy_changes.map(({ policy_change_id }) => policy_change_id),
    ...content.segment_changes.map(({ segment_change_id }) => segment_change_id),
    ...content.restatements.map(({ restatement_id }) => restatement_id),
    ...(content.non_gaap_analysis === null ? [] : ["non_gaap_analysis"]),
  ]);
  if (!sameStrings(expectedChanges, replay.accounting_change_references)) {
    throw new BuilderValidationError(
      "Replayability accounting change references do not reconcile.",
    );
  }
}

function assertUnique(ids: Set<string>, id: string, type: string): void {
  if (ids.has(id)) {
    throw new BuilderValidationError(`Duplicate ${type} ${id}.`);
  }
  ids.add(id);
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
