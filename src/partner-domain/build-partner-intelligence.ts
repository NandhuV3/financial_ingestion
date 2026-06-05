import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import type { InvestorNarrative } from "../narratives/narrative.types.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { buildBusinessHealth } from "./builders/build-business-health.js";
import { buildCompanyProfile } from "./builders/build-company-profile.js";
import { buildCompanyStory } from "./builders/build-company-story.js";
import { buildCustomerSegments } from "./builders/build-customer-segments.js";
import { buildForensicsSignals } from "./builders/build-forensics-signals.js";
import { buildMoneyProfile } from "./builders/build-money-profile.js";
import { buildPartnerSummary } from "./builders/build-partner-summary.js";
import { buildTrustProfile } from "./builders/build-trust-profile.js";
import type { PartnerCompanyIntelligence, PartnerIntelligenceSource } from "./partner-domain.types.js";
import type { PartnerSourceArtifacts, PartnerTopicEvolutionSource } from "./partner-source.types.js";

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
  const profile = buildCompanyProfile(artifacts);
  const summary = buildPartnerSummary(artifacts, businessHealth);
  const story = buildCompanyStory(artifacts, profile);
  const customers = buildCustomerSegments(artifacts);
  const money = buildMoneyProfile(artifacts, businessHealth);
  const trust = buildTrustProfile(artifacts);
  const forensics = buildForensicsSignals(artifacts);

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
    sources: buildSources(artifacts),
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
    topicEvolution: await readOptionalJson<PartnerTopicEvolutionSource>(
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

function buildSources(artifacts: PartnerSourceArtifacts): PartnerIntelligenceSource[] {
  const sources: PartnerIntelligenceSource[] = [];

  if (artifacts.narrative) sources.push({ artifact: "investor_narrative" });
  if (artifacts.insight) sources.push({ artifact: "investor_insight" });
  if (artifacts.topicEvolution) sources.push({ artifact: "topic_evolution", generatedAt: artifacts.topicEvolution.generated_at });
  if (artifacts.quarterChange) sources.push({ artifact: "quarter_change" });
  if (artifacts.themes) sources.push({ artifact: "themes" });

  return sources;
}
