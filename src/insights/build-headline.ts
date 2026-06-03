import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

const positiveCategories = ["growth", "investments", "cloud"];
const pressureCategories = ["competition", "macroeconomic", "regulation", "supply_chain", "cybersecurity", "taxation"];

export function buildHeadline(changeReport: QuarterChangeReport, themes: ThemeOutput): string {
  const company = changeReport.company;
  const opportunity = findCurrentTheme(themes, positiveCategories);
  const pressure = findPressure(changeReport, themes);

  if (opportunity && pressure) {
    return `${company} shows ${formatTheme(opportunity.theme)} while managing ${formatCategory(pressure)} pressures.`;
  }

  if (opportunity) {
    return `${company} shows ${formatTheme(opportunity.theme)} as a key investor focus.`;
  }

  if (pressure) {
    return `${company} faces ${formatCategory(pressure)} pressures in the latest filing.`;
  }

  return `${company} reports limited quarter-over-quarter business topic change.`;
}

function findCurrentTheme(themes: ThemeOutput, categories: string[]) {
  return themes.themes.find((theme) => categories.includes(theme.category) && theme.importance === "high")
    ?? themes.themes.find((theme) => categories.includes(theme.category));
}

function findPressure(changeReport: QuarterChangeReport, themes: ThemeOutput): string | null {
  const newPressure = changeReport.changes.find(
    (change) => change.change_type === "NEW_CATEGORY" && pressureCategories.includes(change.category),
  );

  if (newPressure) {
    return newPressure.category;
  }

  const evidencePressure = changeReport.changes.find(
    (change) => change.change_type === "EVIDENCE_INCREASED" && pressureCategories.includes(change.category),
  );

  if (evidencePressure) {
    return evidencePressure.category;
  }

  return themes.themes.find((theme) => pressureCategories.includes(theme.category) && theme.importance === "high")?.category ?? null;
}

function formatTheme(theme: string): string {
  return theme.trim().toLowerCase();
}

function formatCategory(category: string): string {
  return category.replaceAll("_", " ");
}
