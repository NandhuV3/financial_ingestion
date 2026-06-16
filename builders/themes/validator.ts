import { createHash } from "node:crypto";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { THEME_CATEGORIES, type Theme, type ThemesArtifactContent } from "./contract.js";
import type { ThemeCandidate, ThemesBuilderInput, ThemesLLMOutput } from "./types.js";

const validFilingTypes = new Set(["10-K", "10-Q", "Transcript"]);
const validImportance = new Set(["low", "medium", "high"]);
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

    if (!isRecord(parsed) || !Array.isArray(parsed.themes)) {
      throw new BuilderValidationError("Themes LLM output must contain a themes array.");
    }

    return parsed as ThemesLLMOutput;
  } catch (error) {
    if (error instanceof BuilderValidationError) {
      throw error;
    }

    throw new BuilderValidationError("Themes LLM output must be valid JSON.", error);
  }
}

export function validateThemeCandidate(candidate: ThemeCandidate, index: number): void {
  requireText(candidate.title, `themes[${index}].title`);
  requireText(candidate.description, `themes[${index}].description`);

  if (!THEME_CATEGORIES.includes(candidate.category)) {
    throw new BuilderValidationError(`themes[${index}].category is invalid.`);
  }

  if (!validImportance.has(candidate.importance)) {
    throw new BuilderValidationError(`themes[${index}].importance is invalid.`);
  }

  if (!Array.isArray(candidate.evidence) || candidate.evidence.length === 0) {
    throw new BuilderValidationError(`themes[${index}].evidence must contain at least one item.`);
  }

  for (const [evidenceIndex, evidence] of candidate.evidence.entries()) {
    requireText(evidence.section, `themes[${index}].evidence[${evidenceIndex}].section`);
    requireText(evidence.excerpt_hash, `themes[${index}].evidence[${evidenceIndex}].excerpt_hash`);
  }

  rejectForbiddenLanguage(candidate.title, `themes[${index}].title`);
  rejectForbiddenLanguage(candidate.description, `themes[${index}].description`);
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

export function normalizeThemeKey(title: string, description: string): string {
  return `${title} ${description}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createThemeId(filingId: string, title: string, description: string): string {
  return createHash("sha256")
    .update(`${filingId}:${normalizeThemeKey(title, description)}`, "utf8")
    .digest("hex");
}

function validateTheme(theme: Theme, index: number): void {
  requireText(theme.theme_id, `themes[${index}].theme_id`);
  validateThemeCandidate({
    title: theme.title,
    description: theme.description,
    category: theme.category,
    importance: theme.importance,
    evidence: theme.source_evidence,
    frequency: theme.frequency,
  }, index);
  validateConfidence(theme.confidence, `themes[${index}].confidence`);
}

function validateConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireText(value: unknown, field: string): void {
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

