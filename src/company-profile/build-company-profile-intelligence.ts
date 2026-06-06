import { join } from "node:path";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import type { InvestorNarrative } from "../narratives/narrative.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";
import { dedupeStrings, firstSentence, normalizeWhitespace, removeFilingStyleLanguage } from "../partner-domain/builders/business-language.js";
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import type { CompanyProfileIntelligence, CompanyProfileRaw } from "./company-profile.types.js";

const logger = createLogger("company-profile-intelligence");

export type CompanyProfileSourceArtifacts = {
  filing: FilingMetadata;
  themes: ThemeOutput | null;
  topicAssignments: TopicAssignmentOutputV2 | null;
  insight: InvestorInsight | null;
  narrative: InvestorNarrative | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};

type SignalDefinition = {
  label: string;
  keywords: string[];
};

const productSignals: SignalDefinition[] = [
  { label: "cloud services", keywords: ["cloud", "infrastructure", "datacenter", "server capacity"] },
  { label: "software products", keywords: ["software", "productivity", "operating system", "application"] },
  { label: "artificial intelligence capabilities", keywords: ["artificial intelligence", " ai ", "ai services", "ai infrastructure"] },
  { label: "advertising services", keywords: ["advertising", "advertisers", "ad "] },
  { label: "consumer devices", keywords: ["devices", "hardware", "phone", "computer", "tablet", "wearable"] },
  { label: "digital services", keywords: ["services", "subscription", "platform"] },
  { label: "commerce and marketplace services", keywords: ["commerce", "retail", "marketplace", "seller"] },
  { label: "payments and transaction services", keywords: ["payment", "payments", "transaction", "merchant"] },
  { label: "content and entertainment services", keywords: ["content", "streaming", "video", "entertainment", "gaming"] },
  { label: "semiconductors and computing systems", keywords: ["semiconductor", "chip", "gpu", "accelerated computing"] },
];

const customerSignals: SignalDefinition[] = [
  { label: "businesses and organizations", keywords: ["business", "businesses", "organization", "organizations", "enterprise"] },
  { label: "consumers", keywords: ["consumer", "consumers", "people", "users"] },
  { label: "developers and technology teams", keywords: ["developer", "developers", "platform", "cloud"] },
  { label: "advertisers and marketers", keywords: ["advertiser", "advertisers", "advertising"] },
  { label: "merchants and sellers", keywords: ["merchant", "merchants", "seller", "sellers", "marketplace"] },
  { label: "creators and media partners", keywords: ["creator", "creators", "content", "media"] },
  { label: "financial institutions and payment partners", keywords: ["bank", "banks", "payment", "payments", "card"] },
  { label: "governments and public-sector customers", keywords: ["government", "public-sector", "public sector"] },
];

const riskSignals: SignalDefinition[] = [
  { label: "competition", keywords: ["competition", "competitive", "competitor"] },
  { label: "cybersecurity", keywords: ["cyber", "security breach", "security"] },
  { label: "regulation and antitrust", keywords: ["regulation", "regulatory", "antitrust"] },
  { label: "privacy and data protection", keywords: ["privacy", "data protection"] },
  { label: "supply chain and manufacturing", keywords: ["supply", "supplier", "manufacturing", "tariff", "import", "export"] },
  { label: "macroeconomic and currency pressure", keywords: ["macro", "economic", "currency", "foreign exchange", "inflation"] },
  { label: "taxation", keywords: ["tax", "taxation"] },
  { label: "product quality and customer trust", keywords: ["quality", "defect", "customer trust"] },
  { label: "AI execution and infrastructure investment", keywords: ["artificial intelligence", " ai ", "ai infrastructure"] },
];

export function getCompanyProfileDirectory(ticker: string): string {
  return join(getCompanyDirectory(ticker), "company-profile");
}

export function getCompanyProfilePath(ticker: string): string {
  return join(getCompanyProfileDirectory(ticker), "company-profile.json");
}

export function getCompanyProfileRawPath(ticker: string): string {
  return join(getCompanyProfileDirectory(ticker), "company-profile.raw.json");
}

export function getCompanyProfileEnrichedPath(ticker: string): string {
  return join(getCompanyProfileDirectory(ticker), "company-profile.enriched.json");
}

export async function readCompanyProfileIntelligence(ticker: string): Promise<CompanyProfileIntelligence | null> {
  const enrichedPath = getCompanyProfileEnrichedPath(ticker);
  const rawPath = getCompanyProfileRawPath(ticker);
  const compatibilityPath = getCompanyProfilePath(ticker);

  if (fileExists(enrichedPath)) {
    return readJsonFile<CompanyProfileIntelligence>(enrichedPath);
  }

  if (fileExists(rawPath)) {
    return readJsonFile<CompanyProfileIntelligence>(rawPath);
  }

  return fileExists(compatibilityPath) ? readJsonFile<CompanyProfileIntelligence>(compatibilityPath) : null;
}

export async function writeCompanyProfileIntelligence(
  ticker: string,
  profile: CompanyProfileIntelligence,
): Promise<void> {
  await writeJsonFile(getCompanyProfilePath(ticker), profile);
}

export async function writeCompanyProfileRaw(ticker: string, profile: CompanyProfileRaw): Promise<void> {
  await writeJsonFile(getCompanyProfileRawPath(ticker), profile);
  await writeCompanyProfileIntelligence(ticker, profile);
}

export function buildCompanyProfileIntelligence(
  artifacts: CompanyProfileSourceArtifacts,
): CompanyProfileRaw {
  const text = buildArtifactText(artifacts);
  const themes = artifacts.topicAssignments?.themes ?? artifacts.themes?.themes ?? [];

  return {
    company: artifacts.filing.company,
    products: inferSignals(text, productSignals, ["products and services described in company filings"]),
    customers: inferSignals(text, customerSignals, ["customers described in company filings"]),
    business_risks: inferRisks(text, themes),
    themes: dedupeStrings(themes.map((theme) => theme.theme)).slice(0, 20),
    topics: inferTopics(artifacts),
    source_filings: [artifacts.filing.filing_date],
    profile_quality: "raw",
  };
}

export async function buildCompanyProfileIntelligenceForFiling(
  ticker: string,
  filingDate?: string,
): Promise<CompanyProfileRaw> {
  const startedAt = Date.now();
  const resolvedFilingDate = await resolveFilingDate(ticker, filingDate);
  const filingDir = getFilingDirectory(ticker, resolvedFilingDate);
  const filing = await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json"));
  const artifacts: CompanyProfileSourceArtifacts = {
    filing,
    themes: await readOptionalJson<ThemeOutput>(join(filingDir, "intelligence", "themes.json")),
    topicAssignments: await readOptionalJson<TopicAssignmentOutputV2>(
      join(filingDir, "intelligence", "themes.with-topics.json"),
    ),
    insight: await readOptionalJson<InvestorInsight>(join(filingDir, "insights", "investor-insight.json")),
    narrative: await readOptionalJson<InvestorNarrative>(join(filingDir, "narratives", "investor-narrative.json")),
    quarterChange: await readOptionalJson<QuarterChangeReport>(join(filingDir, "comparison", "quarter-change-report.json")),
    topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(
      join(getCompanyDirectory(ticker), "reports", "topic-evolution-report.json"),
    ),
  };
  const profile = buildCompanyProfileIntelligence(artifacts);
  await writeCompanyProfileRaw(ticker, profile);

  logger.info("Company profile intelligence generated.", {
    ticker: filing.ticker,
    filing_date: filing.filing_date,
    duration_ms: Date.now() - startedAt,
    products: profile.products.length,
    customers: profile.customers.length,
    risks: profile.business_risks.length,
  });

  return profile;
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  return fileExists(path) ? readJsonFile<T>(path) : null;
}

function inferRisks(text: string, themes: Theme[]): string[] {
  const themeRiskText = themes
    .filter((theme) => isRiskTheme(theme))
    .map((theme) => removeFilingStyleLanguage(firstSentence(theme.summary, 140)));
  const signalRisks = inferSignals(text, riskSignals, []);
  const risks = dedupeStrings([...themeRiskText, ...signalRisks]);

  return risks.length > 0
    ? risks.slice(0, 6)
    : ["Competition, regulation, operating execution, and customer demand should be monitored over time."];
}

function inferSignals(text: string, definitions: SignalDefinition[], fallback: string[]): string[] {
  const matches = definitions
    .filter((definition) => definition.keywords.some((keyword) => includesKeyword(text, keyword)))
    .map((definition) => definition.label);

  return matches.length > 0 ? dedupeStrings(matches).slice(0, 6) : fallback;
}

function inferTopics(artifacts: CompanyProfileSourceArtifacts): string[] {
  const assignedTopics = artifacts.topicAssignments?.themes
    .map((theme) => theme.topic_id)
    .filter((topicId): topicId is string => Boolean(topicId)) ?? [];
  const categoryTopics = artifacts.themes?.themes.map((theme) => theme.category) ?? [];

  return dedupeStrings([...assignedTopics, ...categoryTopics]).slice(0, 20);
}

function includesKeyword(text: string, keyword: string): boolean {
  return text.includes(keyword.trim().toLowerCase());
}

function buildArtifactText(artifacts: CompanyProfileSourceArtifacts): string {
  return normalizeWhitespace([
    artifacts.filing.company,
    artifacts.narrative?.headline,
    artifacts.narrative?.executive_summary,
    artifacts.narrative?.what_changed,
    artifacts.narrative?.bull_case,
    artifacts.narrative?.bear_case,
    artifacts.insight?.headline,
    artifacts.insight?.executive_summary,
    ...(artifacts.insight?.risks ?? []),
    ...(artifacts.insight?.opportunities ?? []),
    ...(artifacts.themes?.themes.flatMap((theme) => [theme.theme, theme.category, theme.summary]) ?? []),
    ...(artifacts.topicAssignments?.themes.flatMap((theme) => [
      theme.theme,
      theme.category,
      theme.summary,
      theme.topic_id ?? "",
    ]) ?? []),
  ].filter(Boolean).join(" ").toLowerCase());
}

function isRiskTheme(theme: Theme): boolean {
  const text = `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
  return ["risk", "competition", "cybersecurity", "supply", "regulation", "tax", "macro", "privacy"].some((keyword) =>
    text.includes(keyword),
  );
}

async function main(): Promise<void> {
  const [ticker, filingDate] = process.argv.slice(2);

  if (!ticker) {
    throw new Error("Usage: tsx src/company-profile/build-company-profile-intelligence.ts <ticker> [filingDate]");
  }

  const profile = await buildCompanyProfileIntelligenceForFiling(ticker, filingDate);
  console.log(JSON.stringify(profile, null, 2));
}

if (require.main === module) {
  main().catch((error: unknown) => {
    logger.error("Company profile intelligence generation failed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  });
}
