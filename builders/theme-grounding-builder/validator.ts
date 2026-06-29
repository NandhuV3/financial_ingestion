import type {
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type {
  ThemesExecutionReadinessContent,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  assembleThemeGroundingContent,
  createReadinessResultId,
} from "./grounding-assembler.js";
import type { ThemeGroundingBuilderInput } from "./types.js";

export function validateThemeGroundingBuilderInput(
  input: ThemeGroundingBuilderInput,
): void {
  if (!input || typeof input !== "object") {
    throw new BuilderValidationError(
      "themes_execution_readiness must be provided.",
    );
  }

  validateReadinessInput(input.themes_execution_readiness);
}

export function validateThemeGroundingContent(input: {
  readiness: ThemesExecutionReadinessContent;
  content: ThemeGroundingContent;
}): void {
  const expected = assembleThemeGroundingContent(input.readiness);

  if (stableHash(input.content) !== stableHash(expected)) {
    throw new BuilderValidationError(
      "Theme Grounding content does not reconcile with deterministic assembly.",
    );
  }
}

function validateReadinessInput(
  readiness: ThemesExecutionReadinessContent | undefined,
): void {
  if (!readiness || typeof readiness !== "object") {
    throw new BuilderValidationError(
      "themes_execution_readiness must be a Themes Execution Readiness result.",
    );
  }

  requireText(
    readiness.evidence_identity_artifact_id,
    "themes_execution_readiness.evidence_identity_artifact_id",
  );
  requireText(readiness.filing_id, "themes_execution_readiness.filing_id");
  requireText(readiness.filing_hash, "themes_execution_readiness.filing_hash");

  if (readiness.readiness_status !== "ready") {
    throw new BuilderValidationError(
      "Theme Grounding requires a ready Themes Execution Readiness result.",
    );
  }

  if (!Array.isArray(readiness.validated_evidence)) {
    throw new BuilderValidationError(
      "themes_execution_readiness.validated_evidence must be an array.",
    );
  }

  if (!Array.isArray(readiness.validated_section_hierarchy)) {
    throw new BuilderValidationError(
      "themes_execution_readiness.validated_section_hierarchy must be an array.",
    );
  }

  if (readiness.validated_evidence.length === 0) {
    throw new BuilderValidationError(
      "Theme Grounding requires validated evidence.",
    );
  }

  validateReadinessEvidence(readiness);
  validateReadinessSectionHierarchy(readiness);

  if (createReadinessResultId(readiness).trim() === "") {
    throw new BuilderValidationError(
      "themes_execution_readiness result id must be deterministic.",
    );
  }
}

function validateReadinessEvidence(
  readiness: ThemesExecutionReadinessContent,
): void {
  for (const [index, entry] of readiness.validated_evidence.entries()) {
    const field = `themes_execution_readiness.validated_evidence[${index}]`;
    requireText(entry.evidence_ref, `${field}.evidence_ref`);
    requireText(entry.evidence_hash, `${field}.evidence_hash`);
    requireText(entry.filing_id, `${field}.filing_id`);
    requireText(entry.section_name, `${field}.section_name`);
    requireText(entry.paragraph_text, `${field}.paragraph_text`);

    if (entry.filing_id !== readiness.filing_id) {
      throw new BuilderValidationError(
        `${field}.filing_id does not reconcile with readiness filing_id.`,
      );
    }

    if (!Number.isInteger(entry.paragraph_index) || entry.paragraph_index < 1) {
      throw new BuilderValidationError(
        `${field}.paragraph_index must be a positive integer.`,
      );
    }
  }
}

function validateReadinessSectionHierarchy(
  readiness: ThemesExecutionReadinessContent,
): void {
  const validatedEvidenceRefs = new Set(
    readiness.validated_evidence.map(({ evidence_ref }) => evidence_ref),
  );
  const hierarchyRefs = readiness.validated_section_hierarchy
    .flatMap(({ evidence_refs }) => evidence_refs);

  for (
    const [index, section] of readiness.validated_section_hierarchy.entries()
  ) {
    const field = `themes_execution_readiness.validated_section_hierarchy[${index}]`;
    requireText(section.section_name, `${field}.section_name`);

    if (!Array.isArray(section.evidence_refs)) {
      throw new BuilderValidationError(
        `${field}.evidence_refs must be an array.`,
      );
    }

    for (const evidenceRef of section.evidence_refs) {
      if (!validatedEvidenceRefs.has(evidenceRef)) {
        throw new BuilderValidationError(
          `${field}.evidence_refs contains an unsupported evidence_ref.`,
        );
      }
    }
  }

  if (
    stableHash(hierarchyRefs) !== stableHash([...validatedEvidenceRefs])
  ) {
    throw new BuilderValidationError(
      "Themes Execution Readiness section hierarchy does not reconcile with validated evidence.",
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
