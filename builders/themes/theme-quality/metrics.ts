import type { Theme } from "../contract.js";

export const THEME_QUALITY_ROUNDING_PRECISION = 4;

/**
 * Owner: Theme Quality evaluation.
 * Purpose: identify materially similar text without semantic models.
 * Justification: a majority token overlap is a conservative near-duplicate
 * signal and remains observational.
 * Range: 0..1.
 */
export const THEME_TEXT_OVERLAP_THRESHOLD = 0.5;

export function roundThemeQualityMetric(value: number): number {
  const scale = 10 ** THEME_QUALITY_ROUNDING_PRECISION;
  return Math.round(value * scale) / scale;
}

export function evidenceReferenceCounts(
  themes: Theme[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const theme of themes) {
    for (const { evidence_ref: evidenceRef } of theme.evidence) {
      counts.set(evidenceRef, (counts.get(evidenceRef) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Herfindahl concentration index over Theme evidence selections:
 * sum((reference_selection_count / total_selections) ^ 2).
 */
export function calculateEvidenceConcentration(themes: Theme[]): number {
  const counts = evidenceReferenceCounts(themes);
  const totalSelections = [...counts.values()]
    .reduce((total, count) => total + count, 0);

  if (totalSelections === 0) {
    return 0;
  }

  return roundThemeQualityMetric(
    [...counts.values()].reduce(
      (total, count) => total + (count / totalSelections) ** 2,
      0,
    ),
  );
}

export function countExactDuplicateThemes(themes: Theme[]): number {
  const counts = new Map<string, number>();

  for (const theme of themes) {
    const key = normalizeThemeIdentity(theme.title, theme.summary);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
}

export function countOverlappingThemePairs(themes: Theme[]): number {
  let overlapCount = 0;

  for (let leftIndex = 0; leftIndex < themes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < themes.length;
      rightIndex += 1
    ) {
      const left = themes[leftIndex]!;
      const right = themes[rightIndex]!;

      if (
        normalizeThemeIdentity(left.title, left.summary)
        === normalizeThemeIdentity(right.title, right.summary)
      ) {
        continue;
      }

      if (themesOverlap(left, right)) {
        overlapCount += 1;
      }
    }
  }

  return overlapCount;
}

function normalizeThemeIdentity(title: string, summary: string): string {
  return `${title} ${summary}`
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function themesOverlap(left: Theme, right: Theme): boolean {
  const combinedTextSimilarity = jaccardSimilarity(
    textTokens(`${left.title} ${left.summary}`),
    textTokens(`${right.title} ${right.summary}`),
  );

  if (combinedTextSimilarity >= THEME_TEXT_OVERLAP_THRESHOLD) {
    return true;
  }

  const evidenceSimilarity = jaccardSimilarity(
    new Set(left.evidence.map(({ evidence_ref }) => evidence_ref)),
    new Set(right.evidence.map(({ evidence_ref }) => evidence_ref)),
  );
  const titleSimilarity = jaccardSimilarity(
    textTokens(left.title),
    textTokens(right.title),
  );

  return evidenceSimilarity === 1 && titleSimilarity > 0;
}

function textTokens(value: string): Set<string> {
  return new Set(
    value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map(normalizeToken)
      .filter((token) => token.length > 1),
  );
}

function normalizeToken(token: string): string {
  if (token.length > 5 && token.endsWith("ing")) {
    return token.slice(0, -3);
  }

  if (token.length > 4 && token.endsWith("ed")) {
    return token.slice(0, -2);
  }

  if (token.length > 3 && token.endsWith("s")) {
    return token.slice(0, -1);
  }

  return token;
}

function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);

  if (union.size === 0) {
    return 0;
  }

  const intersectionSize = [...left]
    .filter((value) => right.has(value))
    .length;

  return intersectionSize / union.size;
}
