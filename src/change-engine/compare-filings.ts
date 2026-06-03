import type { ComparisonInput } from "../comparison/comparison.types.js";
import type { Theme, ThemeImportance, ThemeOutput } from "../types/theme.types.js";
import type { CategorySnapshot, QuarterChange, QuarterChangeReport } from "./change.types.js";

const importanceRank: Record<ThemeImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function compareFilings(input: ComparisonInput): QuarterChangeReport {
  const previousCategories = buildCategorySnapshots(input.previousThemes);
  const currentCategories = buildCategorySnapshots(input.currentThemes);
  const categoryNames = uniqueSorted([...previousCategories.keys(), ...currentCategories.keys()]);
  const changes: QuarterChange[] = [];

  for (const category of categoryNames) {
    const previous = previousCategories.get(category) ?? null;
    const current = currentCategories.get(category) ?? null;

    if (!previous && current) {
      changes.push(buildChange("NEW_CATEGORY", category, previous, current));
      continue;
    }

    if (previous && !current) {
      changes.push(buildChange("REMOVED_CATEGORY", category, previous, current));
      continue;
    }

    if (!previous || !current) {
      continue;
    }

    const previousImportanceRank = importanceRank[previous.importance];
    const currentImportanceRank = importanceRank[current.importance];

    if (currentImportanceRank > previousImportanceRank) {
      changes.push(buildChange("IMPORTANCE_INCREASED", category, previous, current));
    } else if (currentImportanceRank < previousImportanceRank) {
      changes.push(buildChange("IMPORTANCE_DECREASED", category, previous, current));
    }

    if (current.evidence_count > previous.evidence_count) {
      changes.push(buildChange("EVIDENCE_INCREASED", category, previous, current));
    } else if (current.evidence_count < previous.evidence_count) {
      changes.push(buildChange("EVIDENCE_DECREASED", category, previous, current));
    }
  }

  return {
    company: input.currentFiling.metadata.company,
    ticker: input.currentFiling.metadata.ticker,
    previous_filing: input.previousFiling?.metadata ?? null,
    current_filing: input.currentFiling.metadata,
    summary: buildSummary(changes),
    changes,
    topic_changes: [],
    topic_summary: {
      persisted_topics: 0,
      evolved_topics: 0,
      intensified_topics: 0,
      weakened_topics: 0,
    },
  };
}

export function buildCategorySnapshots(themeOutput: ThemeOutput | null): Map<string, CategorySnapshot> {
  const categoryThemes = new Map<string, Theme[]>();

  for (const theme of themeOutput?.themes ?? []) {
    const category = theme.category.trim();
    const themes = categoryThemes.get(category) ?? [];

    themes.push(theme);
    categoryThemes.set(category, themes);
  }

  return new Map(
    [...categoryThemes.entries()]
      .map(([category, themes]) => {
        const evidence = uniqueSorted(themes.flatMap((theme) => theme.evidence));
        const snapshot: CategorySnapshot = {
          category,
          theme_names: uniqueSorted(themes.map((theme) => theme.theme)),
          importance: highestImportance(themes.map((theme) => theme.importance)),
          evidence,
          evidence_count: evidence.length,
        };

        return [category, snapshot] as const;
      })
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function buildChange(
  changeType: QuarterChange["change_type"],
  category: string,
  previous: CategorySnapshot | null,
  current: CategorySnapshot | null,
): QuarterChange {
  return {
    change_type: changeType,
    category,
    previous_importance: previous?.importance ?? null,
    current_importance: current?.importance ?? null,
    previous_evidence_count: previous?.evidence_count ?? 0,
    current_evidence_count: current?.evidence_count ?? 0,
    previous_theme_names: previous?.theme_names ?? [],
    current_theme_names: current?.theme_names ?? [],
  };
}

function buildSummary(changes: QuarterChange[]): QuarterChangeReport["summary"] {
  return {
    new_categories: countChanges(changes, "NEW_CATEGORY"),
    removed_categories: countChanges(changes, "REMOVED_CATEGORY"),
    importance_increases: countChanges(changes, "IMPORTANCE_INCREASED"),
    importance_decreases: countChanges(changes, "IMPORTANCE_DECREASED"),
    evidence_increases: countChanges(changes, "EVIDENCE_INCREASED"),
    evidence_decreases: countChanges(changes, "EVIDENCE_DECREASED"),
  };
}

function countChanges(changes: QuarterChange[], changeType: QuarterChange["change_type"]): number {
  return changes.filter((change) => change.change_type === changeType).length;
}

function highestImportance(values: ThemeImportance[]): ThemeImportance {
  return values.reduce((highest, current) =>
    importanceRank[current] > importanceRank[highest] ? current : highest,
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
