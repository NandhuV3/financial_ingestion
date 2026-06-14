import type { ForensicsSignal } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { removeFilingStyleLanguage } from "./business-language.js";
import { isRiskTheme } from "./builder-utils.js";

export function buildForensicsSignals(artifacts: PartnerSourceArtifacts): ForensicsSignal[] {
  
  const riskThemes = (artifacts.themes?.themes ?? []).filter((theme) => isRiskTheme(theme));
  const signals = [
    ...artifacts.companyKnowledge.risks.slice(0, 4).map((risk) => ({
      label: firstSentence(risk, 70),
      severity: "yellow" as const,
      explanation: risk,
    })),
    ...riskThemes.slice(0, 4).map((theme) => ({
      label: theme.theme,
      severity: theme.importance === "high" ? "yellow" as const : "green" as const,
      explanation: theme.summary,
    })),
  ];

  return signals.length > 0
    ? consolidateSignalsByRiskCategory(signals).slice(0, 6)
    : [{
      label: "No obvious risk signal",
      severity: "green",
      explanation: "No specific business warning stood out from the available partner intelligence.",
    }];
}

export function toPartnerRiskLanguage(value: string): string {
  const evidenceIncreaseMatch = value.match(/^(.+?) received more supporting references \((\d+) -> (\d+)\)\.?$/i);

  if (evidenceIncreaseMatch) {
    return `${capitalizePhrase(evidenceIncreaseMatch[1])} is receiving more attention as a business risk.`;
  }

  const highImportanceMatch = value.match(/^(.+?) remains high importance in the current filing\.?$/i);

  if (highImportanceMatch) {
    return `${capitalizePhrase(highImportanceMatch[1])} remains an important business risk.`;
  }

  const emergedMatch = value.match(/^(.+?) emerged as a new filing topic\.?$/i);

  if (emergedMatch) {
    return `${capitalizePhrase(emergedMatch[1])} is newly highlighted as a business consideration.`;
  }

  return removeFilingStyleLanguage(value)
    .replace(/\bsupporting references\b/gi, "business discussion")
    .replace(/\bfiling topic\b/gi, "business consideration")
    .replace(/\bcategory\b/gi, "area");
}

function capitalizePhrase(value: string): string {
  const words = value.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function firstSentence(value: string, maxLength: number): string {
  const sentence = value.split(".")[0] ?? value;
  return sentence.length <= maxLength ? sentence : `${sentence.slice(0, maxLength - 3)}...`;
}

function consolidateSignalsByRiskCategory(signals: ForensicsSignal[]): ForensicsSignal[] {
  const byCategory = new Map<string, ForensicsSignal>();

  for (const signal of signals) {
    const category = categorizeRisk(`${signal.label} ${signal.explanation}`);
    const current = byCategory.get(category);
    const normalizedSignal = {
      ...signal,
      label: category,
      explanation: removeFilingStyleLanguage(signal.explanation),
    };

    if (!current || severityRank(normalizedSignal.severity) > severityRank(current.severity)) {
      byCategory.set(category, normalizedSignal);
    }
  }

  return Array.from(byCategory.values());
}

function categorizeRisk(value: string): string {
  const text = value.toLowerCase();

  if (text.includes("competition") || text.includes("competitive")) return "Competition";
  if (text.includes("cyber") || text.includes("security")) return "Cybersecurity";
  if (text.includes("regulation") || text.includes("regulatory") || text.includes("antitrust")) return "Regulation";
  if (
    text.includes("supply")
    || text.includes("supplier")
    || text.includes("manufacturing")
    || text.includes("tariff")
    || text.includes("import")
    || text.includes("export")
  ) {
    return "Supply Chain";
  }
  if (text.includes("customer concentration") || text.includes("concentration")) return "Customer Concentration";
  if (text.includes("tax")) return "Taxation";
  if (text.includes("macro") || text.includes("economic") || text.includes("currency") || text.includes("foreign exchange")) {
    return "Macroeconomic";
  }
  if (text.includes("privacy")) return "Privacy";
  if (text.includes("ai") || text.includes("artificial intelligence")) return "Artificial Intelligence";

  return firstSentence(value, 70);
}

function severityRank(severity: ForensicsSignal["severity"]): number {
  if (severity === "red") return 3;
  if (severity === "yellow") return 2;
  return 1;
}
