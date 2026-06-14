import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { calculateFileHash } from "../shared/hashing/hash-file.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingSubdirectory } from "../storage/filing-paths.js";
import { listAvailableFilings } from "../storage/list-filings.js";
import type { TopicRegistry } from "../topic-intelligence/topic.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { buildTopicEvolutionMarkdown } from "./build-topic-evolution-markdown.js";
import { buildTopicEvolutionReport } from "./build-topic-evolution-report.js";
import type { AssignedTopicTheme, FilingMetadataForEvolution, TopicEvolutionFilingInput } from "./topic-evolution.types.js";

const logger = createLogger("topic-evolution");

export async function generateTopicEvolutionReport(ticker: string): Promise<void> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const filings = await loadTopicEvolutionInputs(company.ticker);

  validateTopicEvolutionPreflight(filings);

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

  logger.info("Topic evolution inputs processed", {
    ticker: company.ticker,
    filings_analyzed: report.filings_analyzed,
    assigned_topics_discovered: report.diagnostics.assigned_topics_used,
    unassigned_topics_ignored: report.diagnostics.unassigned_topics_ignored,
    themes_without_topic_ignored: report.diagnostics.themes_without_topic_ignored,
    missing_topic_files: report.diagnostics.missing_themes_with_topics_files.length,
    filings_with_no_assigned_topics: report.diagnostics.filings_with_no_assigned_topics.join(", "),
  });

  if (report.summary.topics_analyzed === 0) {
    logger.warn("Topic evolution report generated with no assigned topics", {
      ticker: company.ticker,
      filings_analyzed: report.filings_analyzed,
      topics_analyzed: report.summary.topics_analyzed,
      assigned_topics_used: report.diagnostics.assigned_topics_used,
      unassigned_topics_ignored: report.diagnostics.unassigned_topics_ignored,
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
    assigned_topics_used: report.diagnostics.assigned_topics_used,
    unassigned_topics_ignored: report.diagnostics.unassigned_topics_ignored,
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
      ? (await readJsonFile<ThemeOutput & { themes: AssignedTopicTheme[] }>(themesPath)).themes
      : [];

    inputs.push({
      metadata,
      themes,
      themes_with_topics_file_exists: themesWithTopicsExists,
    });
  }

  return inputs;
}

export function validateTopicEvolutionPreflight(inputs: TopicEvolutionFilingInput[]): void {
  const missingThemesWithTopics = inputs
    .filter((input) => !input.themes_with_topics_file_exists)
    .map((input) => input.metadata.filing_date);

  if (missingThemesWithTopics.length > 0) {
    throw new Error([
      "Cannot generate Topic Evolution because themes.with-topics.json is missing for one or more filings.",
      `Missing filing dates: ${missingThemesWithTopics.join(", ")}.`,
      "Run: npm run generate:topic-assignments -- <ticker> <filing-date>",
    ].join(" "));
  }

  const assignedTopicCount = inputs.reduce((count, input) =>
    count + input.themes.filter((theme) =>
      (theme.assignment_status === "assigned" || theme.assignment_status === "low_confidence") && Boolean(theme.topic_id),
    ).length, 0);

  if (assignedTopicCount === 0) {
    const filingDates = inputs.map((input) => input.metadata.filing_date).join(", ");

    throw new Error([
      "Cannot generate Topic Evolution because no assigned or low_confidence topics were found.",
      `Filings checked: ${filingDates || "none"}.`,
      "Run semantic topic matching before topic assignment: npm run generate:topic-matches -- <ticker> <filing-date>",
    ].join(" "));
  }
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
