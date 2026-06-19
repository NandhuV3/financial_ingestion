import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  NARRATIVE_CATEGORIES,
  NARRATIVE_CONSISTENCY_CALIBRATION,
  NARRATIVE_CONSISTENCY_RULE_SET,
  NARRATIVE_CONSISTENCY_SCHEMA_VERSION,
  NARRATIVE_TRENDS,
  PRIORITY_STATUSES,
  SHIFT_MAGNITUDES,
} from "./contract.js";
import type {
  NarrativeConsistencyArtifactContent,
  StrategicPriority,
} from "./types.js";
import {
  requireAllowed,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireProbability,
  requireStringArray,
  requireText,
} from "./validation-helpers.js";
import { buildNarrativeConfidence } from "./confidence.js";

export function validateNarrativeContent(
  content: NarrativeConsistencyArtifactContent,
): void {
  if (content.artifact_type !== "narrative_consistency") {
    throw new BuilderValidationError("narrative_consistency.artifact_type is invalid.");
  }
  requireText(content.company, "narrative_consistency.company");
  requireText(content.period, "narrative_consistency.period");

  validatePriorities(content);
  validateThemes(content);
  validateShifts(content);
  validateTimelines(content);
  validateSummary(content);
  validateCoverageAndDepth(content);
  validateConfidence(content);
  validateReplayability(content);
}

function validatePriorities(content: NarrativeConsistencyArtifactContent): void {
  const ids = new Set<string>();

  for (const [index, priority] of content.strategic_priorities.entries()) {
    const field = `strategic_priorities[${index}]`;
    requireText(priority.priority_id, `${field}.priority_id`);
    requireText(priority.concept_ref, `${field}.concept_ref`);
    requireText(priority.description, `${field}.description`);
    requireText(priority.first_seen_period, `${field}.first_seen_period`);
    requireText(priority.last_seen_period, `${field}.last_seen_period`);
    requireNonNegativeInteger(priority.consecutive_periods, `${field}.consecutive_periods`);
    requireAllowed(priority.current_status, PRIORITY_STATUSES, `${field}.current_status`);
    requireStringArray(priority.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(priority.confidence, `${field}.confidence`);

    if (ids.has(priority.priority_id)) {
      throw new BuilderValidationError(`Duplicate priority ${priority.priority_id}.`);
    }
    ids.add(priority.priority_id);
  }
}

function validateThemes(content: NarrativeConsistencyArtifactContent): void {
  for (const [index, theme] of content.narrative_themes.entries()) {
    const field = `narrative_themes[${index}]`;
    requireText(theme.theme_id, `${field}.theme_id`);
    requireText(theme.concept_ref, `${field}.concept_ref`);
    requireAllowed(theme.narrative_category, NARRATIVE_CATEGORIES, `${field}.narrative_category`);
    requireText(theme.first_seen_period, `${field}.first_seen_period`);
    requireNonNegativeInteger(theme.current_period_mentions, `${field}.current_period_mentions`);

    if (!Number.isFinite(theme.historical_average_mentions) || theme.historical_average_mentions < 0) {
      throw new BuilderValidationError(`${field}.historical_average_mentions is invalid.`);
    }

    requireAllowed(theme.trend, NARRATIVE_TRENDS, `${field}.trend`);
    requireStringArray(theme.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(theme.confidence, `${field}.confidence`);
  }
}

function validateShifts(content: NarrativeConsistencyArtifactContent): void {
  for (const [index, shift] of content.language_shifts.entries()) {
    const field = `language_shifts[${index}]`;
    requireText(shift.shift_id, `${field}.shift_id`);
    requireText(shift.concept_ref, `${field}.concept_ref`);
    requireText(shift.prior_framing, `${field}.prior_framing`);
    requireText(shift.current_framing, `${field}.current_framing`);
    requireAllowed(shift.shift_magnitude, SHIFT_MAGNITUDES, `${field}.shift_magnitude`);
    requireStringArray(shift.supporting_evidence, `${field}.supporting_evidence`, false);
    requireProbability(shift.confidence, `${field}.confidence`);
  }
}

function validateTimelines(content: NarrativeConsistencyArtifactContent): void {
  const priorities = new Map(
    content.strategic_priorities.map((priority) => [priority.priority_id, priority]),
  );

  for (const timeline of content.priority_timelines) {
    const priority = priorities.get(timeline.priority_id);
    if (priority === undefined || timeline.periods.length === 0) {
      throw new BuilderValidationError("Priority timeline must reference a priority.");
    }

    const seenPeriods = new Set<string>();
    for (const [index, event] of timeline.periods.entries()) {
      requireText(event.period, `priority_timelines.${timeline.priority_id}[${index}].period`);
      requireAllowed(
        event.status,
        PRIORITY_STATUSES,
        `priority_timelines.${timeline.priority_id}[${index}].status`,
      );
      requireNonNegativeInteger(
        event.mention_count,
        `priority_timelines.${timeline.priority_id}[${index}].mention_count`,
      );
      requireStringArray(
        event.evidence_refs,
        `priority_timelines.${timeline.priority_id}[${index}].evidence_refs`,
        false,
      );

      if (seenPeriods.has(event.period)) {
        throw new BuilderValidationError("Priority timeline periods must be unique.");
      }
      seenPeriods.add(event.period);
    }

    const latest = [...timeline.periods].sort(
      (left, right) => left.period.localeCompare(right.period),
    ).at(-1)!;

    if (latest.status !== priority.current_status) {
      throw new BuilderValidationError("Priority timeline status must match priority.");
    }
  }
}

function validateSummary(content: NarrativeConsistencyArtifactContent): void {
  const expected = summaryFrom(content.strategic_priorities, content);
  const actual = content.summary;

  for (const field of [
    "active_priorities",
    "new_priorities",
    "dropped_priorities",
    "significant_language_shifts",
    "stable_priority_ratio",
  ] as const) {
    if (actual[field] !== expected[field]) {
      throw new BuilderValidationError(`summary.${field} does not reconcile.`);
    }
  }
}

function summaryFrom(
  priorities: StrategicPriority[],
  content: NarrativeConsistencyArtifactContent,
): NarrativeConsistencyArtifactContent["summary"] {
  const persistent = priorities.filter((priority) => priority.current_status === "persistent").length;

  return {
    active_priorities: priorities.filter((priority) =>
      ["active", "persistent", "declining", "reintroduced"].includes(priority.current_status)).length,
    new_priorities: priorities.filter((priority) => priority.current_status === "new").length,
    dropped_priorities: priorities.filter((priority) => priority.current_status === "dropped").length,
    significant_language_shifts: content.language_shifts.filter(
      (shift) => shift.shift_magnitude === "significant",
    ).length,
    stable_priority_ratio: priorities.length === 0 ? 0 : persistent / priorities.length,
  };
}

function validateCoverageAndDepth(content: NarrativeConsistencyArtifactContent): void {
  if (!["complete", "partial"].includes(content.coverage_status.status)) {
    throw new BuilderValidationError("coverage_status.status is invalid.");
  }

  if (
    content.coverage_status.status === "complete"
    && content.coverage_status.missing_periods.length > 0
  ) {
    throw new BuilderValidationError("Complete coverage cannot contain missing periods.");
  }

  if (
    content.coverage_status.status === "partial"
    && content.coverage_status.missing_periods.length === 0
  ) {
    throw new BuilderValidationError("Partial coverage requires missing periods.");
  }

  for (const [index, missing] of content.coverage_status.missing_periods.entries()) {
    requireText(missing.period_id, `coverage_status.missing_periods[${index}].period_id`);
    requireText(missing.absent_reason, `coverage_status.missing_periods[${index}].absent_reason`);
  }

  requirePositiveInteger(content.coverage_status.available_periods, "coverage_status.available_periods");

  if (content.coverage_status.available_periods !== content.depth_indicator.historical_periods_available) {
    throw new BuilderValidationError("Coverage and depth period counts must match.");
  }

  if (
    content.depth_indicator.minimum_history_available
    !== (content.depth_indicator.historical_periods_available >= 2)
  ) {
    throw new BuilderValidationError("Minimum history indicator is inconsistent.");
  }

  if (
    content.depth_indicator.preferred_history_available
    !== (
      content.depth_indicator.historical_periods_available
      >= NARRATIVE_CONSISTENCY_CALIBRATION.preferred_history_periods
    )
  ) {
    throw new BuilderValidationError("Preferred history indicator is inconsistent.");
  }
}

function validateConfidence(content: NarrativeConsistencyArtifactContent): void {
  for (const [field, value] of Object.entries(content.confidence)) {
    requireProbability(value, `confidence.${field}`);
  }

  const expected = buildNarrativeConfidence({
    priorities: content.strategic_priorities,
    themes: content.narrative_themes,
    shifts: content.language_shifts,
    depth: content.depth_indicator,
  });

  for (const field of Object.keys(expected) as Array<keyof typeof expected>) {
    if (content.confidence[field] !== expected[field]) {
      throw new BuilderValidationError(`confidence.${field} does not reconcile.`);
    }
  }
}

function validateReplayability(content: NarrativeConsistencyArtifactContent): void {
  const replay = content.replayability_metadata;

  if (
    replay.schema_version !== NARRATIVE_CONSISTENCY_SCHEMA_VERSION
    || replay.rule_set_ref !== NARRATIVE_CONSISTENCY_RULE_SET.ref
    || replay.rule_version !== NARRATIVE_CONSISTENCY_RULE_SET.version
    || replay.calibration_ref !== NARRATIVE_CONSISTENCY_CALIBRATION.ref
    || replay.calibration_version !== NARRATIVE_CONSISTENCY_CALIBRATION.version
  ) {
    throw new BuilderValidationError("Replayability versions are invalid.");
  }

  if (replay.source_artifact_references.length !== replay.source_artifact_versions.length) {
    throw new BuilderValidationError("Replayability source references and versions must align.");
  }

  if (
    replay.source_artifact_versions.some(
      (version) => !Number.isInteger(version) || version <= 0,
    )
  ) {
    throw new BuilderValidationError("Replayability source versions are invalid.");
  }

  requireStringArray(replay.source_artifact_references, "replayability.source_artifact_references", false);
  requireStringArray(replay.evidence_references, "replayability.evidence_references");
  requireStringArray(replay.priority_history_references, "replayability.priority_history_references");

  if (
    (replay.prior_narrative_consistency_ref === null)
    !== (replay.prior_narrative_consistency_version === null)
  ) {
    throw new BuilderValidationError("Prior replayability reference and version must align.");
  }

  const expectedHistoryReferences = [...new Set(
    content.priority_timelines.flatMap((timeline) =>
      timeline.periods.map((period) =>
        `${timeline.priority_id}:${period.period}:${period.status}`)),
  )].sort();
  const actualHistoryReferences = [...new Set(
    replay.priority_history_references,
  )].sort();

  if (
    expectedHistoryReferences.length !== actualHistoryReferences.length
    || expectedHistoryReferences.some(
      (value, index) => value !== actualHistoryReferences[index],
    )
  ) {
    throw new BuilderValidationError(
      "Replayability priority history references do not reconcile.",
    );
  }

  const expectedEvidenceReferences = [...new Set([
    ...content.strategic_priorities.flatMap((priority) => priority.evidence_refs),
    ...content.narrative_themes.flatMap((theme) => theme.evidence_refs),
    ...content.language_shifts.flatMap((shift) => shift.supporting_evidence),
    ...content.priority_timelines.flatMap((timeline) =>
      timeline.periods.flatMap((period) => period.evidence_refs)),
  ])].sort();
  const actualEvidenceReferences = [...new Set(replay.evidence_references)].sort();

  if (
    expectedEvidenceReferences.length !== actualEvidenceReferences.length
    || expectedEvidenceReferences.some(
      (value, index) => value !== actualEvidenceReferences[index],
    )
  ) {
    throw new BuilderValidationError(
      "Replayability evidence references do not reconcile.",
    );
  }
}
