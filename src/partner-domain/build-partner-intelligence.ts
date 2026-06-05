import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import type { InvestorNarrative } from "../narratives/narrative.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { getFilingDirectory, getCompanyDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type {
  BusinessHealth,
  CompanyProfile,
  CompanyStory,
  CustomerSegment,
  ForensicsSignal,
  MoneyProfile,
  PartnerCompanyIntelligence,
  PartnerIntelligenceSource,
  PartnerSummary,
  TrustProfile,
} from "./partner-domain.types.js";

type PartnerSourceArtifacts = {
  filing: FilingMetadata;
  themes: ThemeOutput | null;
  insight: InvestorInsight | null;
  narrative: InvestorNarrative | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: { summary?: Record<string, number>; generated_at?: string } | null;
};

export async function buildPartnerCompanyIntelligence(
  ticker: string,
  filingDate?: string,
): Promise<PartnerCompanyIntelligence> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const artifacts = await loadPartnerSourceArtifacts(company.ticker, resolvedFilingDate);
  const profile = buildCompanyProfile(artifacts);
  const businessHealth = mapBusinessHealth(artifacts);

  return {
    ticker: company.ticker,
    companyName: artifacts.filing.company,
    asOfFilingDate: artifacts.filing.filing_date,
    profile,
    summary: buildPartnerSummary(artifacts, businessHealth),
    story: buildCompanyStory(artifacts, profile),
    customers: buildCustomerSegments(artifacts),
    money: buildMoneyProfile(artifacts, businessHealth),
    trust: buildTrustProfile(artifacts),
    forensics: buildForensicsSignals(artifacts),
    sources: buildSources(company.ticker, resolvedFilingDate, artifacts),
  };
}

async function loadPartnerSourceArtifacts(ticker: string, filingDate: string): Promise<PartnerSourceArtifacts> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const filing = await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json"));

  return {
    filing,
    themes: await readOptionalJson<ThemeOutput>(join(filingDir, "intelligence", "themes.json")),
    insight: await readOptionalJson<InvestorInsight>(join(filingDir, "insights", "investor-insight.json")),
    narrative: await readOptionalJson<InvestorNarrative>(join(filingDir, "narratives", "investor-narrative.json")),
    quarterChange: await readOptionalJson<QuarterChangeReport>(join(filingDir, "comparison", "quarter-change-report.json")),
    topicEvolution: await readOptionalJson<{ summary?: Record<string, number>; generated_at?: string }>(
      join(getCompanyDirectory(ticker), "reports", "topic-evolution-report.json"),
    ),
  };
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<T>(path);
}

function buildCompanyProfile(artifacts: PartnerSourceArtifacts): CompanyProfile {
  const growthTheme = findTheme(artifacts.themes?.themes ?? [], ["growth", "cloud", "revenue"]);
  const narrative = artifacts.narrative;

  return {
    ticker: artifacts.filing.ticker,
    companyName: artifacts.filing.company,
    tagline: narrative?.headline ?? `${artifacts.filing.company} business overview`,
    whatTheyDo: growthTheme?.summary ?? narrative?.executive_summary ?? `${artifacts.filing.company} operates a public business described in its latest filing.`,
    whoTheyServe: inferWhoTheyServe(artifacts),
  };
}

function buildPartnerSummary(artifacts: PartnerSourceArtifacts, businessHealth: BusinessHealth): PartnerSummary {
  const narrative = artifacts.narrative;
  const insight = artifacts.insight;

  return {
    headline: narrative?.headline ?? insight?.headline ?? `${artifacts.filing.company} business summary`,
    summary: narrative?.investor_takeaway ?? narrative?.executive_summary ?? insight?.executive_summary ?? "Business summary is not available from current artifacts.",
    businessHealth,
    conviction: calculateConviction(artifacts),
  };
}

function buildCompanyStory(artifacts: PartnerSourceArtifacts, profile: CompanyProfile): CompanyStory {
  const themes = artifacts.themes?.themes ?? [];
  const opportunity = findTheme(themes, ["growth", "cloud", "investment", "investments"]);
  const risk = findRiskTheme(themes);

  return {
    whatTheyDo: profile.whatTheyDo,
    whoBuys: profile.whoTheyServe,
    whyTheyWin: opportunity?.summary ?? artifacts.narrative?.bull_case ?? "The current artifacts do not yet explain the company's advantage clearly.",
    whatCouldGoWrong: risk?.summary ?? artifacts.narrative?.bear_case ?? "The current artifacts do not yet identify a specific business risk.",
  };
}

function buildCustomerSegments(artifacts: PartnerSourceArtifacts): CustomerSegment[] {
  const text = [
    artifacts.narrative?.executive_summary,
    artifacts.narrative?.bull_case,
    artifacts.insight?.executive_summary,
    ...(artifacts.themes?.themes.map((theme) => theme.summary) ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  const segments: CustomerSegment[] = [];

  if (text.includes("consumer") || text.includes("people")) {
    segments.push({
      customerType: "Consumers",
      whyTheyBuy: "They use the company's products and services in everyday personal workflows.",
      importance: "important",
    });
  }

  if (text.includes("business") || text.includes("organization") || text.includes("enterprise") || text.includes("cloud")) {
    segments.push({
      customerType: "Businesses and organizations",
      whyTheyBuy: "They rely on the company's products and services to run, communicate, analyze, and grow.",
      importance: "core",
    });
  }

  if (text.includes("developer") || text.includes("platform") || text.includes("ai")) {
    segments.push({
      customerType: "Developers and technology teams",
      whyTheyBuy: "They build on the company's platforms, tools, cloud infrastructure, or AI capabilities.",
      importance: "important",
    });
  }

  return segments.length > 0
    ? segments
    : [{
      customerType: "Customers",
      whyTheyBuy: "The current artifacts do not yet provide a detailed customer breakdown.",
      importance: "important",
    }];
}

function buildMoneyProfile(artifacts: PartnerSourceArtifacts, businessHealth: BusinessHealth): MoneyProfile {
  const themes = artifacts.themes?.themes ?? [];
  const growthTheme = findTheme(themes, ["growth", "revenue", "sales", "cloud"]);
  const marginTheme = findTheme(themes, ["margin", "margins", "cost"]);

  return {
    dailySales: {
      label: "Revenue",
      plainLanguageName: "Daily Sales",
      explanation: growthTheme?.summary ?? "The current artifacts do not yet provide a plain-language sales trend.",
      status: growthTheme ? businessHealth : undefined,
    },
    whatsLeftAfterCosts: {
      label: "Margin",
      plainLanguageName: "What's Left After Costs",
      explanation: marginTheme?.summary ?? "The current artifacts do not yet provide a clear margin explanation.",
      status: marginTheme ? businessHealth : undefined,
    },
    loansToExpand: {
      label: "Debt",
      plainLanguageName: "Loans To Expand",
      explanation: "Debt and balance sheet detail are not yet populated by the current intelligence pipeline.",
    },
    moneyInTheDrawer: {
      label: "Cashflow",
      plainLanguageName: "Money In The Drawer",
      explanation: "Cashflow detail is not yet populated by the current intelligence pipeline.",
    },
    overallExplanation: "This view translates business finance into plain language. Some fields will become richer when financial statement extraction is added.",
  };
}

function buildTrustProfile(_artifacts: PartnerSourceArtifacts): TrustProfile {
  return {
    managementQuality: "Management quality is not yet directly scored by the current intelligence pipeline.",
    longTermThinking: "Long-term thinking will be enriched by future proxy, capital allocation, and multi-year analysis.",
    capitalAllocation: "Capital allocation detail is only partially available from current filing intelligence.",
    skinInTheGame: "Ownership and insider alignment are not yet populated.",
    confidence: "low",
    dataAvailability: "partial",
  };
}

function buildForensicsSignals(artifacts: PartnerSourceArtifacts): ForensicsSignal[] {
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

function toPartnerRiskLanguage(value: string): string {
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

function mapBusinessHealth(artifacts: PartnerSourceArtifacts): BusinessHealth {
  const summary = artifacts.topicEvolution?.summary ?? {};
  const strengthening = Number(summary.strengthening_topics ?? 0) + Number(summary.new_topics ?? 0);
  const weakening = Number(summary.weakening_topics ?? 0) + Number(summary.disappeared_topics ?? 0);
  const quarterSummary = artifacts.quarterChange?.summary;

  if (quarterSummary) {
    const positiveQuarterSignals = quarterSummary.importance_increases + quarterSummary.evidence_increases;
    const negativeQuarterSignals = quarterSummary.importance_decreases + quarterSummary.evidence_decreases + quarterSummary.removed_categories;

    if (negativeQuarterSignals > positiveQuarterSignals + 1) {
      return "weakening";
    }

    if (positiveQuarterSignals > negativeQuarterSignals + 1) {
      return "improving";
    }
  }

  if (weakening > strengthening + 1) {
    return "weakening";
  }

  if (strengthening > weakening + 1) {
    return "improving";
  }

  return "stable";
}

function calculateConviction(artifacts: PartnerSourceArtifacts): "low" | "medium" | "high" {
  const sourceCount = [
    artifacts.themes,
    artifacts.insight,
    artifacts.narrative,
    artifacts.quarterChange,
    artifacts.topicEvolution,
  ].filter(Boolean).length;

  if (sourceCount >= 4) return "high";
  if (sourceCount >= 2) return "medium";
  return "low";
}

function buildSources(_ticker: string, _filingDate: string, artifacts: PartnerSourceArtifacts): PartnerIntelligenceSource[] {
  const sources: PartnerIntelligenceSource[] = [];

  if (artifacts.narrative) sources.push({ artifact: "investor_narrative" });
  if (artifacts.insight) sources.push({ artifact: "investor_insight" });
  if (artifacts.topicEvolution) sources.push({ artifact: "topic_evolution", generatedAt: artifacts.topicEvolution.generated_at });
  if (artifacts.quarterChange) sources.push({ artifact: "quarter_change" });
  if (artifacts.themes) sources.push({ artifact: "themes" });

  return sources;
}

function inferWhoTheyServe(artifacts: PartnerSourceArtifacts): string {
  const text = [
    artifacts.narrative?.executive_summary,
    artifacts.narrative?.bull_case,
    artifacts.insight?.executive_summary,
    ...(artifacts.themes?.themes.map((theme) => theme.summary) ?? []),
  ].filter(Boolean).join(" ").toLowerCase();

  if (text.includes("cloud") || text.includes("business") || text.includes("organization")) {
    return "Businesses, organizations, developers, and consumers that rely on its products and services.";
  }

  if (text.includes("consumer") || text.includes("customers")) {
    return "Consumers and customers that use its products and services.";
  }

  return "Customers described in the company's latest filing.";
}

function findTheme(themes: Theme[], keywords: string[]): Theme | undefined {
  return themes.find((theme) => {
    const text = `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
}

function findRiskTheme(themes: Theme[]): Theme | undefined {
  return themes.find((theme) => isRiskTheme(theme));
}

function isRiskTheme(theme: Theme): boolean {
  const text = `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
  return ["risk", "competition", "cybersecurity", "supply", "regulation", "tax", "macro"].some((keyword) =>
    text.includes(keyword),
  );
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
