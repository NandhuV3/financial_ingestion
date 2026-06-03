import type { QuarterChange, QuarterChangeReport } from "../change-engine/change.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

const riskCategories = new Set([
  "competition",
  "macroeconomic",
  "regulation",
  "supply_chain",
  "cybersecurity",
  "taxation",
  "product_quality",
  "privacy",
  "antitrust",
]);

const opportunityCategories = new Set(["growth", "investments", "cloud", "artificial_intelligence"]);

export function buildKeyChanges(changeReport: QuarterChangeReport): string[] {
  return changeReport.changes.map(formatChange);
}

export function buildNewTopics(changeReport: QuarterChangeReport): string[] {
  return categoryChanges(changeReport, "NEW_CATEGORY");
}

export function buildRemovedTopics(changeReport: QuarterChangeReport): string[] {
  return categoryChanges(changeReport, "REMOVED_CATEGORY");
}

export function buildRisks(changeReport: QuarterChangeReport, themes: ThemeOutput): string[] {
  const risks: string[] = [];

  for (const change of changeReport.changes) {
    if (change.change_type === "NEW_CATEGORY" && riskCategories.has(change.category)) {
      risks.push(`${formatCategory(change.category)} emerged as a new filing topic.`);
    }

    if (change.change_type === "EVIDENCE_INCREASED" && riskCategories.has(change.category)) {
      risks.push(
        `${formatCategory(change.category)} received more supporting references (${change.previous_evidence_count} -> ${change.current_evidence_count}).`,
      );
    }

    if (change.change_type === "IMPORTANCE_INCREASED" && riskCategories.has(change.category)) {
      risks.push(
        `${formatCategory(change.category)} importance increased from ${change.previous_importance} to ${change.current_importance}.`,
      );
    }
  }

  for (const theme of themes.themes) {
    if (riskCategories.has(theme.category) && theme.importance === "high") {
      risks.push(`${theme.theme} remains high importance in the current filing.`);
    }
  }

  return uniqueSorted(risks);
}

export function buildOpportunities(changeReport: QuarterChangeReport, themes: ThemeOutput): string[] {
  const opportunities: string[] = [];

  for (const change of changeReport.changes) {
    if (change.change_type === "NEW_CATEGORY" && opportunityCategories.has(change.category)) {
      opportunities.push(`${formatCategory(change.category)} emerged as a new filing topic.`);
    }

    if (change.change_type === "EVIDENCE_INCREASED" && opportunityCategories.has(change.category)) {
      opportunities.push(
        `${formatCategory(change.category)} received more supporting references (${change.previous_evidence_count} -> ${change.current_evidence_count}).`,
      );
    }

    if (change.change_type === "IMPORTANCE_INCREASED" && opportunityCategories.has(change.category)) {
      opportunities.push(
        `${formatCategory(change.category)} importance increased from ${change.previous_importance} to ${change.current_importance}.`,
      );
    }
  }

  for (const theme of themes.themes) {
    if (opportunityCategories.has(theme.category) && theme.importance === "high") {
      opportunities.push(`${theme.theme} remains high importance in the current filing.`);
    }
  }

  return uniqueSorted(opportunities);
}

export function buildExecutiveSummary(params: {
  changeReport: QuarterChangeReport;
  keyChanges: string[];
  risks: string[];
  opportunities: string[];
}): string {
  const { changeReport, keyChanges, risks, opportunities } = params;
  const previousDate = changeReport.previous_filing?.filing_date ?? "the prior filing";
  const currentDate = changeReport.current_filing.filing_date;

  return `${changeReport.company}'s ${currentDate} filing shows ${changeReport.summary.new_categories} new categories and ${changeReport.summary.removed_categories} removed categories versus ${previousDate}. The report identified ${changeReport.summary.importance_increases} importance increases, ${changeReport.summary.importance_decreases} importance decreases, ${changeReport.summary.evidence_increases} evidence increases, and ${changeReport.summary.evidence_decreases} evidence decreases. Key investor signals include ${keyChanges.length} tracked changes, ${opportunities.length} opportunity signals, and ${risks.length} risk signals.`;
}

function categoryChanges(changeReport: QuarterChangeReport, changeType: QuarterChange["change_type"]): string[] {
  return changeReport.changes
    .filter((change) => change.change_type === changeType)
    .map((change) => change.category)
    .sort((left, right) => left.localeCompare(right));
}

function formatChange(change: QuarterChange): string {
  if (change.change_type === "NEW_CATEGORY") {
    return `${formatCategory(change.category)} emerged as a new category.`;
  }

  if (change.change_type === "REMOVED_CATEGORY") {
    return `${formatCategory(change.category)} was removed from the current filing themes.`;
  }

  if (change.change_type === "IMPORTANCE_INCREASED") {
    return `${formatCategory(change.category)} importance increased from ${change.previous_importance} to ${change.current_importance}.`;
  }

  if (change.change_type === "IMPORTANCE_DECREASED") {
    return `${formatCategory(change.category)} importance decreased from ${change.previous_importance} to ${change.current_importance}.`;
  }

  if (change.change_type === "EVIDENCE_INCREASED") {
    return `${formatCategory(change.category)} evidence increased from ${change.previous_evidence_count} to ${change.current_evidence_count} references.`;
  }

  return `${formatCategory(change.category)} evidence decreased from ${change.previous_evidence_count} to ${change.current_evidence_count} references.`;
}

function formatCategory(category: string): string {
  return category.replaceAll("_", " ");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
