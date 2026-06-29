import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  EvidenceIdentityContent,
} from "../../contracts/artifacts/evidence-identity-artifact-content.js";
import type {
  ThemesExecutionReadinessContent,
} from "../../contracts/execution/themes-execution-readiness-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  EVIDENCE_IDENTITY_SECTION_ORDER,
} from "../evidence-identity-builder/contract.js";
import {
  buildThemesReadinessSectionHierarchy,
  calculateThemesQualityMetrics,
  evaluateThemesExecutionReadiness,
} from "./readiness-evaluator.js";
import type {
  ThemesQualityBuilderInput,
  ThemesQualityDependencies,
} from "./types.js";

export function validateThemesQualityBuilderInput(
  input: ThemesQualityBuilderInput,
): void {
  if (!input || typeof input !== "object") {
    throw new BuilderValidationError(
      "evidence_identity must be provided.",
    );
  }

  requireEvidenceIdentityContent(input.evidence_identity, "evidence_identity");
}

export function validateThemesQualityBuildTarget(input: {
  builderInput: ThemesQualityBuilderInput;
  companyId: string;
  periodId: string;
}): void {
  requireText(input.companyId, "company_id");
  requireText(input.periodId, "period_id");
  requireEvidenceIdentityContent(
    input.builderInput.evidence_identity,
    "evidence_identity",
  );
}

export function resolveThemesQualityDependencies(input: {
  dependencies: Record<string, Artifact<unknown>>;
  builderInput: ThemesQualityBuilderInput;
  companyId: string;
  periodId: string;
}): ThemesQualityDependencies {
  const evidenceIdentity = input.dependencies.evidence_identity as
    | Artifact<EvidenceIdentityContent>
    | undefined;

  if (
    !evidenceIdentity
    || evidenceIdentity.identity.artifact_type !== "evidence_identity"
  ) {
    throw new BuilderValidationError(
      "Themes Quality requires the Evidence Identity Artifact dependency.",
    );
  }

  if (
    evidenceIdentity.identity.company_id !== input.companyId
    || evidenceIdentity.identity.period_id !== input.periodId
    || stableHash(evidenceIdentity.content)
      !== stableHash(input.builderInput.evidence_identity)
  ) {
    throw new BuilderValidationError(
      "Themes Quality Evidence Identity dependency does not reconcile with the build target and input.",
    );
  }

  return { evidence_identity: evidenceIdentity };
}

export function validateThemesExecutionReadinessContent(input: {
  evidenceIdentityArtifactId: string;
  evidenceIdentity: EvidenceIdentityContent;
  content: ThemesExecutionReadinessContent;
}): void {
  const expected = evaluateThemesExecutionReadiness({
    evidenceIdentityArtifactId: input.evidenceIdentityArtifactId,
    evidenceIdentity: input.evidenceIdentity,
  });

  if (stableHash(input.content) !== stableHash(expected)) {
    throw new BuilderValidationError(
      "Themes Execution Readiness content does not reconcile with deterministic readiness evaluation.",
    );
  }

  if (
    input.content.readiness_status === "ready"
    && input.content.validated_evidence.length
      !== input.evidenceIdentity.entries.length
  ) {
    throw new BuilderValidationError(
      "Ready Themes Execution Readiness must carry every Evidence Identity entry.",
    );
  }

  if (
    input.content.readiness_status === "not_ready"
    && input.content.validated_evidence.length > 0
  ) {
    throw new BuilderValidationError(
      "Not-ready Themes Execution Readiness must not carry invalid evidence.",
    );
  }

  const expectedMetrics = calculateThemesQualityMetrics(
    input.evidenceIdentity.entries,
  );
  if (stableHash(input.content.metrics) !== stableHash(expectedMetrics)) {
    throw new BuilderValidationError(
      "Themes Quality metrics do not reconcile with Evidence Identity.",
    );
  }

  if (
    input.content.readiness_status === "ready"
    && stableHash(input.content.validated_section_hierarchy)
      !== stableHash(buildThemesReadinessSectionHierarchy(
        input.evidenceIdentity.entries,
      ))
  ) {
    throw new BuilderValidationError(
      "Themes readiness section hierarchy does not reconcile with validated evidence.",
    );
  }
}

function requireEvidenceIdentityContent(
  value: EvidenceIdentityContent | undefined,
  field: string,
): void {
  if (!value || typeof value !== "object") {
    throw new BuilderValidationError(
      `${field} must be an Evidence Identity content object.`,
    );
  }

  requireText(value.filing_id, `${field}.filing_id`);
  requireText(value.filing_hash, `${field}.filing_hash`);

  if (!Array.isArray(value.entries)) {
    throw new BuilderValidationError(
      `${field}.entries must be an array.`,
    );
  }

  for (const [index, entry] of value.entries.entries()) {
    const entryField = `${field}.entries[${index}]`;
    requireText(entry.evidence_ref, `${entryField}.evidence_ref`);
    requireText(entry.evidence_hash, `${entryField}.evidence_hash`);
    requireText(entry.filing_id, `${entryField}.filing_id`);
    requireText(entry.section_name, `${entryField}.section_name`);
    requireText(entry.paragraph_text, `${entryField}.paragraph_text`);

    if (!Number.isInteger(entry.paragraph_index)) {
      throw new BuilderValidationError(
        `${entryField}.paragraph_index must be an integer.`,
      );
    }

    if (
      !EVIDENCE_IDENTITY_SECTION_ORDER.includes(entry.section_name as never)
    ) {
      throw new BuilderValidationError(
        `${entryField}.section_name is invalid.`,
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
