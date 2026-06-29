import type {
  EvidenceCatalogEntry,
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type {
  ThemesExecutionReadinessContent,
  ThemesQualityFinding,
  ThemesQualityMetrics,
  ThemesReadinessSection,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import {
  EVIDENCE_IDENTITY_SECTION_ORDER,
  type EvidenceSectionName,
} from "../evidence-identity-builder/contract.js";
import {
  createEvidenceHash,
  createEvidenceReference,
  normalizeEvidenceParagraph,
} from "../evidence-identity-builder/evidence-builder.js";
import {
  THEMES_QUALITY_FINDING_CODES,
  THEMES_QUALITY_CONTRACT_VERSION,
} from "./contract.js";

type ReadinessEvaluationInput = {
  evidenceIdentityArtifactId: string;
  evidenceIdentity: EvidenceIdentityContent;
};

type FindingInput = {
  code: string;
  message: string;
  evidenceRef?: string;
};

export function evaluateThemesExecutionReadiness(
  input: ReadinessEvaluationInput,
): ThemesExecutionReadinessContent {
  const findings: ThemesQualityFinding[] = [];
  const entries = input.evidenceIdentity.entries;
  const metrics = calculateMetrics(entries);

  collectReadinessFindings({
    entries,
    filingId: input.evidenceIdentity.filing_id,
    findings,
  });

  const readinessStatus = findings.some(
    ({ severity }) => severity === "blocking",
  )
    ? "not_ready"
    : "ready";

  return {
    evidence_identity_artifact_id: input.evidenceIdentityArtifactId,
    filing_id: input.evidenceIdentity.filing_id,
    filing_hash: input.evidenceIdentity.filing_hash,
    readiness_status: readinessStatus,
    validated_evidence: readinessStatus === "ready"
      ? cloneEntries(entries)
      : [],
    validated_section_hierarchy: readinessStatus === "ready"
      ? buildSectionHierarchy(entries)
      : [],
    findings,
    metrics,
  };
}

export function calculateThemesQualityMetrics(
  entries: EvidenceCatalogEntry[],
): ThemesQualityMetrics {
  return calculateMetrics(entries);
}

export function buildThemesReadinessSectionHierarchy(
  entries: EvidenceCatalogEntry[],
): ThemesReadinessSection[] {
  return buildSectionHierarchy(entries);
}

function collectReadinessFindings(input: {
  entries: EvidenceCatalogEntry[];
  filingId: string;
  findings: ThemesQualityFinding[];
}): void {
  if (input.entries.length === 0) {
    input.findings.push(createBlockingFinding({
      code: THEMES_QUALITY_FINDING_CODES.EMPTY_EVIDENCE_CATALOG,
      message: "Evidence Identity contains no evidence entries.",
    }));
  }

  const referenceCounts = countReferences(input.entries);
  const representedSections = new Set<string>();
  const nextParagraphIndex = new Map<EvidenceSectionName, number>(
    EVIDENCE_IDENTITY_SECTION_ORDER.map((section) => [section, 1]),
  );
  let priorSectionIndex = -1;

  for (const [index, entry] of input.entries.entries()) {
    const field = `entries[${index}]`;

    collectRequiredFieldFindings(entry, field, input.findings);

    if (isAllowedSection(entry.section_name)) {
      representedSections.add(entry.section_name);
    }

    const duplicateReferenceCount = referenceCounts.get(entry.evidence_ref) ?? 0;
    if (duplicateReferenceCount > 1 && isFirstReferenceOccurrence(
      input.entries,
      index,
      entry.evidence_ref,
    )) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.DUPLICATE_EVIDENCE_REFERENCE,
        message: `Duplicate evidence_ref: ${entry.evidence_ref}.`,
        evidenceRef: entry.evidence_ref,
      }));
    }

    if (entry.filing_id !== input.filingId) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.MISSING_REQUIRED_FIELD,
        message: `${field}.filing_id does not reconcile with content.filing_id.`,
        evidenceRef: entry.evidence_ref,
      }));
    }

    if (!isAllowedSection(entry.section_name)) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.MISSING_REQUIRED_FIELD,
        message: `${field}.section_name is invalid.`,
        evidenceRef: entry.evidence_ref,
      }));
      continue;
    }

    const sectionName = entry.section_name;
    const sectionIndex = EVIDENCE_IDENTITY_SECTION_ORDER.indexOf(sectionName);
    const expectedParagraphIndex = nextParagraphIndex.get(sectionName);

    if (
      sectionIndex < priorSectionIndex
      || entry.paragraph_index !== expectedParagraphIndex
    ) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.INVALID_EVIDENCE_ORDERING,
        message: "Evidence ordering does not reconcile with deterministic ordering.",
        evidenceRef: entry.evidence_ref,
      }));
    }

    priorSectionIndex = Math.max(priorSectionIndex, sectionIndex);
    nextParagraphIndex.set(sectionName, entry.paragraph_index + 1);

    const normalizedParagraph = normalizeEvidenceParagraph(
      entry.paragraph_text,
    );
    const expectedHash = createEvidenceHash(normalizedParagraph);
    const expectedReference = createEvidenceReference({
      filingId: entry.filing_id,
      sectionName,
      paragraphIndex: entry.paragraph_index,
      evidenceHash: expectedHash,
    });

    if (
      entry.paragraph_text !== normalizedParagraph
      || entry.evidence_hash !== expectedHash
    ) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.INVALID_EVIDENCE_HASH,
        message: `${field}.evidence_hash does not reconcile with paragraph_text.`,
        evidenceRef: entry.evidence_ref,
      }));
    }

    if (entry.evidence_ref !== expectedReference) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.INVALID_EVIDENCE_REFERENCE,
        message: `${field}.evidence_ref does not reconcile.`,
        evidenceRef: entry.evidence_ref,
      }));
    }
  }

  for (const sectionName of EVIDENCE_IDENTITY_SECTION_ORDER) {
    if (!representedSections.has(sectionName)) {
      input.findings.push(createBlockingFinding({
        code: THEMES_QUALITY_FINDING_CODES.MISSING_SECTION_COVERAGE,
        message: `Missing required evidence section: ${sectionName}.`,
      }));
    }
  }

  input.findings.sort((left, right) =>
    `${left.code}:${left.evidence_ref ?? ""}:${left.message}`
      .localeCompare(`${right.code}:${right.evidence_ref ?? ""}:${right.message}`),
  );
  input.findings.splice(
    0,
    input.findings.length,
    ...input.findings.map((finding, index) => ({
      ...finding,
      finding_id: `${THEMES_QUALITY_CONTRACT_VERSION}:${String(index + 1).padStart(4, "0")}`,
    })),
  );
}

function calculateMetrics(entries: EvidenceCatalogEntry[]): ThemesQualityMetrics {
  const sectionDistribution = Object.fromEntries(
    EVIDENCE_IDENTITY_SECTION_ORDER.map((sectionName) => [
      sectionName,
      entries.filter((entry) => entry.section_name === sectionName).length,
    ]),
  );
  const representedSections = Object.values(sectionDistribution)
    .filter((count) => count > 0)
    .length;

  return {
    evidence_entry_count: entries.length,
    section_count: representedSections,
    section_distribution: sectionDistribution,
    duplicate_reference_count: duplicateReferenceCount(entries),
    orphan_reference_count: 0,
    invalid_hash_count: invalidHashCount(entries),
    ordering_issue_count: orderingIssueCount(entries),
  };
}

function buildSectionHierarchy(
  entries: EvidenceCatalogEntry[],
): ThemesReadinessSection[] {
  return EVIDENCE_IDENTITY_SECTION_ORDER
    .map((sectionName) => ({
      section_name: sectionName,
      evidence_refs: entries
        .filter((entry) => entry.section_name === sectionName)
        .map((entry) => entry.evidence_ref),
    }))
    .filter(({ evidence_refs: evidenceRefs }) => evidenceRefs.length > 0);
}

function collectRequiredFieldFindings(
  entry: EvidenceCatalogEntry,
  field: string,
  findings: ThemesQualityFinding[],
): void {
  requireEntryText(entry.evidence_ref, `${field}.evidence_ref`, findings);
  requireEntryText(entry.evidence_hash, `${field}.evidence_hash`, findings);
  requireEntryText(entry.filing_id, `${field}.filing_id`, findings);
  requireEntryText(entry.section_name, `${field}.section_name`, findings);
  requireEntryText(entry.paragraph_text, `${field}.paragraph_text`, findings);

  if (!Number.isInteger(entry.paragraph_index) || entry.paragraph_index < 1) {
    findings.push(createBlockingFinding({
      code: THEMES_QUALITY_FINDING_CODES.MISSING_REQUIRED_FIELD,
      message: `${field}.paragraph_index must be a positive integer.`,
      evidenceRef: entry.evidence_ref,
    }));
  }
}

function requireEntryText(
  value: unknown,
  field: string,
  findings: ThemesQualityFinding[],
): void {
  if (typeof value !== "string" || value.trim() === "") {
    findings.push(createBlockingFinding({
      code: THEMES_QUALITY_FINDING_CODES.MISSING_REQUIRED_FIELD,
      message: `${field} must be a non-empty string.`,
    }));
  }
}

function invalidHashCount(entries: EvidenceCatalogEntry[]): number {
  return entries.filter((entry) => {
    if (typeof entry.paragraph_text !== "string") {
      return true;
    }

    return entry.evidence_hash !== createEvidenceHash(entry.paragraph_text);
  }).length;
}

function orderingIssueCount(entries: EvidenceCatalogEntry[]): number {
  const nextParagraphIndex = new Map<EvidenceSectionName, number>(
    EVIDENCE_IDENTITY_SECTION_ORDER.map((section) => [section, 1]),
  );
  let priorSectionIndex = -1;
  let issueCount = 0;

  for (const entry of entries) {
    if (!isAllowedSection(entry.section_name)) {
      issueCount += 1;
      continue;
    }

    const sectionIndex = EVIDENCE_IDENTITY_SECTION_ORDER.indexOf(
      entry.section_name,
    );
    const expectedParagraphIndex = nextParagraphIndex.get(entry.section_name);

    if (
      sectionIndex < priorSectionIndex
      || entry.paragraph_index !== expectedParagraphIndex
    ) {
      issueCount += 1;
    }

    priorSectionIndex = Math.max(priorSectionIndex, sectionIndex);
    nextParagraphIndex.set(entry.section_name, entry.paragraph_index + 1);
  }

  return issueCount;
}

function duplicateReferenceCount(entries: EvidenceCatalogEntry[]): number {
  return [...countReferences(entries).values()]
    .reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function countReferences(entries: EvidenceCatalogEntry[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    counts.set(entry.evidence_ref, (counts.get(entry.evidence_ref) ?? 0) + 1);
  }

  return counts;
}

function isFirstReferenceOccurrence(
  entries: EvidenceCatalogEntry[],
  index: number,
  evidenceRef: string,
): boolean {
  return entries.findIndex((entry) => entry.evidence_ref === evidenceRef)
    === index;
}

function isAllowedSection(value: string): value is EvidenceSectionName {
  return EVIDENCE_IDENTITY_SECTION_ORDER.includes(value as never);
}

function createBlockingFinding(input: FindingInput): ThemesQualityFinding {
  return {
    finding_id: "",
    severity: "blocking",
    code: input.code,
    message: input.message,
    ...(input.evidenceRef !== undefined
      ? { evidence_ref: input.evidenceRef }
      : {}),
  };
}

function cloneEntries(
  entries: EvidenceCatalogEntry[],
): EvidenceCatalogEntry[] {
  return entries.map((entry) => ({ ...entry }));
}
