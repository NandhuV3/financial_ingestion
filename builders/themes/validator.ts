import { createHash } from "node:crypto";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { THEME_CATEGORIES, type Theme, type ThemesArtifactContent } from "./contract.js";
import type {
  FilingEvidenceCatalogEntry,
  ThemeCandidate,
  ThemesBuilderInput,
  ThemesLLMOutput,
} from "./types.js";

const validFilingTypes = new Set(["10-K", "10-Q", "Transcript"]);
const themeOutputKeys = [
  "title",
  "summary",
  "category",
  "evidence_count",
  "evidence",
] as const;
const evidenceOutputKeys = [
  "section",
  "excerpt_hash",
  "page_number",
  "paragraph_reference",
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
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
  requireText(input.filing_content, "filing_content");
  requireText(input.filing_hash, "filing_hash");

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
  evidenceCatalog?: FilingEvidenceCatalogEntry[],
): void {
  requireText(candidate.title, `themes[${index}].title`);
  requireText(candidate.summary, `themes[${index}].summary`);

  if (!THEME_CATEGORIES.includes(candidate.category)) {
    throw invalidCategoryError(index, candidate.category);
  }

  if (!Array.isArray(candidate.evidence) || candidate.evidence.length === 0) {
    throw new BuilderValidationError(`themes[${index}].evidence must contain at least one item.`);
  }

  if (
    !Number.isInteger(candidate.evidence_count)
    || candidate.evidence_count !== candidate.evidence.length
  ) {
    throw new BuilderValidationError(
      `themes[${index}].evidence_count must equal evidence length.`,
    );
  }

  for (const [evidenceIndex, evidence] of candidate.evidence.entries()) {
    requireText(evidence.section, `themes[${index}].evidence[${evidenceIndex}].section`);
    requireText(evidence.excerpt_hash, `themes[${index}].evidence[${evidenceIndex}].excerpt_hash`);

    if (
      evidenceCatalog
      && !evidenceCatalog.some(({ excerpt_hash }) =>
        excerpt_hash === evidence.excerpt_hash)
    ) {
      throw new BuilderValidationError(
        `themes[${index}].evidence[${evidenceIndex}].excerpt_hash is not present in the filing evidence catalog.`,
      );
    }
  }

  rejectForbiddenLanguage(candidate.title, `themes[${index}].title`);
  rejectForbiddenLanguage(candidate.summary, `themes[${index}].summary`);
}

export function validateThemesArtifactContent(content: ThemesArtifactContent): void {
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
      evidence.section,
      `themes[${index}].evidence[${evidenceIndex}].section`,
    );
    requireText(
      evidence.excerpt_hash,
      `themes[${index}].evidence[${evidenceIndex}].excerpt_hash`,
    );
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

  if (!Number.isInteger(value.evidence_count)) {
    throw new BuilderValidationError(
      `themes[${index}].evidence_count must be an integer.`,
    );
  }

  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    throw new BuilderValidationError(
      `themes[${index}].evidence must contain at least one item.`,
    );
  }

  const evidence = value.evidence.map((item, evidenceIndex) =>
    parseSourceEvidence(item, index, evidenceIndex));

  const candidate: ThemeCandidate = {
    title: value.title,
    summary: value.summary,
    category: value.category as ThemeCandidate["category"],
    evidence_count: value.evidence_count as number,
    evidence,
  };

  validateThemeCandidate(candidate, index);

  return candidate;
}

function parseSourceEvidence(
  value: unknown,
  themeIndex: number,
  evidenceIndex: number,
): ThemeCandidate["evidence"][number] {
  const field = `themes[${themeIndex}].evidence[${evidenceIndex}]`;

  if (!isRecord(value)) {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  assertExactKeys(value, evidenceOutputKeys, field);
  requireText(value.section, `${field}.section`);
  requireText(value.excerpt_hash, `${field}.excerpt_hash`);

  if (
    value.page_number !== undefined
    && (!Number.isInteger(value.page_number) || (value.page_number as number) < 0)
  ) {
    throw new BuilderValidationError(
      `${field}.page_number must be a non-negative integer when provided.`,
    );
  }

  if (value.paragraph_reference !== undefined) {
    requireText(value.paragraph_reference, `${field}.paragraph_reference`);
  }

  return {
    section: value.section,
    excerpt_hash: value.excerpt_hash,
    ...(value.page_number === undefined
      ? {}
      : { page_number: value.page_number as number }),
    ...(value.paragraph_reference === undefined
      ? {}
      : { paragraph_reference: value.paragraph_reference as string }),
  };
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  field: string,
): void {
  const actualKeys = Object.keys(value);
  const unknownKeys = actualKeys.filter((key) => !allowedKeys.includes(key));
  const missingKeys = allowedKeys
    .filter((key) => !["page_number", "paragraph_reference"].includes(key))
    .filter((key) => !(key in value));

  if (unknownKeys.length > 0 || missingKeys.length > 0) {
    throw new BuilderValidationError(
      `${field} must contain exactly the canonical fields. `
      + `Unknown: ${unknownKeys.join(", ") || "none"}. `
      + `Missing: ${missingKeys.join(", ") || "none"}.`,
    );
  }
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
