import type {
  GroundingEvidenceEntry,
  GroundingSection,
  ThemeGroundingContent,
} from "../../contracts/execution/theme-grounding-content.js";
import type {
  ThemesExecutionReadinessContent,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  THEME_GROUNDING_READINESS_RESULT_PREFIX,
  THEME_GROUNDING_VERSION,
} from "./contract.js";

export function assembleThemeGroundingContent(
  readiness: ThemesExecutionReadinessContent,
): ThemeGroundingContent {
  const readinessResultId = createReadinessResultId(readiness);
  const orderedEvidence = copyGroundingEvidence(
    readiness.validated_evidence,
  );
  const sectionHierarchy = copySectionHierarchy(
    readiness.validated_section_hierarchy,
  );

  return {
    readiness_result_id: readinessResultId,
    filing_id: readiness.filing_id,
    filing_hash: readiness.filing_hash,
    grounding_version: THEME_GROUNDING_VERSION,
    grounding_scope: {
      evidence_entry_count: orderedEvidence.length,
      section_names: sectionHierarchy.map(({ section_name }) => section_name),
    },
    ordered_evidence: orderedEvidence,
    section_hierarchy: sectionHierarchy,
    grounding_metadata: {
      source_readiness_result_id: readinessResultId,
      source_evidence_identity_artifact_id:
        readiness.evidence_identity_artifact_id,
      generated_from_readiness_status: "ready",
    },
  };
}

export function createReadinessResultId(
  readiness: ThemesExecutionReadinessContent,
): string {
  return `${THEME_GROUNDING_READINESS_RESULT_PREFIX}${stableHash(readiness)}`;
}

function copyGroundingEvidence(
  evidence: ThemesExecutionReadinessContent["validated_evidence"],
): GroundingEvidenceEntry[] {
  return evidence.map((entry) => ({
    evidence_ref: entry.evidence_ref,
    evidence_hash: entry.evidence_hash,
    section_name: entry.section_name,
    paragraph_index: entry.paragraph_index,
    paragraph_text: entry.paragraph_text,
  }));
}

function copySectionHierarchy(
  sections: ThemesExecutionReadinessContent["validated_section_hierarchy"],
): GroundingSection[] {
  return sections.map((section) => ({
    section_name: section.section_name,
    evidence_refs: [...section.evidence_refs],
  }));
}
