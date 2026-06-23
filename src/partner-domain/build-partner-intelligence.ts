import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { buildBusinessHealth } from "./builders/build-business-health.js";
import { buildBusinessHealthDashboard } from "./builders/build-owner-business-health.js";
import { buildCompanyProfile } from "./builders/build-company-profile.js";
import { buildCompanyStory } from "./builders/build-company-story.js";
import { buildCustomerSegments } from "./builders/build-customer-segments.js";
import { buildForensicsSignals } from "./builders/build-forensics-signals.js";
import { buildFiveQuestions } from "./builders/build-five-questions.js";
import { buildMoneyProfile } from "./builders/build-money-profile.js";
import { buildPartnerSummary } from "./builders/build-partner-summary.js";
import { buildTrustProfile } from "./builders/build-trust-profile.js";
import type { PartnerCompanyIntelligence, PartnerIntelligenceSource } from "./partner-domain.types.js";
import type {
  PartnerCompanyKnowledgeSource,
  PartnerQuarterChange,
  PartnerSourceArtifacts,
  PartnerTopicEvolutionSource,
} from "./partner-source.types.js";

const logger = createLogger("partner-domain");

export async function buildPartnerCompanyIntelligence(
  ticker: string,
  filingDate?: string,
): Promise<PartnerCompanyIntelligence> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const artifacts = await loadPartnerSourceArtifacts(company.ticker, resolvedFilingDate);
  const businessHealth = buildBusinessHealth(artifacts);
  const health = buildBusinessHealthDashboard(artifacts, businessHealth);
  const profile = buildCompanyProfile(artifacts);
  const summary = buildPartnerSummary(artifacts, businessHealth);
  const story = buildCompanyStory(artifacts, profile);
  const customers = buildCustomerSegments(artifacts);
  const money = buildMoneyProfile(artifacts, businessHealth);
  const trust = buildTrustProfile(artifacts);
  const forensics = buildForensicsSignals(artifacts);
  const fiveQuestions = buildFiveQuestions({
    artifacts,
    businessHealth,
    health,
    forensics,
  });

  logger.info("Partner intelligence aggregate built.", {
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
    duration_ms: Date.now() - startedAt,
    profile_built: true,
    summary_built: true,
    story_built: true,
    customer_segments: customers.length,
    forensics_signals: forensics.length,
  });

  return {
    ticker: company.ticker,
    companyName: artifacts.filing.company,
    asOfFilingDate: artifacts.filing.filing_date,
    profile,
    summary,
    story,
    customers,
    money,
    trust,
    forensics,
    health,
    fiveQuestions,
    sources: buildSources(artifacts),
  };
}

export async function loadPartnerSourceArtifacts(ticker: string, filingDate: string): Promise<PartnerSourceArtifacts> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const filing = await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json"));
  const companyKnowledge = await readCompanyKnowledge(ticker);
  return {
    filing,
    companyKnowledge,
    themes: await readOptionalJson<ThemeOutput>(join(filingDir, "intelligence", "themes.json")),
    quarterChange: await readOptionalJson<PartnerQuarterChange>(
      join(filingDir, "comparison", "quarter-change-report.json"),
    ),
    topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(
      join(getCompanyDirectory(ticker), "reports", "topic-evolution-report.json"),
    ),
  };
}

async function readCompanyKnowledge(
  ticker: string,
): Promise<PartnerCompanyKnowledgeSource> {
  // const repository = new FileCompanyKnowledgeRepository(process.env.PARTNER_WAREHOUSE_ROOT);
  // const companyKnowledge = await repository.loadCurrent(ticker);

  // if (!companyKnowledge) {
    throw new Error(`Company Knowledge not found for ${ticker.trim().toUpperCase()}`);
  // }

  // return companyKnowledge;
}

async function readOptionalJson<T>(path: string): Promise<T | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<T>(path);
}

function buildSources(artifacts: PartnerSourceArtifacts): PartnerIntelligenceSource[] {
  const sources: PartnerIntelligenceSource[] = [];

  sources.push({ artifact: "company_knowledge" });
  if (artifacts.topicEvolution) sources.push({ artifact: "topic_evolution", generatedAt: artifacts.topicEvolution.generated_at });
  if (artifacts.quarterChange) sources.push({ artifact: "quarter_change" });
  if (artifacts.themes) sources.push({ artifact: "themes" });

  return sources;
}
