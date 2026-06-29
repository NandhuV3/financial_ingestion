import { createHash } from "node:crypto";
import type {
  ThemeInputBoundaryContent,
  ThemeVisibleEvidenceEntry,
} from "../../contracts/execution/theme-input-boundary-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  THEME_CATEGORIES,
  type Theme,
  type ThemesArtifactContent,
} from "./contract.js";
import type {
  ThemeCandidate,
  ThemePromptEvidence,
  ThemesBuilderInput,
  ThemesLLMOutput,
} from "./types.js";

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
  /\bprice target\b/i,
  /\binvestment thesis\b/i,
  /\binvestor conclusion\b/i,
  /\bmanagement (is|appears|seems) credible\b/i,
  /\bstrong competitive moat\b/i,
  /\bexcellent execution\b/i,
];

export function validateThemesInput(input: ThemesBuilderInput): void {
  if (input.theme_input_boundary === undefined) {
    throw new BuilderValidationError(
      "Themes Builder requires Theme Input Boundary content.",
    );
  }

  validateThemeInputBoundaryContent(input.theme_input_boundary);
}

export function validateNoThemesDependencies(
  dependencies: Record<string, unknown>,
): void {
  const dependencyNames = Object.keys(dependencies);

  if (dependencyNames.length > 0) {
    throw new BuilderValidationError(
      `Themes must consume only Theme Input Boundary content. Unsupported dependencies: ${dependencyNames.join(", ")}.`,
    );
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
  promptEvidence: ThemePromptEvidence[],
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

  const suppliedIndexes = new Set(
    promptEvidence.map(({ paragraph_index }) => paragraph_index),
  );
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

    if (!suppliedIndexes.has(paragraphIndex)) {
      throw new BuilderValidationError(
        `themes[${index}].paragraph_indexes[${paragraphIndexPosition}] `
        + "is not present in the supplied Theme Input Boundary evidence.",
      );
    }
  }

  rejectForbiddenLanguage(candidate.title, `themes[${index}].title`);
  rejectForbiddenLanguage(candidate.summary, `themes[${index}].summary`);
}

export function validateThemesArtifactContent(input: {
  content: ThemesArtifactContent;
  themeInputBoundary: ThemeInputBoundaryContent;
  promptId: string;
  promptVersion: string;
  reasoningVersion: string;
  renderHash: string;
  modelName: string;
  modelVersion: string;
}): void {
  const {
    content,
    themeInputBoundary,
    promptId,
    promptVersion,
    reasoningVersion,
    renderHash,
    modelName,
    modelVersion,
  } = input;
  const visibleEvidenceRefs = new Set(
    themeInputBoundary.visible_evidence.map(({ evidence_ref }) => evidence_ref),
  );

  requireText(content.company_id, "content.company_id");
  requireText(content.period_id, "content.period_id");
  requireText(content.filing_id, "content.filing_id");

  if (content.filing_id !== themeInputBoundary.filing_id) {
    throw new BuilderValidationError(
      "Themes filing_id must match Theme Input Boundary filing_id.",
    );
  }

  requireExactText(content.prompt_id, promptId, "content.prompt_id");
  requireExactText(content.prompt_version, promptVersion, "content.prompt_version");
  requireExactText(content.reasoning_version, reasoningVersion, "content.reasoning_version");
  requireExactText(content.render_hash, renderHash, "content.render_hash");
  requireExactText(content.model_name, modelName, "content.model_name");
  requireExactText(content.model_version, modelVersion, "content.model_version");

  if (!Array.isArray(content.themes)) {
    throw new BuilderValidationError("content.themes must be an array.");
  }

  const themeIds = new Set<string>();
  const normalizedThemes = new Set<string>();

  for (const [index, theme] of content.themes.entries()) {
    validateTheme({
      theme,
      index,
      promptId,
      promptVersion,
      reasoningVersion,
      visibleEvidenceRefs,
    });

    if (themeIds.has(theme.theme_id)) {
      throw new BuilderValidationError(
        `content.themes contains duplicate theme_id: ${theme.theme_id}.`,
      );
    }

    themeIds.add(theme.theme_id);

    const normalizedTheme = normalizeThemeKey(theme.title, theme.summary);

    if (normalizedThemes.has(normalizedTheme)) {
      throw new BuilderValidationError(
        `content.themes[${index}] duplicates another Theme narrative.`,
      );
    }

    normalizedThemes.add(normalizedTheme);
  }
}

export function normalizeThemeKey(title: string, summary: string): string {
  return `${title} ${summary}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createThemeId(
  filingId: string,
  title: string,
  summary: string,
  evidenceRefs: string[],
): string {
  return createHash("sha256")
    .update(JSON.stringify({
      filing_id: filingId,
      theme: normalizeThemeKey(title, summary),
      evidence_refs: evidenceRefs,
    }), "utf8")
    .digest("hex");
}

export function buildPromptEvidence(
  visibleEvidence: ThemeVisibleEvidenceEntry[],
): ThemePromptEvidence[] {
  return visibleEvidence.map((entry, index) => ({
    paragraph_index: index + 1,
    section_name: entry.section_name,
    paragraph_text: entry.paragraph_text,
  }));
}

export function buildPromptEvidenceIndex(input: {
  visibleEvidence: ThemeVisibleEvidenceEntry[];
  promptEvidence: ThemePromptEvidence[];
}): Map<number, ThemeVisibleEvidenceEntry> {
  const index = new Map<number, ThemeVisibleEvidenceEntry>();

  for (const [position, promptEvidence] of input.promptEvidence.entries()) {
    index.set(promptEvidence.paragraph_index, input.visibleEvidence[position]!);
  }

  return index;
}

function validateThemeInputBoundaryContent(
  content: ThemeInputBoundaryContent,
): void {
  requireText(content.grounding_result_id, "theme_input_boundary.grounding_result_id");
  requireText(content.filing_id, "theme_input_boundary.filing_id");
  requireText(content.filing_hash, "theme_input_boundary.filing_hash");
  requireText(content.input_version, "theme_input_boundary.input_version");

  if (
    !Array.isArray(content.visible_evidence)
    || content.visible_evidence.length === 0
  ) {
    throw new BuilderValidationError(
      "theme_input_boundary.visible_evidence must contain at least one item.",
    );
  }

  const evidenceRefs = new Set<string>();

  for (const [index, evidence] of content.visible_evidence.entries()) {
    requireText(evidence.evidence_ref, `visible_evidence[${index}].evidence_ref`);
    requireText(evidence.section_name, `visible_evidence[${index}].section_name`);
    requireText(evidence.paragraph_text, `visible_evidence[${index}].paragraph_text`);

    if (
      !Number.isInteger(evidence.paragraph_index)
      || evidence.paragraph_index < 1
    ) {
      throw new BuilderValidationError(
        `visible_evidence[${index}].paragraph_index must be a positive integer.`,
      );
    }

    if (evidenceRefs.has(evidence.evidence_ref)) {
      throw new BuilderValidationError(
        `theme_input_boundary.visible_evidence contains duplicate evidence_ref: ${evidence.evidence_ref}.`,
      );
    }

    evidenceRefs.add(evidence.evidence_ref);
  }
}

function validateTheme(input: {
  theme: Theme;
  index: number;
  promptId: string;
  promptVersion: string;
  reasoningVersion: string;
  visibleEvidenceRefs: Set<string>;
}): void {
  const {
    theme,
    index,
    promptId,
    promptVersion,
    reasoningVersion,
    visibleEvidenceRefs,
  } = input;

  requireText(theme.theme_id, `themes[${index}].theme_id`);
  requireText(theme.title, `themes[${index}].title`);
  requireText(theme.summary, `themes[${index}].summary`);
  requireExactText(theme.prompt_id, promptId, `themes[${index}].prompt_id`);
  requireExactText(
    theme.prompt_version,
    promptVersion,
    `themes[${index}].prompt_version`,
  );
  requireExactText(
    theme.reasoning_version,
    reasoningVersion,
    `themes[${index}].reasoning_version`,
  );

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

  const themeEvidenceRefs = new Set<string>();

  for (const [evidenceIndex, evidence] of theme.evidence.entries()) {
    requireText(
      evidence.evidence_ref,
      `themes[${index}].evidence[${evidenceIndex}].evidence_ref`,
    );

    if (!visibleEvidenceRefs.has(evidence.evidence_ref)) {
      throw new BuilderValidationError(
        `themes[${index}].evidence[${evidenceIndex}].evidence_ref is not visible in Theme Input Boundary.`,
      );
    }

    if (themeEvidenceRefs.has(evidence.evidence_ref)) {
      throw new BuilderValidationError(
        `themes[${index}].evidence must contain unique evidence_ref values.`,
      );
    }

    themeEvidenceRefs.add(evidence.evidence_ref);
  }

  if (theme.evidence_count !== theme.evidence.length) {
    throw new BuilderValidationError(
      `themes[${index}].evidence_count must equal evidence length.`,
    );
  }

  if (theme.extraction_confidence === undefined) {
    throw new BuilderValidationError(
      `themes[${index}].extraction_confidence is required.`,
    );
  }

  validateConfidence(
    theme.extraction_confidence,
    `themes[${index}].extraction_confidence`,
  );
  rejectForbiddenLanguage(theme.title, `themes[${index}].title`);
  rejectForbiddenLanguage(theme.summary, `themes[${index}].summary`);
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

function requireExactText(
  value: unknown,
  expected: string,
  field: string,
): void {
  requireText(value, field);

  if (value !== expected) {
    throw new BuilderValidationError(
      `${field} must equal ${expected}.`,
    );
  }
}

function rejectForbiddenLanguage(value: string, field: string): void {
  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    throw new BuilderValidationError(`${field} contains forbidden downstream reasoning language.`);
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

function invalidCategoryError(
  index: number,
  received: unknown,
): BuilderValidationError {
  return new BuilderValidationError(
    `themes[${index}].category received ${JSON.stringify(received)}; `
    + `allowed values: ${THEME_CATEGORIES.join(", ")}.`,
  );
}
