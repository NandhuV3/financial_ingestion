import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { ResolvedPrompt } from "../../src/prompt-registry/prompt.types.js";
import { stableHash } from "../investor-intelligence-builder/hashes.js";
import type { Theme, ThemesArtifactContent } from "../themes/contract.js";
import {
  buildStructuredIntelligenceEvaluationHooks,
  calculateStructuredIntelligenceConfidence,
  calculateStructuredIntelligenceStatus,
} from "./confidence.js";
import {
  STRUCTURED_INTELLIGENCE_EVALUATION_VERSION,
  STRUCTURED_INTELLIGENCE_STATUS_VALUES,
  STRUCTURED_INTELLIGENCE_TEMPERATURE,
  type GroundedUnderstanding,
  type StructuredIntelligenceArtifactContent,
  type StructuredUnderstanding,
} from "./contract.js";
import {
  buildStructuredIntelligenceReplayability,
  recomputeStructuredIntelligenceOutputHash,
} from "./replayability.js";
import type {
  StructuredIntelligenceBuilderInput,
  StructuredIntelligenceDependencies,
  StructuredPromptContext,
} from "./types.js";
import {
  assertUniqueCollectionLabels,
  buildStructuredValueReferences,
} from "./value-references.js";

const forbiddenPatterns = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\bundervalued\b/i,
  /\bovervalued\b/i,
  /\bprice target\b/i,
  /\bexpected return\b/i,
  /\btrustworthy\b/i,
  /\buntrustworthy\b/i,
  /\btrust score\b/i,
  /\bconcept[_ -]?id\b/i,
  /\btopic[_ -]?id\b/i,
];

const forbiddenGroundingPatterns = [
  { phrase: "could impact", pattern: /\bcould\s+impact\b/i },
  { phrase: "could affect", pattern: /\bcould\s+affect\b/i },
  { phrase: "may affect", pattern: /\bmay\s+affect\b/i },
  { phrase: "may result in", pattern: /\bmay\s+result\s+in\b/i },
  { phrase: "may cause", pattern: /\bmay\s+cause\b/i },
  { phrase: "might cause", pattern: /\bmight\s+cause\b/i },
  { phrase: "could hinder", pattern: /\bcould\s+hinder\b/i },
  { phrase: "could reduce", pattern: /\bcould\s+reduce\b/i },
  { phrase: "could increase", pattern: /\bcould\s+increase\b/i },
  { phrase: "significant", pattern: /\bsignificant\b/i },
  { phrase: "significantly", pattern: /\bsignificantly\b/i },
  { phrase: "major", pattern: /\bmajor\b/i },
  { phrase: "critical", pattern: /\bcritical\b/i },
  { phrase: "key", pattern: /\bkey\b/i },
  { phrase: "primary", pattern: /\bprimary\b/i },
  { phrase: "essential", pattern: /\bessential\b/i },
  { phrase: "important", pattern: /\bimportant\b/i },
  { phrase: "meaningful", pattern: /\bmeaningful\b/i },
  { phrase: "because", pattern: /\bbecause\b/i },
  { phrase: "therefore", pattern: /\btherefore\b/i },
  { phrase: "thus", pattern: /\bthus\b/i },
  { phrase: "enables", pattern: /\benables\b/i },
  { phrase: "drives", pattern: /\bdrives\b/i },
  { phrase: "supports", pattern: /\bsupports\b/i },
  { phrase: "improves", pattern: /\bimproves\b/i },
  { phrase: "strengthens", pattern: /\bstrengthens\b/i },
  { phrase: "results in", pattern: /\bresults\s+in\b/i },
] as const;

const groundingTextFields = new Set([
  "description",
  "explanation",
  "rationale",
  "supporting_reasoning",
  "value_creation",
]);

export function validateStructuredIntelligenceInput(
  input: StructuredIntelligenceBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
}

export function resolveStructuredIntelligenceDependencies(input: {
  dependencies: Record<string, Artifact<unknown>>;
  target: StructuredIntelligenceBuilderInput;
  companyId: string;
  periodId: string;
}): StructuredIntelligenceDependencies {
  const filing = requiredArtifact<FilingArtifactContent>(
    input.dependencies.filing,
    "filing",
  );
  const themes = requiredArtifact<ThemesArtifactContent>(
    input.dependencies.themes,
    "themes",
  );

  validateDependencyIdentity(filing, "filing", input.companyId, input.periodId);
  validateDependencyIdentity(themes, "themes", input.companyId, input.periodId);
  validateFilingContent(filing.content);
  validateThemesContent(themes.content);

  if (
    input.target.company_id !== input.companyId
    || input.target.period_id !== input.periodId
    || input.target.filing_id !== filing.content.filing_id
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence input identity must match the build target and Filing artifact.",
    );
  }

  if (
    filing.content.filing_period !== input.periodId
    || themes.content.company_id !== input.companyId
    || themes.content.period_id !== input.periodId
    || themes.content.filing_id !== input.target.filing_id
    || themes.content.filing_id !== filing.content.filing_id
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence dependency content identity is inconsistent.",
    );
  }

  return { filing, themes };
}

export function validateStructuredUnderstanding(
  understanding: StructuredUnderstanding,
  themes: Theme[],
): void {
  assertUniqueCollectionLabels(understanding, (field, normalizedLabel) => {
    throw new BuilderValidationError(
      `${field} contains duplicate normalized label: ${normalizedLabel}.`,
    );
  });

  const allowedEvidence = new Set(
    themes.flatMap((theme) =>
      theme.evidence.map(({ evidence_ref }) => evidence_ref)),
  );

  for (const value of groundedValues(understanding)) {
    validateGroundedValue(value.value, value.field, allowedEvidence);
  }
}

export function validateStructuredIntelligenceContent(
  content: StructuredIntelligenceArtifactContent,
): void {
  if (content.artifact_type !== "structured_intelligence") {
    throw new BuilderValidationError(
      "content.artifact_type must be structured_intelligence.",
    );
  }

  requireText(content.company_id, "content.company_id");
  requireText(content.period_id, "content.period_id");
  requireText(content.filing_id, "content.filing_id");

  if (!STRUCTURED_INTELLIGENCE_STATUS_VALUES.includes(content.status)) {
    throw new BuilderValidationError("content.status is invalid.");
  }

  validateScore(content.confidence.overall, "confidence.overall");
  validateScore(
    content.confidence.evidence_coverage,
    "confidence.evidence_coverage",
  );
  validateScore(
    content.confidence.field_completeness,
    "confidence.field_completeness",
  );
  validateScore(
    content.confidence.theme_utilization,
    "confidence.theme_utilization",
  );

  if (content.confidence.hallucination_risk !== "not_assessed") {
    throw new BuilderValidationError(
      "confidence.hallucination_risk must be not_assessed in V1.",
    );
  }

  if (
    content.evaluation_hooks.schema_compliance !== 1
    || content.evaluation_hooks.unsupported_claim_count !== "not_assessed"
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence V1 evaluation hooks are invalid.",
    );
  }

  if (
    content.replayability_metadata.temperature
      !== STRUCTURED_INTELLIGENCE_TEMPERATURE
    || content.replayability_metadata.evaluation_version
      !== STRUCTURED_INTELLIGENCE_EVALUATION_VERSION
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence replayability metadata is invalid.",
    );
  }
}

export function validateStructuredIntelligenceReconciliation(input: {
  content: StructuredIntelligenceArtifactContent;
  filing: FilingArtifactContent;
  themes: ThemesArtifactContent;
  context: StructuredPromptContext;
  prompt: ResolvedPrompt;
  modelVersion: string;
}): void {
  validateStructuredUnderstanding(
    input.content.understanding,
    input.themes.themes,
  );

  const expectedStatus = calculateStructuredIntelligenceStatus(
    input.content.understanding,
  );
  const expectedConfidence = calculateStructuredIntelligenceConfidence(
    input.content.understanding,
    input.themes.themes,
  );
  const expectedEvaluationHooks =
    buildStructuredIntelligenceEvaluationHooks(expectedConfidence);
  const expectedReferences = buildStructuredValueReferences({
    companyId: input.content.company_id,
    periodId: input.content.period_id,
    filingId: input.content.filing_id,
    understanding: input.content.understanding,
  });
  const contentWithoutReplayability = {
    artifact_type: input.content.artifact_type,
    company_id: input.content.company_id,
    period_id: input.content.period_id,
    filing_id: input.content.filing_id,
    status: input.content.status,
    understanding: input.content.understanding,
    value_references: input.content.value_references,
    confidence: input.content.confidence,
    evaluation_hooks: input.content.evaluation_hooks,
  };
  const expectedReplayability = buildStructuredIntelligenceReplayability({
    prompt: input.prompt,
    modelVersion: input.modelVersion,
    filing: input.filing,
    themes: input.themes,
    context: input.context,
    content: contentWithoutReplayability,
  });

  if (input.content.status !== expectedStatus) {
    throw new BuilderValidationError(
      "Structured Intelligence status does not reconcile with emitted content.",
    );
  }

  if (stableHash(input.content.confidence) !== stableHash(expectedConfidence)) {
    throw new BuilderValidationError(
      "Structured Intelligence confidence does not reconcile with builder calculation.",
    );
  }

  if (
    stableHash(input.content.evaluation_hooks)
      !== stableHash(expectedEvaluationHooks)
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence evaluation hooks do not reconcile with builder calculation.",
    );
  }

  if (
    stableHash(input.content.value_references)
      !== stableHash(expectedReferences)
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence value references do not reconcile with emitted values.",
    );
  }

  if (
    stableHash(input.content.replayability_metadata)
      !== stableHash(expectedReplayability)
    || input.content.replayability_metadata.output_hash
      !== recomputeStructuredIntelligenceOutputHash(input.content)
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence replayability metadata does not reconcile.",
    );
  }
}

function validateGroundedValue(
  value: GroundedUnderstanding,
  field: string,
  allowedEvidence: Set<string>,
): void {
  validateScore(value.confidence, `${field}.confidence`);

  if (
    !Array.isArray(value.evidence_refs)
    || value.evidence_refs.length === 0
  ) {
    throw new BuilderValidationError(
      `${field}.evidence_refs must contain at least one evidence reference.`,
    );
  }

  for (const reference of value.evidence_refs) {
    requireText(reference, `${field}.evidence_refs`);

    if (!allowedEvidence.has(reference)) {
      throw new BuilderValidationError(
        `Structured Intelligence evidence reference is not present in the supplied Themes evidence catalog: ${reference}`,
      );
    }
  }

  validateGroundingLanguage(value, field);

  const text = Object.entries(value)
    .filter(([key]) => key !== "confidence" && key !== "evidence_refs")
    .flatMap(([, entry]) =>
      Array.isArray(entry) ? entry.map(String) : [String(entry)])
    .join(" ");

  if (forbiddenPatterns.some((pattern) => pattern.test(text))) {
    throw new BuilderValidationError(
      `${field} contains forbidden boundary-crossing language.`,
    );
  }
}

function validateGroundingLanguage(
  value: GroundedUnderstanding,
  field: string,
): void {
  for (const [key, emittedValue] of Object.entries(value)) {
    if (
      !groundingTextFields.has(key)
      || emittedValue === null
      || typeof emittedValue !== "string"
    ) {
      continue;
    }

    for (const forbidden of forbiddenGroundingPatterns) {
      if (forbidden.pattern.test(emittedValue)) {
        throw new BuilderValidationError(
          `${field}.${key} contains forbidden phrase "${forbidden.phrase}". `
            + `Emitted value: "${emittedValue}"`,
        );
      }
    }
  }
}

function groundedValues(
  understanding: StructuredUnderstanding,
): Array<{ field: string; value: GroundedUnderstanding }> {
  return [
    ...(understanding.business_model === null
      ? []
      : [{
          field: "understanding.business_model",
          value: understanding.business_model,
        }]),
    ...(understanding.revenue_model === null
      ? []
      : [{
          field: "understanding.revenue_model",
          value: understanding.revenue_model,
        }]),
    ...collectionValues("products", understanding.products),
    ...collectionValues("customers", understanding.customers),
    ...collectionValues("revenue_drivers", understanding.revenue_drivers),
    ...collectionValues(
      "competitive_positioning",
      understanding.competitive_positioning,
    ),
    ...collectionValues(
      "strategic_priorities",
      understanding.strategic_priorities,
    ),
    ...collectionValues("management_focus", understanding.management_focus),
    ...collectionValues("risks", understanding.risks),
    ...collectionValues("dependencies", understanding.dependencies),
  ];
}

function collectionValues<T extends GroundedUnderstanding>(
  name: string,
  values: T[],
): Array<{ field: string; value: GroundedUnderstanding }> {
  return values.map((value, index) => ({
    field: `understanding.${name}[${index}]`,
    value,
  }));
}

function requiredArtifact<T>(
  artifact: Artifact<unknown> | undefined,
  name: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderValidationError(
      `Missing required Structured Intelligence dependency: ${name}.`,
    );
  }

  return artifact as Artifact<T>;
}

function validateDependencyIdentity(
  artifact: Artifact<unknown>,
  expectedType: "filing" | "themes",
  companyId: string,
  periodId: string,
): void {
  if (
    artifact.identity.artifact_type !== expectedType
    || artifact.identity.company_id !== companyId
    || artifact.identity.period_id !== periodId
  ) {
    throw new BuilderValidationError(
      `Structured Intelligence ${expectedType} dependency identity does not match the build target.`,
    );
  }
}

function validateFilingContent(content: FilingArtifactContent): void {
  requireText(content.filing_id, "filing.filing_id");
  requireText(content.filing_type, "filing.filing_type");
  requireText(content.filing_content, "filing.filing_content");
  requireText(content.filing_hash, "filing.filing_hash");
  requireText(content.filing_period, "filing.filing_period");
}

function validateThemesContent(content: ThemesArtifactContent): void {
  requireText(content.company_id, "themes.company_id");
  requireText(content.period_id, "themes.period_id");
  requireText(content.filing_id, "themes.filing_id");

  if (!Array.isArray(content.themes)) {
    throw new BuilderValidationError("themes.themes must be an array.");
  }
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }

  return value;
}

function validateScore(value: unknown, field: string): void {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > 1
  ) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}
