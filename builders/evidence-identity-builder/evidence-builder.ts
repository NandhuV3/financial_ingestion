import { createHash } from "node:crypto";
import type {
  EvidenceCatalogEntry,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  EVIDENCE_IDENTITY_SECTION_ORDER,
  EVIDENCE_REFERENCE_PREFIX,
  type EvidenceSectionName,
} from "./contract.js";

type SectionParagraphs = Record<EvidenceSectionName, string[]>;

const MANAGEMENT_HEADING = /^item 2\b.*management.*discussion.*analysis/i;
const RISK_HEADING = /^item 1a\b.*risk factors?\b/i;

export function buildEvidenceIdentityEntries(
  filing: FilingArtifactContent,
): EvidenceCatalogEntry[] {
  const sections = filingParagraphs(filing.filing_content);

  return EVIDENCE_IDENTITY_SECTION_ORDER.flatMap((sectionName) =>
    sections[sectionName].map((paragraphText, index) =>
      createEvidenceCatalogEntry({
        filingId: filing.filing_id,
        sectionName,
        paragraphIndex: index + 1,
        paragraphText,
      })));
}

export function normalizeEvidenceParagraph(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

export function createEvidenceHash(paragraphText: string): string {
  return createHash("sha256")
    .update(normalizeEvidenceParagraph(paragraphText), "utf8")
    .digest("hex");
}

export function createEvidenceReference(input: {
  filingId: string;
  sectionName: EvidenceSectionName;
  paragraphIndex: number;
  evidenceHash: string;
}): string {
  return `${EVIDENCE_REFERENCE_PREFIX}${stableHash({
    filing_id: input.filingId,
    section_name: input.sectionName,
    paragraph_index: input.paragraphIndex,
    evidence_hash: input.evidenceHash,
  })}`;
}

function createEvidenceCatalogEntry(input: {
  filingId: string;
  sectionName: EvidenceSectionName;
  paragraphIndex: number;
  paragraphText: string;
}): EvidenceCatalogEntry {
  const paragraphText = normalizeEvidenceParagraph(input.paragraphText);
  const evidenceHash = createEvidenceHash(paragraphText);

  return {
    evidence_ref: createEvidenceReference({
      filingId: input.filingId,
      sectionName: input.sectionName,
      paragraphIndex: input.paragraphIndex,
      evidenceHash,
    }),
    evidence_hash: evidenceHash,
    filing_id: input.filingId,
    section_name: input.sectionName,
    paragraph_index: input.paragraphIndex,
    paragraph_text: paragraphText,
  };
}

function filingParagraphs(filingContent: string): SectionParagraphs {
  const paragraphs = filingContent
    .replace(/\r\n?/g, "\n")
    .split(/(?:\n[ \t]*){2,}/)
    .map(normalizeEvidenceParagraph)
    .filter((paragraph) => paragraph.length > 0);
  const sections: SectionParagraphs = {
    management_discussion: [],
    risk_factors: [],
  };
  let currentSection: EvidenceSectionName = "management_discussion";

  for (const paragraph of paragraphs) {
    if (RISK_HEADING.test(paragraph)) {
      currentSection = "risk_factors";
    } else if (
      MANAGEMENT_HEADING.test(paragraph)
      && sections.management_discussion.length === 0
    ) {
      currentSection = "management_discussion";
    }

    sections[currentSection].push(paragraph);
  }

  return sections;
}
