import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { calculateFileHash } from "../shared/hashing/hash-file.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingSubdirectory } from "../storage/filing-paths.js";
import { listAvailableFilings } from "../storage/list-filings.js";
import type { TopicRegistry } from "../topic-layer/topic.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { buildTopicEvolutionMarkdown } from "./build-topic-evolution-markdown.js";
import { buildTopicEvolutionReport } from "./build-topic-evolution-report.js";
import type { ApprovedTopicTheme, FilingMetadataForEvolution, TopicEvolutionFilingInput } from "./topic-evolution.types.js";

const logger = createLogger("topic-evolution");

export async function generateTopicEvolutionReport(ticker: string): Promise<void> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const filings = await loadTopicEvolutionInputs(company.ticker);
  const registryPath = join(process.cwd(), "data", "registry", "topics.json");
  const registry = await readJsonFile<TopicRegistry>(registryPath);
  const registryHash = await calculateFileHash(registryPath);
  const generatedAt = getCurrentTimestamp();
  const report = buildTopicEvolutionReport({
    filings,
    registry,
    topicRegistryHash: registryHash,
    generatedAt,
    durationMs: Date.now() - startedAt,
  });
  const reportDirectory = join(getCompanyDirectory(company.ticker), "reports");

  await writeJsonFile(join(reportDirectory, "topic-evolution-report.json"), report);
  await writeTextFile(join(reportDirectory, "topic-evolution-report.md"), buildTopicEvolutionMarkdown(report));

  if (report.summary.topics_analyzed === 0) {
    logger.warn("Topic evolution report generated with no approved topics", {
      ticker: company.ticker,
      filings_analyzed: report.filings_analyzed,
      topics_analyzed: report.summary.topics_analyzed,
      approved_assignments_used: report.diagnostics.approved_assignments_used,
      pending_assignments_ignored: report.diagnostics.pending_assignments_ignored,
      strengthening_topics: report.summary.strengthening_topics,
      weakening_topics: report.summary.weakening_topics,
      stable_topics: report.summary.stable_topics,
      mixed_topics: report.summary.mixed_topics,
      unknown_trend_topics: report.summary.unknown_trend_topics,
      missing_topic_files: report.diagnostics.missing_themes_with_topics_files.length,
      duration_ms: report.diagnostics.duration_ms,
    });
    return;
  }

  logger.info("Topic evolution report generated", {
    ticker: company.ticker,
    filings_analyzed: report.filings_analyzed,
    topics_analyzed: report.summary.topics_analyzed,
    topics_present_latest: report.summary.topics_present_latest,
    strengthening_topics: report.summary.strengthening_topics,
    weakening_topics: report.summary.weakening_topics,
    stable_topics: report.summary.stable_topics,
    mixed_topics: report.summary.mixed_topics,
    unknown_trend_topics: report.summary.unknown_trend_topics,
    approved_assignments_used: report.diagnostics.approved_assignments_used,
    pending_assignments_ignored: report.diagnostics.pending_assignments_ignored,
    missing_topic_files: report.diagnostics.missing_themes_with_topics_files.length,
    duration_ms: report.diagnostics.duration_ms,
  });
}

async function loadTopicEvolutionInputs(ticker: string): Promise<TopicEvolutionFilingInput[]> {
  const filingDates = await listAvailableFilings(ticker);
  const inputs: TopicEvolutionFilingInput[] = [];

  for (const filingDate of filingDates) {
    const metadataPath = join(getFilingSubdirectory(ticker, filingDate, "metadata"), "filing.json");
    const themesPath = join(getFilingSubdirectory(ticker, filingDate, "intelligence"), "themes.with-topics.json");

    if (!fileExists(metadataPath)) {
      logger.warn("Skipping filing without metadata", { ticker, filing_date: filingDate });
      continue;
    }

    const metadata = await readJsonFile<FilingMetadataForEvolution>(metadataPath);
    const themesWithTopicsExists = fileExists(themesPath);
    const themes = themesWithTopicsExists
      ? (await readJsonFile<ThemeOutput & { themes: ApprovedTopicTheme[] }>(themesPath)).themes
      : [];

    inputs.push({
      metadata,
      themes,
      themes_with_topics_file_exists: themesWithTopicsExists,
    });
  }

  return inputs;
}

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    logger.error("Usage: npm run topics:evolution -- <ticker>");
    process.exitCode = 1;
  } else {
    generateTopicEvolutionReport(ticker).catch((error) => {
      logger.error("Topic evolution report generation failed", {
        ticker: ticker.trim().toUpperCase(),
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
