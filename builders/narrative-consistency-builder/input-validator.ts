import type { Artifact } from "../../contracts/artifacts/artifact.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import {
  NARRATIVE_CATEGORIES,
  NARRATIVE_CONSISTENCY_CALIBRATION,
  NARRATIVE_CONSISTENCY_RULE_SET,
  NARRATIVE_SOURCE_ARTIFACT_TYPES,
  SHIFT_MAGNITUDES,
} from "./contract.js";
import type {
  NarrativeConsistencyBuilderInput,
  NarrativeSourceArtifactContent,
} from "./types.js";
import {
  requireAllowed,
  requireNonNegativeInteger,
  requireProbability,
  requireStringArray,
  requireText,
} from "./validation-helpers.js";

export function validateNarrativeBuilderInput(
  input: NarrativeConsistencyBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");

  if (!Array.isArray(input.source_dependencies) || input.source_dependencies.length === 0) {
    throw new BuilderValidationError(
      "Narrative Consistency requires declared source dependencies.",
    );
  }

  const dependencyNames = new Set<string>();
  for (const [index, source] of input.source_dependencies.entries()) {
    requireText(source.dependency_name, `source_dependencies[${index}].dependency_name`);
    requireText(source.period_id, `source_dependencies[${index}].period_id`);
    requireAllowed(
      source.artifact_type,
      NARRATIVE_SOURCE_ARTIFACT_TYPES,
      `source_dependencies[${index}].artifact_type`,
    );

    if (source.absent_reason !== null) {
      requireText(source.absent_reason, `source_dependencies[${index}].absent_reason`);
    }

    if (dependencyNames.has(source.dependency_name)) {
      throw new BuilderValidationError(
        `Duplicate Narrative Consistency dependency ${source.dependency_name}.`,
      );
    }
    dependencyNames.add(source.dependency_name);
  }

  if (
    input.rule_set.rule_set_ref !== NARRATIVE_CONSISTENCY_RULE_SET.ref
    || input.rule_set.rule_version !== NARRATIVE_CONSISTENCY_RULE_SET.version
  ) {
    throw new BuilderValidationError("Narrative Consistency rule set is unsupported.");
  }

  if (
    input.calibration.calibration_ref !== NARRATIVE_CONSISTENCY_CALIBRATION.ref
    || input.calibration.calibration_version !== NARRATIVE_CONSISTENCY_CALIBRATION.version
  ) {
    throw new BuilderValidationError(
      "Narrative Consistency calibration is unsupported.",
    );
  }
}

export function validateNarrativeSourceArtifact(
  artifact: Artifact<NarrativeSourceArtifactContent>,
  dependencyName: string,
): void {
  const content = artifact.content;
  if (
    !Array.isArray(content.priority_observations)
    || !Array.isArray(content.theme_observations)
    || !Array.isArray(content.language_shift_observations)
  ) {
    throw new BuilderDependencyError(
      `Narrative Consistency source ${dependencyName} has invalid observation arrays.`,
    );
  }

  for (const [index, priority] of content.priority_observations.entries()) {
    const field = `${dependencyName}.priority_observations[${index}]`;
    requireText(priority.priority_id, `${field}.priority_id`);
    requireText(priority.concept_ref, `${field}.concept_ref`);
    requireText(priority.description, `${field}.description`);
    requireNonNegativeInteger(priority.mention_count, `${field}.mention_count`);
    requireStringArray(priority.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(priority.confidence, `${field}.confidence`);
  }

  for (const [index, theme] of content.theme_observations.entries()) {
    const field = `${dependencyName}.theme_observations[${index}]`;
    requireText(theme.theme_id, `${field}.theme_id`);
    requireText(theme.concept_ref, `${field}.concept_ref`);
    requireAllowed(theme.narrative_category, NARRATIVE_CATEGORIES, `${field}.narrative_category`);
    requireNonNegativeInteger(theme.mention_count, `${field}.mention_count`);
    requireStringArray(theme.evidence_refs, `${field}.evidence_refs`, false);
    requireProbability(theme.confidence, `${field}.confidence`);
  }

  for (const [index, shift] of content.language_shift_observations.entries()) {
    const field = `${dependencyName}.language_shift_observations[${index}]`;
    requireText(shift.shift_id, `${field}.shift_id`);
    requireText(shift.concept_ref, `${field}.concept_ref`);
    requireText(shift.prior_framing, `${field}.prior_framing`);
    requireText(shift.current_framing, `${field}.current_framing`);
    requireAllowed(shift.shift_magnitude, SHIFT_MAGNITUDES, `${field}.shift_magnitude`);

    if (typeof shift.shift_reason_detected !== "boolean") {
      throw new BuilderValidationError(`${field}.shift_reason_detected must be boolean.`);
    }

    requireStringArray(shift.supporting_evidence, `${field}.supporting_evidence`, false);
    requireProbability(shift.confidence, `${field}.confidence`);
  }
}
