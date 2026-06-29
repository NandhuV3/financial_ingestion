import type {
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type {
  ThemeInputBoundaryContent,
} from "../../contracts/execution/theme-input-boundary-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  assembleThemeInputBoundaryContent,
  createGroundingResultId,
} from "./input-assembler.js";
import type { ThemeInputBoundaryBuilderInput } from "./types.js";

export function validateThemeInputBoundaryBuilderInput(
  input: ThemeInputBoundaryBuilderInput,
): void {
  if (!input || typeof input !== "object") {
    throw new BuilderValidationError(
      "theme_grounding must be provided.",
    );
  }

  validateGroundingInput(input.theme_grounding);
}

export function validateThemeInputBoundaryContent(input: {
  grounding: ThemeGroundingContent;
  content: ThemeInputBoundaryContent;
}): void {
  const expected = assembleThemeInputBoundaryContent(input.grounding);

  if (stableHash(input.content) !== stableHash(expected)) {
    throw new BuilderValidationError(
      "Theme Input Boundary content does not reconcile with deterministic assembly.",
    );
  }

  for (const [index, entry] of input.content.visible_evidence.entries()) {
    const field = `visible_evidence[${index}]`;

    if ("evidence_hash" in entry) {
      throw new BuilderValidationError(
        `${field}.evidence_hash must not be visible.`,
      );
    }
  }
}

function validateGroundingInput(
  grounding: ThemeGroundingContent | undefined,
): void {
  if (!grounding || typeof grounding !== "object") {
    throw new BuilderValidationError(
      "theme_grounding must be a Theme Grounding result.",
    );
  }

  requireText(grounding.readiness_result_id, "theme_grounding.readiness_result_id");
  requireText(grounding.filing_id, "theme_grounding.filing_id");
  requireText(grounding.filing_hash, "theme_grounding.filing_hash");
  requireText(grounding.grounding_version, "theme_grounding.grounding_version");

  if (!Array.isArray(grounding.ordered_evidence)) {
    throw new BuilderValidationError(
      "theme_grounding.ordered_evidence must be an array.",
    );
  }

  if (!Array.isArray(grounding.section_hierarchy)) {
    throw new BuilderValidationError(
      "theme_grounding.section_hierarchy must be an array.",
    );
  }

  if (grounding.ordered_evidence.length === 0) {
    throw new BuilderValidationError(
      "Theme Input Boundary requires grounding evidence.",
    );
  }

  validateGroundingEvidence(grounding);
  validateGroundingSectionHierarchy(grounding);
  validateGroundingScope(grounding);
  validateGroundingMetadata(grounding);

  if (createGroundingResultId(grounding).trim() === "") {
    throw new BuilderValidationError(
      "theme_grounding result id must be deterministic.",
    );
  }
}

function validateGroundingEvidence(grounding: ThemeGroundingContent): void {
  for (const [index, entry] of grounding.ordered_evidence.entries()) {
    const field = `theme_grounding.ordered_evidence[${index}]`;
    requireText(entry.evidence_ref, `${field}.evidence_ref`);
    requireText(entry.evidence_hash, `${field}.evidence_hash`);
    requireText(entry.section_name, `${field}.section_name`);
    requireText(entry.paragraph_text, `${field}.paragraph_text`);

    if (!Number.isInteger(entry.paragraph_index) || entry.paragraph_index < 1) {
      throw new BuilderValidationError(
        `${field}.paragraph_index must be a positive integer.`,
      );
    }
  }
}

function validateGroundingSectionHierarchy(
  grounding: ThemeGroundingContent,
): void {
  const orderedEvidenceRefs = grounding.ordered_evidence
    .map(({ evidence_ref }) => evidence_ref);
  const visibleHierarchyRefs = grounding.section_hierarchy
    .flatMap(({ evidence_refs }) => evidence_refs);

  for (const [index, section] of grounding.section_hierarchy.entries()) {
    const field = `theme_grounding.section_hierarchy[${index}]`;
    requireText(section.section_name, `${field}.section_name`);

    if (!Array.isArray(section.evidence_refs)) {
      throw new BuilderValidationError(
        `${field}.evidence_refs must be an array.`,
      );
    }

    for (const evidenceRef of section.evidence_refs) {
      if (!orderedEvidenceRefs.includes(evidenceRef)) {
        throw new BuilderValidationError(
          `${field}.evidence_refs contains an unsupported evidence_ref.`,
        );
      }
    }
  }

  if (stableHash(visibleHierarchyRefs) !== stableHash(orderedEvidenceRefs)) {
    throw new BuilderValidationError(
      "Theme Grounding section hierarchy does not reconcile with ordered evidence.",
    );
  }
}

function validateGroundingScope(grounding: ThemeGroundingContent): void {
  if (!grounding.grounding_scope || typeof grounding.grounding_scope !== "object") {
    throw new BuilderValidationError(
      "theme_grounding.grounding_scope must be present.",
    );
  }

  if (
    grounding.grounding_scope.evidence_entry_count
      !== grounding.ordered_evidence.length
  ) {
    throw new BuilderValidationError(
      "theme_grounding.grounding_scope.evidence_entry_count does not reconcile.",
    );
  }

  const sectionNames = grounding.section_hierarchy
    .map(({ section_name }) => section_name);

  if (
    stableHash(grounding.grounding_scope.section_names)
      !== stableHash(sectionNames)
  ) {
    throw new BuilderValidationError(
      "theme_grounding.grounding_scope.section_names does not reconcile.",
    );
  }
}

function validateGroundingMetadata(grounding: ThemeGroundingContent): void {
  if (
    !grounding.grounding_metadata
    || typeof grounding.grounding_metadata !== "object"
  ) {
    throw new BuilderValidationError(
      "theme_grounding.grounding_metadata must be present.",
    );
  }

  if (
    grounding.grounding_metadata.source_readiness_result_id
      !== grounding.readiness_result_id
  ) {
    throw new BuilderValidationError(
      "theme_grounding.grounding_metadata.source_readiness_result_id does not reconcile.",
    );
  }

  requireText(
    grounding.grounding_metadata.source_evidence_identity_artifact_id,
    "theme_grounding.grounding_metadata.source_evidence_identity_artifact_id",
  );

  if (
    grounding.grounding_metadata.generated_from_readiness_status !== "ready"
  ) {
    throw new BuilderValidationError(
      "theme_grounding.grounding_metadata.generated_from_readiness_status must be ready.",
    );
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(
      `${field} must be a non-empty string.`,
    );
  }
}
