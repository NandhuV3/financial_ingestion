import { join } from "node:path";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import { getCompanyConfig } from "../config/companies.js";
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
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import type { CompanyIdentityEvidence } from "./company-identity.types.js";

const logger = createLogger("company-identity");

export type CompanyIdentitySourceArtifacts = {
  filing: FilingMetadata;
  themes: ThemeOutput | null;
  topicAssignments: TopicAssignmentOutputV2 | null;
  insight: InvestorInsight | null;
  narrative: InvestorNarrative | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};

type EvidenceSignalDefinition = {
  label: string;
  keywords: string[];
  minSources?: number;
};

const productEvidenceSignals: EvidenceSignalDefinition[] = [
  { label: "cloud infrastructure", keywords: ["cloud", "azure", "aws", "datacenter"] },
  { label: "software products", keywords: ["software", "productivity", "operating system", "application", "subscription"] },
  { label: "developer tools", keywords: ["developer", "github", "developer tools", "developer platform"] },
  { label: "artificial intelligence capabilities", keywords: ["artificial intelligence", " ai ", "ai infrastructure"] },
  { label: "advertising services", keywords: ["advertising", "advertiser", "ads"] },
  { label: "consumer devices", keywords: ["device", "hardware", "iphone", "mac", "ipad", "wearable"] },
  { label: "commerce and marketplace services", keywords: ["retail", "commerce", "marketplace", "seller"] },
  { label: "payment network services", keywords: ["payment", "payments", "transaction", "card"] },
  { label: "semiconductors and computing systems", keywords: ["semiconductor", "chip", "gpu", "accelerated computing"] },
];

const customerEvidenceSignals: EvidenceSignalDefinition[] = [
  { label: "businesses and organizations", keywords: ["businesses", "organization", "organizations", "enterprise", "commercial"], minSources: 1 },
  { label: "consumers", keywords: ["consumer", "consumers", "people", "users"], minSources: 1 },
  { label: "developers and technology teams", keywords: ["developer", "developers", "developer tools", "developer platform"], minSources: 1 },
  { label: "advertisers and marketers", keywords: ["advertiser", "advertisers", "advertising"], minSources: 1 },
  { label: "merchants and sellers", keywords: ["merchant", "merchants", "seller", "sellers", "marketplace"], minSources: 1 },
  { label: "creators and media partners", keywords: ["creator", "creators", "content", "media"], minSources: 1 },
  { label: "financial institutions and payment partners", keywords: ["bank", "banks", "payment", "payments", "card"], minSources: 1 },
  { label: "governments and public-sector customers", keywords: ["government", "public-sector", "public sector"], minSources: 1 },
];

const riskEvidenceSignals: EvidenceSignalDefinition[] = [
  { label: "competition", keywords: ["competition", "competitive", "competitor"] },
  { label: "cybersecurity", keywords: ["cyber", "security breach", "security"] },
  { label: "regulation and antitrust", keywords: ["regulation", "regulatory", "antitrust"] },
  { label: "privacy and data protection", keywords: ["privacy", "data protection"] },
  { label: "supply chain and manufacturing", keywords: ["supply", "supplier", "manufacturing", "tariff", "import", "export"] },
  { label: "macroeconomic and currency pressure", keywords: ["macro", "economic", "currency", "foreign exchange", "inflation"] },
  { label: "taxation", keywords: ["tax", "taxation"] },
  { label: "product quality", keywords: ["quality", "defect", "reliability"] },
  { label: "AI execution risk", keywords: ["artificial intelligence", " ai ", "ai infrastructure"] },
];

export function getCompanyIdentityDirectory(ticker: string): string {
  return join(getCompanyDirectory(ticker), "company-identity");
}

export function getCompanyIdentityEvidencePath(ticker: string): string {
  return join(getCompanyIdentityDirectory(ticker), "company-identity.evidence.json");
}

export function getCompanyIdentityEnrichedPath(ticker: string): string {
  return join(getCompanyIdentityDirectory(ticker), "company-identity.enriched.json");
}

export function getCompanyIdentityPath(ticker: string): string {
  return join(getCompanyIdentityDirectory(ticker), "company-identity.json");
}

export async function buildCompanyIdentityEvidenceForFiling(
  ticker: string,
  filingDate?: string,
): Promise<CompanyIdentityEvidence> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const artifacts = await loadCompanyIdentitySourceArtifacts(company.ticker, resolvedFilingDate);
  const evidence = buildCompanyIdentityEvidence(artifacts);

  await writeJsonFile(getCompanyIdentityEvidencePath(company.ticker), evidence);

  logger.info("Company identity evidence generated.", {
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
    themes: evidence.themes.length,
    topics: evidence.topics.length,
    risks: evidence.risks.length,
  });

  return evidence;
}

export function buildCompanyIdentityEvidence(artifacts: CompanyIdentitySourceArtifacts): CompanyIdentityEvidence {
  const themes = artifacts.topicAssignments?.themes ?? artifacts.themes?.themes ?? [];
  const identitySources = buildIdentityEvidenceSources(artifacts);
  const riskText = buildRiskEvidenceText(artifacts);
  const products = inferEvidenceSignalsFromSources(identitySources, productEvidenceSignals, []);
  const customers = inferCustomers(identitySources, products);

  return {
    company: artifacts.filing.company,
    themes: dedupe(themes.map((theme) => theme.theme)).slice(0, 30),
    topics: inferTopics(artifacts),
    products,
    customers,
    risks: inferRisks(riskText, themes),
    opportunities: inferOpportunityEvidence(artifacts.insight?.opportunities ?? [], themes),
    narrative_summary: artifacts.narrative?.executive_summary ?? artifacts.insight?.executive_summary,
    filing_dates: [artifacts.filing.filing_date],
  };
}

async function loadCompanyIdentitySourceArtifacts(
  ticker: string,
  filingDate: string,
): Promise<CompanyIdentitySourceArtifacts> {
  const filingDir = getFilingDirectory(ticker, filingDate);

  return {
    filing: await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json")),
    themes: await readOptionalJson<ThemeOutput>(join(filingDir, "intelligence", "themes.json")),
    topicAssignments: await readOptionalJson<TopicAssignmentOutputV2>(join(filingDir, "intelligence", "themes.with-topics.json")),
    insight: await readOptionalJson<InvestorInsight>(join(filingDir, "insights", "investor-insight.json")),
    narrative: await readOptionalJson<InvestorNarrative>(join(filingDir, "narratives", "investor-narrative.json")),
    quarterChange: await readOptionalJson<QuarterChangeReport>(join(filingDir, "comparison", "quarter-change-report.json")),
    topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(
      join(getCompanyDirectory(ticker), "reports", "topic-evolution-report.json"),
    ),
  };
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  return fileExists(path) ? readJsonFile<T>(path) : null;
}

function buildIdentityEvidenceSources(artifacts: CompanyIdentitySourceArtifacts): string[] {
  const themes = artifacts.topicAssignments?.themes ?? artifacts.themes?.themes ?? [];
  const identityThemes = themes.filter((theme) => !isRiskTheme(theme));

  return [
    artifacts.filing.company,
    artifacts.narrative?.executive_summary,
    artifacts.narrative?.bull_case,
    artifacts.narrative?.investor_takeaway,
    artifacts.insight?.executive_summary,
    ...identityThemes.flatMap((theme) => [theme.theme, theme.category, theme.summary, getThemeTopicId(theme)]),
  ].filter(Boolean).map((value) => normalize(String(value)));
}

function buildRiskEvidenceText(artifacts: CompanyIdentitySourceArtifacts): string {
  return [
    ...(artifacts.insight?.risks ?? []),
    ...(artifacts.themes?.themes.flatMap((theme) => [theme.theme, theme.category, theme.summary]) ?? []),
    ...(artifacts.topicAssignments?.themes.flatMap((theme) => [theme.theme, theme.category, theme.summary]) ?? []),
    artifacts.narrative?.bear_case,
  ].filter(Boolean).join(" ").toLowerCase();
}

function inferTopics(artifacts: CompanyIdentitySourceArtifacts): string[] {
  const assignedTopics = artifacts.topicAssignments?.themes
    .map((theme) => theme.topic_id)
    .filter((topicId): topicId is string => Boolean(topicId)) ?? [];
  const categories = artifacts.themes?.themes.map((theme) => theme.category) ?? [];

  return dedupe([...assignedTopics, ...categories]).slice(0, 30);
}

function inferRisks(text: string, themes: Theme[]): string[] {
  const themeRiskSignals = themes
    .filter((theme) => isRiskTheme(theme))
    .flatMap((theme) => [theme.category, theme.theme]);
  const normalizedThemeRisks = themeRiskSignals.map((value) => normalizeRiskLabel(value));
  const signalRisks = inferEvidenceSignals(text, riskEvidenceSignals, []);
  const risks = dedupe([...signalRisks, ...normalizedThemeRisks]);

  return risks.length > 0 ? risks.slice(0, 12) : [];
}

function inferCustomers(sources: string[], products: string[]): string[] {
  const explicitCustomers = inferEvidenceSignalsFromSources(sources, customerEvidenceSignals, []);
  const productBackedCustomers = products.flatMap((product) => {
    switch (product) {
      case "cloud infrastructure":
      case "software products":
        return ["businesses and organizations"];
      case "developer tools":
      case "artificial intelligence capabilities":
        return ["developers and technology teams"];
      case "advertising services":
        return ["advertisers and marketers"];
      case "commerce and marketplace services":
        return ["merchants and sellers", "consumers"];
      case "payment network services":
        return ["financial institutions and payment partners", "merchants and sellers"];
      case "consumer devices":
        return ["consumers"];
      default:
        return [];
    }
  });

  return dedupe([...explicitCustomers, ...productBackedCustomers]).slice(0, 8);
}

function inferOpportunityEvidence(opportunities: string[], themes: Theme[]): string[] {
  const themeNames = themes.map((theme) => normalize(theme.theme));
  const weakPhrases = [
    "remains high importance",
    "received more supporting references",
    "emerged as a new filing topic",
    "current filing",
  ];

  return dedupe(opportunities)
    .filter((opportunity) => {
      const normalized = normalize(opportunity);

      return !themeNames.some((themeName) => normalized.includes(themeName))
        && !weakPhrases.some((phrase) => normalized.includes(phrase));
    })
    .slice(0, 8);
}

function inferEvidenceSignalsFromSources(
  sources: string[],
  definitions: EvidenceSignalDefinition[],
  fallback: string[],
): string[] {
  const matched = definitions
    .filter((definition) => {
      const supportingSources = sources.filter((source) =>
        definition.keywords.some((keyword) => source.includes(normalize(keyword))),
      ).length;

      return supportingSources >= (definition.minSources ?? 2);
    })
    .map((definition) => definition.label);

  return matched.length > 0 ? dedupe(matched).slice(0, 12) : fallback;
}

function inferEvidenceSignals(
  text: string,
  definitions: EvidenceSignalDefinition[],
  fallback: string[],
): string[] {
  const normalized = normalize(text);
  const matched = definitions
    .filter((definition) => definition.keywords.some((keyword) => normalized.includes(normalize(keyword))))
    .map((definition) => definition.label);

  return matched.length > 0 ? dedupe(matched).slice(0, 12) : fallback;
}

function isRiskTheme(theme: Theme): boolean {
  const text = `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();
  return ["risk", "competition", "cybersecurity", "supply", "regulation", "tax", "macro", "privacy", "antitrust"].some(
    (keyword) => text.includes(keyword),
  );
}

function normalizeRiskLabel(value: string): string {
  const text = value.toLowerCase().replace(/_/g, " ");

  if (text.includes("competition")) return "competition";
  if (text.includes("cyber")) return "cybersecurity";
  if (text.includes("supply")) return "supply chain and manufacturing";
  if (text.includes("regulation") || text.includes("antitrust")) return "regulation and antitrust";
  if (text.includes("tax")) return "taxation";
  if (text.includes("macro") || text.includes("foreign exchange")) return "macroeconomic and currency pressure";
  if (text.includes("privacy")) return "privacy and data protection";
  if (text.includes("quality")) return "product quality";
  if (text.includes("artificial intelligence") || text === "ai") return "AI execution risk";

  return text.trim();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getThemeTopicId(theme: Theme | TopicAssignmentOutputV2["themes"][number]): string {
  return "topic_id" in theme ? theme.topic_id ?? "" : "";
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run identity:company:evidence -- <ticker> [filingDate]");
    process.exitCode = 1;
  } else {
    buildCompanyIdentityEvidenceForFiling(ticker, filingDate).then((evidence) => {
      console.log(JSON.stringify(evidence, null, 2));
    }).catch((error) => {
      logger.error("Company identity evidence generation failed.", {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
