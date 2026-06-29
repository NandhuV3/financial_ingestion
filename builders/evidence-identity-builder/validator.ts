import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  EvidenceCatalogEntry,
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  EVIDENCE_IDENTITY_SECTION_ORDER,
  type EvidenceSectionName,
} from "./contract.js";
import {
  buildEvidenceIdentityEntries,
  createEvidenceHash,
  createEvidenceReference,
  normalizeEvidenceParagraph,
} from "./evidence-builder.js";
import type {
  EvidenceIdentityBuilderInput,
  EvidenceIdentityDependencies,
} from "./types.js";

export function validateEvidenceIdentityBuilderInput(
  input: EvidenceIdentityBuilderInput,
): void {
  if (!input || typeof input !== "object") {
    throw new BuilderValidationError(
      "filing_artifact must be provided.",
    );
  }

  requireText(input.filing_artifact?.filing_id, "filing_artifact.filing_id");
  requireText(
    input.filing_artifact?.filing_type,
    "filing_artifact.filing_type",
  );
  requireText(
    input.filing_artifact?.filing_content,
    "filing_artifact.filing_content",
  );
  requireText(
    input.filing_artifact?.filing_hash,
    "filing_artifact.filing_hash",
  );
  requireText(
    input.filing_artifact?.filing_period,
    "filing_artifact.filing_period",
  );
}

export function validateEvidenceIdentityBuildTarget(input: {
  builderInput: EvidenceIdentityBuilderInput;
  companyId: string;
  periodId: string;
}): void {
  if (input.builderInput.filing_artifact.filing_period !== input.periodId) {
    throw new BuilderValidationError(
      "Evidence Identity filing period must match the build target.",
    );
  }

  requireText(input.companyId, "company_id");
  requireText(input.periodId, "period_id");
}

export function resolveEvidenceIdentityDependencies(input: {
  dependencies: Record<string, Artifact<unknown>>;
  builderInput: EvidenceIdentityBuilderInput;
  companyId: string;
  periodId: string;
}): EvidenceIdentityDependencies {
  const filing = input.dependencies.filing as
    | Artifact<FilingArtifactContent>
    | undefined;

  if (!filing || filing.identity.artifact_type !== "filing") {
    throw new BuilderValidationError(
      "Evidence Identity requires the Filing Artifact dependency.",
    );
  }

  if (
    filing.identity.company_id !== input.companyId
    || filing.identity.period_id !== input.periodId
    || stableHash(filing.content) !== stableHash(input.builderInput.filing_artifact)
  ) {
    throw new BuilderValidationError(
      "Evidence Identity Filing Artifact dependency does not reconcile with the build target and input.",
    );
  }

  return { filing };
}

export function validateEvidenceIdentityContent(input: {
  builderInput: EvidenceIdentityBuilderInput;
  content: EvidenceIdentityContent;
}): void {
  if (
    input.content.filing_id !== input.builderInput.filing_artifact.filing_id
    || input.content.filing_hash
      !== input.builderInput.filing_artifact.filing_hash
  ) {
    throw new BuilderValidationError(
      "Evidence Identity content does not reconcile with the Filing Artifact.",
    );
  }

  if (!Array.isArray(input.content.entries)) {
    throw new BuilderValidationError(
      "content.entries must be an array.",
    );
  }

  validateEntries(input.content.entries, input.content.filing_id);

  const expectedEntries = buildEvidenceIdentityEntries(
    input.builderInput.filing_artifact,
  );

  if (stableHash(input.content.entries) !== stableHash(expectedEntries)) {
    throw new BuilderValidationError(
      "Evidence Identity entries do not reconcile with deterministic generation.",
    );
  }
}

function validateEntries(
  entries: EvidenceCatalogEntry[],
  filingId: string,
): void {
  const evidenceReferences = new Set<string>();
  const paragraphIdentities = new Set<string>();
  const nextParagraphIndex = new Map<EvidenceSectionName, number>(
    EVIDENCE_IDENTITY_SECTION_ORDER.map((section) => [section, 1]),
  );
  let priorSectionIndex = -1;

  for (const [index, entry] of entries.entries()) {
    const field = `entries[${index}]`;
    requireText(entry.evidence_ref, `${field}.evidence_ref`);
    requireText(entry.evidence_hash, `${field}.evidence_hash`);
    requireText(entry.filing_id, `${field}.filing_id`);
    requireText(entry.section_name, `${field}.section_name`);
    requireText(entry.paragraph_text, `${field}.paragraph_text`);

    if (entry.filing_id !== filingId) {
      throw new BuilderValidationError(
        `${field}.filing_id does not reconcile with content.filing_id.`,
      );
    }

    if (
      !EVIDENCE_IDENTITY_SECTION_ORDER.includes(entry.section_name as never)
    ) {
      throw new BuilderValidationError(
        `${field}.section_name is invalid.`,
      );
    }

    if (!Number.isInteger(entry.paragraph_index) || entry.paragraph_index < 1) {
      throw new BuilderValidationError(
        `${field}.paragraph_index must be a positive integer.`,
      );
    }

    if (evidenceReferences.has(entry.evidence_ref)) {
      throw new BuilderValidationError(
        `Duplicate evidence_ref: ${entry.evidence_ref}.`,
      );
    }
    evidenceReferences.add(entry.evidence_ref);

    const paragraphIdentity = [
      entry.filing_id,
      entry.section_name,
      entry.paragraph_index,
    ].join(":");

    if (paragraphIdentities.has(paragraphIdentity)) {
      throw new BuilderValidationError(
        `Duplicate paragraph identity: ${paragraphIdentity}.`,
      );
    }
    paragraphIdentities.add(paragraphIdentity);

    const sectionName = entry.section_name as EvidenceSectionName;
    const sectionIndex = EVIDENCE_IDENTITY_SECTION_ORDER.indexOf(sectionName);
    const expectedParagraphIndex = nextParagraphIndex.get(sectionName);

    if (
      sectionIndex < priorSectionIndex
      || entry.paragraph_index !== expectedParagraphIndex
    ) {
      throw new BuilderValidationError(
        "Evidence Identity ordering is invalid.",
      );
    }

    priorSectionIndex = sectionIndex;
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

    if (entry.paragraph_text !== normalizedParagraph) {
      throw new BuilderValidationError(
        `${field}.paragraph_text is not canonically normalized.`,
      );
    }

    if (entry.evidence_hash !== expectedHash) {
      throw new BuilderValidationError(
        `${field}.evidence_hash does not reconcile.`,
      );
    }

    if (entry.evidence_ref !== expectedReference) {
      throw new BuilderValidationError(
        `${field}.evidence_ref does not reconcile.`,
      );
    }
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(
      `${field} must be a non-empty string.`,
    );
  }
}
