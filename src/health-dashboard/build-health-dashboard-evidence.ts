import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyConfig } from "../config/companies.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import { buildBusinessHealth } from "../partner-domain/builders/build-business-health.js";
import type { BusinessHealth, BusinessHealthTimelinePoint, OwnerBusinessHealth } from "../partner-domain/partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-domain/partner-source.types.js";
import { loadPartnerSourceArtifacts } from "../partner-domain/build-partner-intelligence.js";
import type { BusinessHealthEvidence, BusinessHealthEvidenceSignal } from "./health-dashboard.types.js";
import { getHealthDashboardEvidencePath } from "./health-dashboard-paths.js";

const logger = createLogger("health-dashboard-evidence");

export async function buildHealthDashboardEvidenceForFiling(
  ticker: string,
  filingDate?: string,
): Promise<BusinessHealthEvidence> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const artifacts = await loadPartnerSourceArtifacts(company.ticker, resolvedFilingDate);
  const evidence = buildHealthDashboardEvidence(artifacts, toOwnerHealth(buildBusinessHealth(artifacts)));

  await writeJsonFile(getHealthDashboardEvidencePath(company.ticker, resolvedFilingDate), evidence);

  logger.info("Business health evidence generated.", {
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
    strengthening_signals: evidence.strengthening_signals.length,
    watch_signals: evidence.watch_signals.length,
  });

  return evidence;
}

export function buildHealthDashboardEvidence(
  artifacts: PartnerSourceArtifacts,
  healthStatus: OwnerBusinessHealth,
): BusinessHealthEvidence {
  return {
    company: artifacts.filing.company,
    ticker: artifacts.filing.ticker,
    filing_date: artifacts.filing.filing_date,
    health_status: healthStatus,
    strengthening_signals: buildStrengtheningSignals(artifacts),
    watch_signals: buildWatchSignals(artifacts),
    risk_signals: artifacts.insight?.risks ?? [],
    timeline: buildHealthTimeline(artifacts, healthStatus),
    generated_at: getCurrentTimestamp(),
  };
}

function buildStrengtheningSignals(artifacts: PartnerSourceArtifacts): BusinessHealthEvidenceSignal[] {
  const topicChanges = artifacts.quarterChange?.topic_changes
    .filter((change) => change.change_type === "TOPIC_INTENSIFIED")
    .map((change) => ({
      source: "topic_change" as const,
      direction: "strengthening" as const,
      raw_label: change.topic_id,
      topic_id: change.topic_id,
      topic_name: change.topic_id,
      change_type: change.change_type,
    })) ?? [];
  const categoryChanges = artifacts.quarterChange?.changes
    .filter((change) => ["NEW_CATEGORY", "EVIDENCE_INCREASED", "IMPORTANCE_INCREASED"].includes(change.change_type))
    .map((change) => ({
      source: "category_change" as const,
      direction: "strengthening" as const,
      raw_label: change.current_theme_names[0] ?? change.category,
      category: change.category,
      change_type: change.change_type,
      theme_names: change.current_theme_names,
    })) ?? [];
  const evolution = artifacts.topicEvolution?.topics
    .filter((topic) => topic.current_status === "present" && topic.trend_state === "strengthening")
    .map((topic) => ({
      source: "topic_evolution" as const,
      direction: "strengthening" as const,
      raw_label: topic.topic_name,
      topic_id: topic.topic_id,
      topic_name: topic.topic_name,
      change_type: topic.trend_state,
      theme_names: topic.history.flatMap((observation) => observation.theme_names),
    })) ?? [];

  return dedupeSignals([...topicChanges, ...categoryChanges, ...evolution]);
}

function buildWatchSignals(artifacts: PartnerSourceArtifacts): BusinessHealthEvidenceSignal[] {
  const topicChanges = artifacts.quarterChange?.topic_changes
    .filter((change) => change.change_type === "TOPIC_WEAKENED")
    .map((change) => ({
      source: "topic_change" as const,
      direction: "watch" as const,
      raw_label: change.topic_id,
      topic_id: change.topic_id,
      topic_name: change.topic_id,
      change_type: change.change_type,
    })) ?? [];
  const categoryChanges = artifacts.quarterChange?.changes
    .filter((change) => ["REMOVED_CATEGORY", "EVIDENCE_DECREASED", "IMPORTANCE_DECREASED"].includes(change.change_type))
    .map((change) => ({
      source: "category_change" as const,
      direction: "watch" as const,
      raw_label: change.current_theme_names[0] ?? change.previous_theme_names[0] ?? change.category,
      category: change.category,
      change_type: change.change_type,
      theme_names: [...change.current_theme_names, ...change.previous_theme_names],
    })) ?? [];
  const evolution = artifacts.topicEvolution?.topics
    .filter((topic) =>
      topic.trend_state === "weakening"
      || topic.presence_state === "disappeared"
      || topic.current_status === "absent")
    .map((topic) => ({
      source: "topic_evolution" as const,
      direction: "watch" as const,
      raw_label: topic.topic_name,
      topic_id: topic.topic_id,
      topic_name: topic.topic_name,
      change_type: topic.trend_state,
      theme_names: topic.history.flatMap((observation) => observation.theme_names),
    })) ?? [];
  const risks = artifacts.insight?.risks.map((risk) => ({
    source: "risk_signal" as const,
    direction: "watch" as const,
    raw_label: risk,
    risk_text: risk,
  })) ?? [];

  return dedupeSignals([...topicChanges, ...categoryChanges, ...evolution, ...risks]);
}

function buildHealthTimeline(
  artifacts: PartnerSourceArtifacts,
  currentStatus: OwnerBusinessHealth,
): BusinessHealthTimelinePoint[] {
  const dates = artifacts.topicEvolution?.filing_dates ?? [artifacts.filing.filing_date];
  const latestDates = dates.slice(-3).reverse();

  return latestDates.map((filingDate, index) => ({
    label: index === 0 ? "Current Filing" : index === 1 ? "Previous Filing" : "Older Filing",
    filingDate,
    status: index === 0 ? currentStatus : inferHistoricalStatus(artifacts, filingDate),
  }));
}

function inferHistoricalStatus(
  artifacts: PartnerSourceArtifacts,
  filingDate: string,
): OwnerBusinessHealth {
  const topicObservations = artifacts.topicEvolution?.topics.flatMap((topic) =>
    topic.history.filter((observation) => observation.filing_date === filingDate),
  ) ?? [];

  if (topicObservations.length === 0) {
    return "stable";
  }

  const present = topicObservations.filter((observation) => observation.present);
  const highImportance = present.filter((observation) => observation.importance === "high").length;
  const absent = topicObservations.length - present.length;

  if (absent > present.length) {
    return "needs_attention";
  }

  if (highImportance >= 2) {
    return "improving";
  }

  return "stable";
}

function toOwnerHealth(value: BusinessHealth): OwnerBusinessHealth {
  return value === "weakening" ? "needs_attention" : value;
}

function dedupeSignals(values: BusinessHealthEvidenceSignal[]): BusinessHealthEvidenceSignal[] {
  const seen = new Set<string>();
  const output: BusinessHealthEvidenceSignal[] = [];

  for (const value of values) {
    const key = [
      value.direction,
      value.topic_id,
      value.category,
      value.raw_label,
      value.change_type,
    ].filter(Boolean).join(":").toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(value);
  }

  return output;
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run health:evidence -- <ticker> [filingDate]");
    process.exitCode = 1;
  } else {
    buildHealthDashboardEvidenceForFiling(ticker, filingDate).catch((error) => {
      logger.error("Business health evidence generation failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
