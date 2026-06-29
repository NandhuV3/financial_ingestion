import type {
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type {
  ThemeInputBoundaryContent,
  ThemeVisibleEvidenceEntry,
  ThemeVisibleSection,
} from "../../contracts/execution/theme-input-boundary-content.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  THEME_INPUT_BOUNDARY_GROUNDING_RESULT_PREFIX,
  THEME_INPUT_BOUNDARY_VERSION,
} from "./contract.js";

export function assembleThemeInputBoundaryContent(
  grounding: ThemeGroundingContent,
): ThemeInputBoundaryContent {
  const groundingResultId = createGroundingResultId(grounding);
  const visibleEvidence = copyVisibleEvidence(grounding);
  const visibleSectionHierarchy = copyVisibleSectionHierarchy(grounding);

  return {
    grounding_result_id: groundingResultId,
    filing_id: grounding.filing_id,
    filing_hash: grounding.filing_hash,
    input_version: THEME_INPUT_BOUNDARY_VERSION,
    visible_evidence: visibleEvidence,
    visible_section_hierarchy: visibleSectionHierarchy,
    permitted_metadata: {
      source_grounding_result_id: groundingResultId,
      visible_evidence_count: visibleEvidence.length,
      visible_section_names: visibleSectionHierarchy
        .map(({ section_name }) => section_name),
    },
  };
}

export function createGroundingResultId(
  grounding: ThemeGroundingContent,
): string {
  return `${THEME_INPUT_BOUNDARY_GROUNDING_RESULT_PREFIX}${stableHash(grounding)}`;
}

function copyVisibleEvidence(
  grounding: ThemeGroundingContent,
): ThemeVisibleEvidenceEntry[] {
  return grounding.ordered_evidence.map((entry) => ({
    evidence_ref: entry.evidence_ref,
    section_name: entry.section_name,
    paragraph_index: entry.paragraph_index,
    paragraph_text: entry.paragraph_text,
  }));
}

function copyVisibleSectionHierarchy(
  grounding: ThemeGroundingContent,
): ThemeVisibleSection[] {
  return grounding.section_hierarchy.map((section) => ({
    section_name: section.section_name,
    evidence_refs: [...section.evidence_refs],
  }));
}
