import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { listAvailableFilings } from "../storage/list-filings.js";
import type { Theme, ThemeImportance, ThemeOutput } from "../types/theme.types.js";

type FilingThemeSnapshot = {
  filing_date: string;
  company: string;
  ticker: string;
  themes: Theme[];
};

type CategoryAppearance = {
  filing_date: string;
  theme_names: string[];
  importance_values: ThemeImportance[];
  highest_importance: ThemeImportance;
};

type ImportanceChange = {
  from_filing_date: string;
  to_filing_date: string;
  from_importance: ThemeImportance;
  to_importance: ThemeImportance;
  direction: "increased" | "decreased";
};

type CategoryStability = {
  category: string;
  first_appearance: string;
  last_appearance: string;
  quarters_present: string[];
  theme_names_used: string[];
  importance_values_used: ThemeImportance[];
  appearances: CategoryAppearance[];
  importance_changes: ImportanceChange[];
};

type CategoryPersistence = {
  present_all_quarters: string[];
  appearing_only_once: string[];
  newly_introduced: string[];
  disappearing: string[];
};

type QuarterReviewReport = {
  company: string;
  ticker: string;
  filing_dates_analyzed: string[];
  missing_theme_filings: string[];
  total_filings_analyzed: number;
  categories: CategoryStability[];
  persistence: CategoryPersistence;
  observations: string[];
};

const importanceRank: Record<ThemeImportance, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export async function generateQuarterReview(ticker: string): Promise<QuarterReviewReport> {
  const company = getCompanyConfig(ticker);
  const { snapshots, missingThemeFilings } = await loadHistoricalThemes(company.ticker);
  const sortedSnapshots = sortFilingThemeSnapshots(snapshots);
  const categories = buildCategoryStability(sortedSnapshots);
  const persistence = analyzeCategoryPersistence(categories, sortedSnapshots.map((snapshot) => snapshot.filing_date));
  const observations = buildObservations(categories, persistence, sortedSnapshots.length);
  const report: QuarterReviewReport = {
    company: company.company,
    ticker: company.ticker,
    filing_dates_analyzed: sortedSnapshots.map((snapshot) => snapshot.filing_date),
    missing_theme_filings: missingThemeFilings,
    total_filings_analyzed: sortedSnapshots.length,
    categories,
    persistence,
    observations,
  };
  const reportsDir = join(getCompanyDirectory(company.ticker), "reports");
  const jsonPath = join(reportsDir, "quarter-review.json");
  const markdownPath = join(reportsDir, "quarter-review.md");

  await writeJsonFile(jsonPath, report);
  await writeTextFile(markdownPath, buildMarkdownReport(report));

  console.log(`Quarter review generated for ${company.company} (${company.ticker})`);
  console.log(`Filings analyzed: ${report.filing_dates_analyzed.join(", ")}`);
  console.log(`Missing theme filings: ${report.missing_theme_filings.join(", ") || "none"}`);
  console.log(`JSON report: ${jsonPath}`);
  console.log(`Markdown report: ${markdownPath}`);

  return report;
}

export async function loadHistoricalThemes(ticker: string): Promise<{
  snapshots: FilingThemeSnapshot[];
  missingThemeFilings: string[];
}> {
  const filings = await listAvailableFilings(ticker);
  const snapshots: FilingThemeSnapshot[] = [];
  const missingThemeFilings: string[] = [];

  for (const filingDate of filings) {
    const themePath = join(getFilingDirectory(ticker, filingDate), "intelligence", "themes.json");

    if (!fileExists(themePath)) {
      missingThemeFilings.push(filingDate);
      continue;
    }

    const themeOutput = await readJsonFile<ThemeOutput>(themePath);
    snapshots.push({
      filing_date: filingDate,
      company: themeOutput.company,
      ticker: themeOutput.ticker,
      themes: themeOutput.themes,
    });
  }

  return {
    snapshots,
    missingThemeFilings,
  };
}

export function sortFilingThemeSnapshots(snapshots: FilingThemeSnapshot[]): FilingThemeSnapshot[] {
  return [...snapshots].sort((left, right) => left.filing_date.localeCompare(right.filing_date));
}

export function buildCategoryStability(snapshots: FilingThemeSnapshot[]): CategoryStability[] {
  const categoryMap = new Map<string, CategoryAppearance[]>();

  for (const snapshot of snapshots) {
    const themesByCategory = groupThemesByCategory(snapshot.themes);

    for (const [category, themes] of themesByCategory) {
      const importanceValues = uniqueImportanceValues(themes.map((theme) => theme.importance));
      const appearance: CategoryAppearance = {
        filing_date: snapshot.filing_date,
        theme_names: uniqueSorted(themes.map((theme) => theme.theme)),
        importance_values: importanceValues,
        highest_importance: highestImportance(importanceValues),
      };
      const appearances = categoryMap.get(category) ?? [];

      appearances.push(appearance);
      categoryMap.set(category, appearances);
    }
  }

  return [...categoryMap.entries()]
    .map(([category, appearances]) => {
      const sortedAppearances = [...appearances].sort((left, right) => left.filing_date.localeCompare(right.filing_date));
      return {
        category,
        first_appearance: sortedAppearances[0].filing_date,
        last_appearance: sortedAppearances.at(-1)?.filing_date ?? sortedAppearances[0].filing_date,
        quarters_present: sortedAppearances.map((appearance) => appearance.filing_date),
        theme_names_used: uniqueSorted(sortedAppearances.flatMap((appearance) => appearance.theme_names)),
        importance_values_used: uniqueImportanceValues(
          sortedAppearances.flatMap((appearance) => appearance.importance_values),
        ),
        appearances: sortedAppearances,
        importance_changes: trackImportanceChanges(sortedAppearances),
      };
    })
    .sort((left, right) => left.category.localeCompare(right.category));
}

export function analyzeCategoryPersistence(
  categories: CategoryStability[],
  filingDates: string[],
): CategoryPersistence {
  const firstFiling = filingDates[0] ?? "";
  const latestFiling = filingDates.at(-1) ?? "";

  return {
    present_all_quarters: categories
      .filter((category) => category.quarters_present.length === filingDates.length)
      .map((category) => category.category)
      .sort(),
    appearing_only_once: categories
      .filter((category) => category.quarters_present.length === 1)
      .map((category) => category.category)
      .sort(),
    newly_introduced: categories
      .filter((category) => category.first_appearance !== firstFiling)
      .map((category) => category.category)
      .sort(),
    disappearing: categories
      .filter((category) => category.last_appearance !== latestFiling)
      .map((category) => category.category)
      .sort(),
  };
}

export function trackImportanceChanges(appearances: CategoryAppearance[]): ImportanceChange[] {
  const changes: ImportanceChange[] = [];

  for (let index = 1; index < appearances.length; index += 1) {
    const previous = appearances[index - 1];
    const current = appearances[index];
    const previousRank = importanceRank[previous.highest_importance];
    const currentRank = importanceRank[current.highest_importance];

    if (previousRank === currentRank) {
      continue;
    }

    changes.push({
      from_filing_date: previous.filing_date,
      to_filing_date: current.filing_date,
      from_importance: previous.highest_importance,
      to_importance: current.highest_importance,
      direction: currentRank > previousRank ? "increased" : "decreased",
    });
  }

  return changes;
}

export function buildObservations(
  categories: CategoryStability[],
  persistence: CategoryPersistence,
  totalFilings: number,
): string[] {
  const observations: string[] = [];

  for (const category of persistence.present_all_quarters) {
    observations.push(`${category} appeared in all ${totalFilings} quarters.`);
  }

  for (const category of persistence.appearing_only_once) {
    const detail = categories.find((candidate) => candidate.category === category);
    observations.push(`${category} appeared only once (${detail?.first_appearance ?? "unknown filing"}).`);
  }

  for (const category of persistence.newly_introduced) {
    const detail = categories.find((candidate) => candidate.category === category);
    observations.push(`${category} was newly introduced in ${detail?.first_appearance ?? "unknown filing"}.`);
  }

  for (const category of persistence.disappearing) {
    const detail = categories.find((candidate) => candidate.category === category);
    observations.push(`${category} disappeared after ${detail?.last_appearance ?? "unknown filing"}.`);
  }

  for (const category of categories) {
    for (const change of category.importance_changes) {
      observations.push(
        `${category.category} importance ${change.direction} from ${change.from_importance} to ${change.to_importance} between ${change.from_filing_date} and ${change.to_filing_date}.`,
      );
    }
  }

  return uniqueSorted(observations);
}

function buildMarkdownReport(report: QuarterReviewReport): string {
  const lines: string[] = [
    `# Quarter Review: ${report.company} (${report.ticker})`,
    "",
    "## Filings Analyzed",
    ...report.filing_dates_analyzed.map((filingDate) => `- ${filingDate}`),
    "",
    "## Missing Theme Filings",
    report.missing_theme_filings.length ? "" : "- none",
    ...report.missing_theme_filings.map((filingDate) => `- ${filingDate}`),
    "",
    "## Category Persistence",
    `- Present in all quarters: ${formatList(report.persistence.present_all_quarters)}`,
    `- Appearing only once: ${formatList(report.persistence.appearing_only_once)}`,
    `- Newly introduced: ${formatList(report.persistence.newly_introduced)}`,
    `- Disappearing: ${formatList(report.persistence.disappearing)}`,
    "",
    "## Theme Stability",
  ];

  for (const category of report.categories) {
    lines.push("");
    lines.push(`### ${category.category}`);
    lines.push(`- First appearance: ${category.first_appearance}`);
    lines.push(`- Last appearance: ${category.last_appearance}`);
    lines.push(`- Quarters present: ${category.quarters_present.join(", ")}`);
    lines.push(`- Theme names used: ${formatList(category.theme_names_used)}`);
    lines.push(`- Importance values used: ${formatList(category.importance_values_used)}`);

    for (const appearance of category.appearances) {
      lines.push(`- ${appearance.filing_date}: ${appearance.theme_names.join("; ")}`);
    }

    if (category.importance_changes.length > 0) {
      lines.push("- Importance changes:");
      for (const change of category.importance_changes) {
        lines.push(
          `  - ${change.from_filing_date} -> ${change.to_filing_date}: ${change.from_importance} -> ${change.to_importance} (${change.direction})`,
        );
      }
    }
  }

  lines.push("");
  lines.push("## Observations");
  lines.push(...report.observations.map((observation) => `- ${observation}`));

  return `${lines.join("\n")}\n`;
}

function groupThemesByCategory(themes: Theme[]): Map<string, Theme[]> {
  const grouped = new Map<string, Theme[]>();

  for (const theme of themes) {
    const category = theme.category.trim();
    const existing = grouped.get(category) ?? [];

    existing.push(theme);
    grouped.set(category, existing);
  }

  return grouped;
}

function highestImportance(values: ThemeImportance[]): ThemeImportance {
  return values.reduce((highest, current) =>
    importanceRank[current] > importanceRank[highest] ? current : highest,
  );
}

function uniqueImportanceValues(values: ThemeImportance[]): ThemeImportance[] {
  return [...new Set(values)].sort((left, right) => importanceRank[left] - importanceRank[right]);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function formatList(values: string[]): string {
  return values.length ? values.join(", ") : "none";
}

const ticker = process.argv[2];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run analyze:quarters -- <ticker>");
    process.exitCode = 1;
  } else {
    generateQuarterReview(ticker).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
