import type { ThemeCategory } from "../contract.js";
import { THEME_CATEGORIES } from "../contract.js";
import {
  calculateEvidenceConcentration,
  countExactDuplicateThemes,
  countOverlappingThemePairs,
  evidenceReferenceCounts,
  roundThemeQualityMetric,
} from "./metrics.js";
import type {
  ThemeQualityInput,
  ThemeQualityMetrics,
} from "./types.js";

export function evaluateThemeQuality(
  input: ThemeQualityInput,
): ThemeQualityMetrics {
  const evidenceCounts = evidenceReferenceCounts(input.themes);
  const catalogReferenceSet = new Set(
    input.evidenceCatalog.map(({ evidence_ref }) => evidence_ref),
  );
  const usedCatalogReferences = [...evidenceCounts.keys()]
    .filter((reference) => catalogReferenceSet.has(reference));
  const catalogSections = new Set(
    input.evidenceCatalog.map(({ section_name }) => section_name),
  );
  const usedSections = new Set(
    input.themes.flatMap((theme) =>
      theme.evidence
        .map(({ section_name: sectionName }) => sectionName)
        .filter((sectionName): sectionName is string =>
          sectionName !== undefined)),
  );

  return {
    theme_count: input.themes.length,
    evidence_utilization: ratio(
      usedCatalogReferences.length,
      input.evidenceCatalog.length,
    ),
    unique_evidence_refs: evidenceCounts.size,
    evidence_concentration: calculateEvidenceConcentration(input.themes),
    duplicate_count: countExactDuplicateThemes(input.themes),
    overlap_count: countOverlappingThemePairs(input.themes),
    category_distribution: categoryDistribution(input.themes),
    section_coverage: ratio(usedSections.size, catalogSections.size),
    section_distribution: sectionDistribution(
      input.themes,
      [...catalogSections],
    ),
    theme_density: ratio(input.themes.length, input.evidenceCatalog.length),
  };
}

function categoryDistribution(
  themes: ThemeQualityInput["themes"],
): Record<string, number> {
  const distribution = Object.fromEntries(
    THEME_CATEGORIES.map((category) => [category, 0]),
  ) as Record<ThemeCategory, number>;

  for (const { category } of themes) {
    distribution[category] += 1;
  }

  return distribution;
}

function sectionDistribution(
  themes: ThemeQualityInput["themes"],
  catalogSections: string[],
): Record<string, number> {
  const distribution = new Map<string, number>(
    catalogSections.map((sectionName) => [sectionName, 0]),
  );

  for (const theme of themes) {
    for (const { section_name: sectionName } of theme.evidence) {
      if (sectionName === undefined) {
        continue;
      }

      distribution.set(
        sectionName,
        (distribution.get(sectionName) ?? 0) + 1,
      );
    }
  }

  return Object.fromEntries(
    [...distribution.entries()].sort(([left], [right]) =>
      left.localeCompare(right)),
  );
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0
    ? 0
    : roundThemeQualityMetric(numerator / denominator);
}
