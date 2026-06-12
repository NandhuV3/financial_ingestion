import type { Theme } from "../../types/theme.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";

export function findTheme(
  themes: Theme[],
  keywords: string[],
): Theme | undefined {
  return themes.find((theme) => {
    const text =
      `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
}

export function findRiskTheme(themes: Theme[]): Theme | undefined {
  return themes.find((theme) => isRiskTheme(theme));
}

export function isRiskTheme(theme: Theme): boolean {
  const text =
    `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
  return [
    "risk",
    "competition",
    "cybersecurity",
    "supply",
    "regulation",
    "tax",
    "macro",
  ].some((keyword) => text.includes(keyword));
}

export function inferWhoTheyServe(artifacts: PartnerSourceArtifacts): string {
  const text = getArtifactText(artifacts);

  if (
    text.includes("cloud") ||
    text.includes("business") ||
    text.includes("organization")
  ) {
    return "Businesses, organizations, developers, and consumers that rely on its products and services.";
  }

  if (text.includes("consumer") || text.includes("customers")) {
    return "Consumers and customers that use its products and services.";
  }

  return "Customers described in the company's latest filing.";
}

export function getArtifactText(artifacts: PartnerSourceArtifacts): string {
  return [
    artifacts.companyKnowledge.business_description,
    ...artifacts.companyKnowledge.products,
    ...artifacts.companyKnowledge.customers,
    ...artifacts.companyKnowledge.strategic_priorities,
    ...artifacts.companyKnowledge.risks,
    ...(artifacts.themes?.themes.map((theme) => theme.summary) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function calculateConviction(
  artifacts: PartnerSourceArtifacts,
): "low" | "medium" | "high" {
  const sourceCount = [
    artifacts.companyKnowledge,
    artifacts.themes,
    artifacts.quarterChange,
    artifacts.topicEvolution,
  ].filter(Boolean).length;

  if (sourceCount >= 4) return "high";
  if (sourceCount >= 2) return "medium";
  return "low";
}
