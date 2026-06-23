import { createHash } from "node:crypto";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { EvidenceCatalogArtifactContent } from "../../contracts/artifacts/evidence-catalog-artifact-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { THEME_CATEGORIES, type Theme, type ThemesArtifactContent } from "./contract.js";
import type {
  ThemeCandidate,
  ThemePromptEvidence,
  ThemesDependencies,
  ThemesBuilderInput,
  ThemesLLMOutput,
} from "./types.js";
import { validateThemeQualityMetrics } from "./theme-quality/validator.js";

const validFilingTypes = new Set(["10-K", "10-Q", "Transcript"]);
const themeOutputKeys = [
  "title",
  "summary",
  "category",
  "paragraph_indexes",
] as const;
const forbiddenPatterns = [
  /\btopic[_ -]?id\b/i,
  /\bconcept[_ -]?id\b/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\bundervalued\b/i,
  /\bovervalued\b/i,
  /\bstrong competitive moat\b/i,
  /\bexcellent execution\b/i,
];

export function validateThemesInput(input: ThemesBuilderInput): void {
  if (!validFilingTypes.has(input.filing_type)) {
    throw new BuilderValidationError(`Invalid filing_type: ${String(input.filing_type)}`);
  }
}

export function parseThemesLLMOutput(outputText: string): ThemesLLMOutput {
  try {
    const parsed = JSON.parse(outputText) as unknown;

    if (!isRecord(parsed)) {
      throw new BuilderValidationError(
        "Themes LLM output must be a JSON object.",
      );
    }

    assertExactKeys(parsed, ["themes"], "Themes LLM output");

    if (!Array.isArray(parsed.themes)) {
      throw new BuilderValidationError("Themes LLM output must contain a themes array.");
    }

    return {
      themes: parsed.themes.map((candidate, index) =>
        parseThemeCandidate(candidate, index)),
    };
  } catch (error) {
    if (error instanceof BuilderValidationError) {
      throw error;
    }

    throw new BuilderValidationError("Themes LLM output must be valid JSON.", error);
  }
}

export function validateThemeCandidate(
  candidate: ThemeCandidate,
  index: number,
  promptEvidence?: ThemePromptEvidence[],
): void {
  requireText(candidate.title, `themes[${index}].title`);
  requireText(candidate.summary, `themes[${index}].summary`);

  if (!THEME_CATEGORIES.includes(candidate.category)) {
    throw invalidCategoryError(index, candidate.category);
  }

  if (
    !Array.isArray(candidate.paragraph_indexes)
    || candidate.paragraph_indexes.length === 0
  ) {
    throw new BuilderValidationError(
      `themes[${index}].paragraph_indexes must contain at least one item.`,
    );
  }

  const seenParagraphIndexes = new Set<number>();

  for (
    const [paragraphIndexPosition, paragraphIndex]
    of candidate.paragraph_indexes.entries()
  ) {
    if (!Number.isInteger(paragraphIndex) || paragraphIndex < 1) {
      throw new BuilderValidationError(
        `themes[${index}].paragraph_indexes[${paragraphIndexPosition}] `
        + "must be a positive integer.",
      );
    }

    if (seenParagraphIndexes.has(paragraphIndex)) {
      throw new BuilderValidationError(
        `themes[${index}].paragraph_indexes must contain unique values.`,
      );
    }

    seenParagraphIndexes.add(paragraphIndex);

    if (
      promptEvidence
      && !promptEvidence.some(({ paragraph_index }) =>
        paragraph_index === paragraphIndex)
    ) {
      throw new BuilderValidationError(
        `themes[${index}].paragraph_indexes[${paragraphIndexPosition}] `
        + "is not present in the supplied filing paragraphs.",
      );
    }
  }

  if (
    promptEvidence
    && new Set(promptEvidence.map(({ paragraph_index }) => paragraph_index))
      .size !== promptEvidence.length
  ) {
    throw new BuilderValidationError(
      "Theme prompt evidence paragraph indexes must be unique.",
    );
  }

  rejectForbiddenLanguage(candidate.title, `themes[${index}].title`);
  rejectForbiddenLanguage(candidate.summary, `themes[${index}].summary`);
}

export function validateThemesArtifactContent(
  content: ThemesArtifactContent,
  evidenceCatalog?: EvidenceCatalogArtifactContent["entries"],
): void {
  requireText(content.company_id, "content.company_id");
  requireText(content.period_id, "content.period_id");
  requireText(content.filing_id, "content.filing_id");

  if (!Array.isArray(content.themes)) {
    throw new BuilderValidationError("content.themes must be an array.");
  }

  for (const [index, theme] of content.themes.entries()) {
    validateTheme(theme, index);
  }

  validateConfidence(content.confidence.overall, "confidence.overall");
  validateConfidence(content.confidence.evidence_coverage, "confidence.evidence_coverage");
  validateConfidence(content.confidence.extraction_consistency, "confidence.extraction_consistency");
  validateConfidence(content.confidence.filing_coverage, "confidence.filing_coverage");

  if (evidenceCatalog) {
    if (!content.evaluation_hooks.theme_quality) {
      throw new BuilderValidationError(
        "evaluation_hooks.theme_quality is required when the Evidence Catalog is available.",
      );
    }

    validateThemeQualityMetrics({
      themes: content.themes,
      evidenceCatalog,
      metrics: content.evaluation_hooks.theme_quality,
    });
  }
}

export function normalizeThemeKey(title: string, summary: string): string {
  return `${title} ${summary}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createThemeId(filingId: string, title: string, summary: string): string {
  return createHash("sha256")
    .update(`${filingId}:${normalizeThemeKey(title, summary)}`, "utf8")
    .digest("hex");
}

function validateTheme(theme: Theme, index: number): void {
  requireText(theme.theme_id, `themes[${index}].theme_id`);
  requireText(theme.title, `themes[${index}].title`);
  requireText(theme.summary, `themes[${index}].summary`);

  if (!THEME_CATEGORIES.includes(theme.category)) {
    throw invalidCategoryError(index, theme.category);
  }

  if (
    !Array.isArray(theme.evidence)
    || theme.evidence.length === 0
  ) {
    throw new BuilderValidationError(
      `themes[${index}].evidence must contain at least one item.`,
    );
  }

  for (const [evidenceIndex, evidence] of theme.evidence.entries()) {
    requireText(
      evidence.evidence_ref,
      `themes[${index}].evidence[${evidenceIndex}].evidence_ref`,
    );
    requireText(
      evidence.evidence_hash,
      `themes[${index}].evidence[${evidenceIndex}].evidence_hash`,
    );
    requireText(
      evidence.section_name,
      `themes[${index}].evidence[${evidenceIndex}].section_name`,
    );

    if (
      !Number.isInteger(evidence.paragraph_index)
      || evidence.paragraph_index < 1
    ) {
      throw new BuilderValidationError(
        `themes[${index}].evidence[${evidenceIndex}].paragraph_index must be a positive integer.`,
      );
    }
  }

  if (theme.evidence_count !== theme.evidence.length) {
    throw new BuilderValidationError(
      `themes[${index}].evidence_count must equal evidence length.`,
    );
  }

  if (theme.directional_framing !== undefined) {
    requireText(
      theme.directional_framing,
      `themes[${index}].directional_framing`,
    );
  }

  rejectForbiddenLanguage(theme.title, `themes[${index}].title`);
  rejectForbiddenLanguage(theme.summary, `themes[${index}].summary`);
  validateConfidence(theme.confidence, `themes[${index}].confidence`);
}

function validateConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function rejectForbiddenLanguage(value: string, field: string): void {
  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    throw new BuilderValidationError(`${field} contains forbidden interpretive language.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseThemeCandidate(
  value: unknown,
  index: number,
): ThemeCandidate {
  if (!isRecord(value)) {
    throw new BuilderValidationError(
      `themes[${index}] must be an object.`,
    );
  }

  assertExactKeys(value, themeOutputKeys, `themes[${index}]`);
  requireText(value.title, `themes[${index}].title`);
  requireText(value.summary, `themes[${index}].summary`);

  if (
    typeof value.category !== "string"
    || !THEME_CATEGORIES.includes(value.category as never)
  ) {
    throw invalidCategoryError(index, value.category);
  }

  if (
    !Array.isArray(value.paragraph_indexes)
    || value.paragraph_indexes.length === 0
  ) {
    throw new BuilderValidationError(
      `themes[${index}].paragraph_indexes must contain at least one item.`,
    );
  }

  const candidate: ThemeCandidate = {
    title: value.title,
    summary: value.summary,
    category: value.category as ThemeCandidate["category"],
    paragraph_indexes: value.paragraph_indexes.map(
      (paragraphIndex) => paragraphIndex,
    ) as number[],
  };

  validateThemeCandidate(candidate, index);

  return candidate;
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  field: string,
): void {
  const actualKeys = Object.keys(value);
  const unknownKeys = actualKeys.filter((key) => !allowedKeys.includes(key));
  const missingKeys = allowedKeys.filter((key) => !(key in value));

  if (unknownKeys.length > 0 || missingKeys.length > 0) {
    throw new BuilderValidationError(
      `${field} must contain exactly the canonical fields. `
      + `Unknown: ${unknownKeys.join(", ") || "none"}. `
      + `Missing: ${missingKeys.join(", ") || "none"}.`,
    );
  }
}

export function resolveThemesDependencies(input: {
  dependencies: Record<string, Artifact<unknown>>;
  companyId: string;
  periodId: string;
}): ThemesDependencies {
  if (input.dependencies.filing !== undefined) {
    throw new BuilderValidationError(
      "Themes must not consume a direct Filing Artifact dependency.",
    );
  }

  const evidenceCatalog = requiredArtifact<EvidenceCatalogArtifactContent>(
    input.dependencies.evidence_catalog,
    "evidence_catalog",
  );

  if (
    evidenceCatalog.identity.artifact_type !== "evidence_catalog"
    || evidenceCatalog.identity.company_id !== input.companyId
    || evidenceCatalog.identity.period_id !== input.periodId
  ) {
    throw new BuilderValidationError(
      "Themes dependency identity does not match the build target.",
    );
  }

  if (
    evidenceCatalog.content.company_id !== input.companyId
    || evidenceCatalog.content.period_id !== input.periodId
  ) {
    throw new BuilderValidationError(
      "Themes dependency content does not reconcile.",
    );
  }

  return {
    evidence_catalog: evidenceCatalog,
  };
}

function requiredArtifact<T>(
  artifact: Artifact<unknown> | undefined,
  name: string,
): Artifact<T> {
  if (!artifact) {
    throw new BuilderValidationError(
      `Missing required Themes dependency: ${name}.`,
    );
  }

  return artifact as Artifact<T>;
}

function invalidCategoryError(
  index: number,
  received: unknown,
): BuilderValidationError {
  return new BuilderValidationError(
    `themes[${index}].category received ${JSON.stringify(received)}; `
    + `allowed values: ${THEME_CATEGORIES.join(", ")}.`,
  );
}
