import { NARRATIVE_CONSISTENCY_SCHEMA_VERSION } from "./contract.js";
import type {
  NarrativeBuildDependencies,
  NarrativeConsistencyBuilderInput,
  NarrativeConsistencyReplayabilityMetadata,
  LanguageShift,
  NarrativeTheme,
  PriorityTimeline,
  StrategicPriority,
} from "./types.js";

export function buildNarrativeReplayability(input: {
  builderInput: NarrativeConsistencyBuilderInput;
  dependencies: NarrativeBuildDependencies;
  priorities: StrategicPriority[];
  themes: NarrativeTheme[];
  shifts: LanguageShift[];
  timelines: PriorityTimeline[];
}): NarrativeConsistencyReplayabilityMetadata {
  const sourcePairs = [...new Map(input.dependencies.sources.map(({ artifact }) => {
    const pair = {
      ref: artifact.identity.artifact_id,
      version: artifact.identity.version,
    };
    return [`${pair.ref}:${pair.version}`, pair] as const;
  })).values()].sort(
    (left, right) => left.ref.localeCompare(right.ref) || left.version - right.version,
  );
  const evidence = [
    ...input.priorities.flatMap((item) => item.evidence_refs),
    ...input.themes.flatMap((item) => item.evidence_refs),
    ...input.shifts.flatMap((item) => item.supporting_evidence),
    ...input.timelines.flatMap((timeline) =>
      timeline.periods.flatMap((period) => period.evidence_refs)),
  ];

  return {
    schema_version: NARRATIVE_CONSISTENCY_SCHEMA_VERSION,
    source_artifact_references: sourcePairs.map(({ ref }) => ref),
    source_artifact_versions: sourcePairs.map(({ version }) => version),
    evidence_references: sortedUnique(evidence),
    priority_history_references: sortedUnique(
      input.timelines.flatMap((timeline) =>
        timeline.periods.map((period) =>
          `${timeline.priority_id}:${period.period}:${period.status}`)),
    ),
    prior_narrative_consistency_ref:
      input.dependencies.prior?.identity.artifact_id ?? null,
    prior_narrative_consistency_version:
      input.dependencies.prior?.identity.version ?? null,
    rule_set_ref: input.builderInput.rule_set.rule_set_ref,
    rule_version: input.builderInput.rule_set.rule_version,
    calibration_ref: input.builderInput.calibration.calibration_ref,
    calibration_version: input.builderInput.calibration.calibration_version,
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
