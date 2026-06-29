import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  FILING_SECTION_NAMES,
  FILING_TYPE_REQUIREMENTS,
  type FilingSectionName,
  type FilingTypeRequirement,
} from "./contract.js";
import {
  assembleFilingContent,
  calculateFilingHash,
  canonicalizeFilingSection,
  filingSections,
} from "./content-assembler.js";
import type { FilingArtifactBuilderInput } from "./types.js";

export function validateFilingArtifactBuilderInput(
  input: FilingArtifactBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
  requireText(input.filing_type, "filing_type");
  requireText(input.filing_period, "filing_period");
  requireText(input.accession_number, "accession_number");
  requireText(input.management_discussion, "management_discussion");
  requireText(input.risk_factors, "risk_factors");
  requireText(input.raw_html_hash, "raw_html_hash");

  if (input.filing_period !== input.period_id) {
    throw new BuilderValidationError(
      "filing_period must match period_id.",
    );
  }

  const requirements = filingTypeRequirements(input.filing_type);
  const sections = filingSections(input);

  for (const section of requirements.required_sections) {
    requireText(sections[section], section);
    requireText(canonicalizeFilingSection(sections[section]), section);
  }
}

export function validateFilingArtifactBuildTarget(input: {
  builderInput: FilingArtifactBuilderInput;
  companyId: string;
  periodId: string;
}): void {
  if (
    input.builderInput.company_id !== input.companyId
    || input.builderInput.period_id !== input.periodId
    || input.builderInput.filing_period !== input.periodId
  ) {
    throw new BuilderValidationError(
      "Filing Artifact input identity must match the build target.",
    );
  }
}

export function validateFilingArtifactContent(input: {
  builderInput: FilingArtifactBuilderInput;
  content: FilingArtifactContent;
}): void {
  const expectedContent = assembleFilingContent(input.builderInput);
  const expectedHash = calculateFilingHash(expectedContent);

  if (
    input.content.filing_id !== input.builderInput.filing_id
    || input.content.filing_type !== input.builderInput.filing_type
    || input.content.filing_period !== input.builderInput.filing_period
  ) {
    throw new BuilderValidationError(
      "Filing Artifact content identity does not reconcile with builder input.",
    );
  }

  if (input.content.filing_content !== expectedContent) {
    throw new BuilderValidationError(
      "Filing Artifact content does not reconcile with deterministic section assembly.",
    );
  }

  if (input.content.filing_hash !== expectedHash) {
    throw new BuilderValidationError(
      "Filing Artifact filing_hash does not reconcile with filing_content.",
    );
  }
}

export function filingTypeRequirements(
  filingType: string,
): FilingTypeRequirement {
  const requirements = FILING_TYPE_REQUIREMENTS[filingType];

  if (!requirements) {
    throw new BuilderValidationError(
      `Unsupported Filing Artifact filing_type: ${filingType}.`,
    );
  }

  validateRequirementRegistry(filingType, requirements);

  return requirements;
}

function validateRequirementRegistry(
  filingType: string,
  requirements: FilingTypeRequirement,
): void {
  const knownSections = new Set<FilingSectionName>(FILING_SECTION_NAMES);
  const seen = new Set<FilingSectionName>();

  for (const section of requirements.required_sections) {
    if (!knownSections.has(section)) {
      throw new BuilderValidationError(
        `Filing type ${filingType} references unknown section: ${section}.`,
      );
    }

    if (seen.has(section)) {
      throw new BuilderValidationError(
        `Filing type ${filingType} contains duplicate required section: ${section}.`,
      );
    }

    seen.add(section);
  }
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(
      `${field} must be a non-empty string.`,
    );
  }

  return value;
}
