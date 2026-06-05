import type { ForensicsSignal } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { isRiskTheme } from "./builder-utils.js";

export function buildForensicsSignals(artifacts: PartnerSourceArtifacts): ForensicsSignal[] {
  const riskItems = artifacts.insight?.risks ?? [];
  const riskThemes = (artifacts.themes?.themes ?? []).filter((theme) => isRiskTheme(theme));
  const signals = [
    ...riskItems.slice(0, 4).map((risk) => ({
      label: firstSentence(toPartnerRiskLanguage(risk), 70),
      severity: "yellow" as const,
      explanation: toPartnerRiskLanguage(risk),
    })),
    ...riskThemes.slice(0, 4).map((theme) => ({
      label: theme.theme,
      severity: theme.importance === "high" ? "yellow" as const : "green" as const,
      explanation: theme.summary,
    })),
  ];

  return signals.length > 0
    ? dedupeSignals(signals).slice(0, 6)
    : [{
      label: "No obvious risk signal",
      severity: "green",
      explanation: "The available partner intelligence artifacts did not produce a specific forensics warning.",
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

  return value
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

function dedupeSignals(signals: ForensicsSignal[]): ForensicsSignal[] {
  const seen = new Set<string>();
  const deduped: ForensicsSignal[] = [];

  for (const signal of signals) {
    const key = signal.label.trim().toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(signal);
    }
  }

  return deduped;
}
