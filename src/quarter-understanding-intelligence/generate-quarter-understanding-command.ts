import { join } from "node:path";
import { FileBusinessSignalRepository } from "../business-signal-intelligence/business-signal.repository.js";
import { deriveReportingPeriodFromMetadata } from "../business-signal-intelligence/generate-business-signals-command.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import { FileCompanyKnowledgeRepository } from "../company-knowledge/company-knowledge.repository.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import { generateQuarterUnderstanding } from "./generate-quarter-understanding.js";
import { FileQuarterUnderstandingRepository } from "./quarter-understanding.repository.js";
import type { QuarterUnderstandingArtifact } from "./types/quarter-understanding.types.js";

const logger = createLogger("quarter-understanding-command");

export type QuarterUnderstandingKind = "strength" | "concern" | "change" | "watchlist";

export async function generateQuarterUnderstandingCommand(
  ticker: string,
  filingDate: string,
): Promise<QuarterUnderstandingArtifact> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const normalizedFilingDate = filingDate.trim();
  const filingDir = getFilingDirectory(normalizedTicker, normalizedFilingDate);
  const warehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;
  const filingMetadata = await readRequiredJson<FilingMetadata>(
    join(filingDir, "metadata", "filing.json"),
    `Missing filing metadata for ${normalizedTicker} ${normalizedFilingDate}. Run filing ingestion before Quarter Understanding.`,
  );
  const reportingPeriod = deriveReportingPeriodFromMetadata(filingMetadata);
  const companyKnowledgeRepository = new FileCompanyKnowledgeRepository(warehouseRoot);
  const companyKnowledge = await companyKnowledgeRepository.loadCurrent(normalizedTicker);

  if (!companyKnowledge) {
    throw new Error(`Missing Company Knowledge for ${normalizedTicker}. Run: npm run generate:company-knowledge -- ${normalizedTicker} ${normalizedFilingDate}`);
  }

  const businessSignalRepository = new FileBusinessSignalRepository(warehouseRoot);
  const businessSignalArtifact = await businessSignalRepository.loadCurrent(normalizedTicker, reportingPeriod);

  if (!businessSignalArtifact) {
    throw new Error(`Missing Business Signals for ${normalizedTicker} ${reportingPeriod}. Run: npm run generate:business-signals -- ${normalizedTicker} ${normalizedFilingDate}`);
  }

  const quarterChange = await readRequiredJson<QuarterChangeReport>(
    join(filingDir, "comparison", "quarter-change-report.json"),
    `Missing quarter-change-report.json for ${normalizedTicker} ${normalizedFilingDate}. Run: npm run compare:changes -- ${normalizedTicker} ${normalizedFilingDate}`,
  );
  const topicEvolution = await readRequiredJson<TopicEvolutionReport>(
    join(getCompanyDirectory(normalizedTicker), "reports", "topic-evolution-report.json"),
    `Missing topic-evolution-report.json for ${normalizedTicker}. Run: npm run generate:topic-evolution -- ${normalizedTicker}`,
  );
  const repository = new FileQuarterUnderstandingRepository(warehouseRoot);
  const artifact = await generateQuarterUnderstanding({
    ticker: normalizedTicker,
    reportingPeriod,
    companyKnowledge,
    businessSignalArtifact,
    quarterChange,
    topicEvolution,
    repository,
  });
  const counts = countUnderstandingsByKind(artifact);
  const artifactPath = quarterUnderstandingCurrentPath(warehouseRoot, normalizedTicker, reportingPeriod);

  logger.info("Quarter Understanding generated.", {
    ticker: normalizedTicker,
    filing_date: normalizedFilingDate,
    reporting_period: reportingPeriod,
    understanding_count: artifact.understandings.length,
    artifact_path: artifactPath,
  });

  for (const kind of ["strength", "concern", "change", "watchlist"] as const) {
    logger.info("Quarter Understanding count.", {
      ticker: normalizedTicker,
      reporting_period: reportingPeriod,
      category: kind,
      count: counts[kind],
    });
  }

  console.log(`Quarter Understanding generated for ${normalizedTicker} ${reportingPeriod}`);
  console.log(`Understandings: ${artifact.understandings.length}`);
  console.log(`Current artifact: ${artifactPath}`);

  return artifact;
}

export function countUnderstandingsByKind(
  artifact: QuarterUnderstandingArtifact,
): Record<QuarterUnderstandingKind, number> {
  const counts: Record<QuarterUnderstandingKind, number> = {
    strength: 0,
    concern: 0,
    change: 0,
    watchlist: 0,
  };

  for (const understanding of artifact.understandings) {
    counts[classifyUnderstandingKind(understanding.summary)] += 1;
  }

  return counts;
}

async function readRequiredJson<T>(path: string, missingMessage: string): Promise<T> {
  if (!fileExists(path)) {
    throw new Error(missingMessage);
  }

  return readJsonFile<T>(path);
}

function classifyUnderstandingKind(summary: string): QuarterUnderstandingKind {
  const normalized = summary.toLowerCase();

  if (/\b(risk|dependency|concern|pressure)\b/.test(normalized)) {
    return "concern";
  }

  if (/\b(watch|monitoring|weakened|disappeared|removed|dormant)\b/.test(normalized)) {
    return "watchlist";
  }

  if (/\b(new|changed|change|evolved|intensified|this quarter|strengthened)\b/.test(normalized)) {
    return "change";
  }

  return "strength";
}

function quarterUnderstandingCurrentPath(
  warehouseRoot: string | undefined,
  ticker: string,
  reportingPeriod: string,
): string {
  return join(
    warehouseRoot ?? join(process.cwd(), "warehouse"),
    "companies",
    ticker.trim().toUpperCase(),
    "quarter-understanding",
    reportingPeriod.trim(),
    "current.json",
  );
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run generate:quarter-understanding -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    generateQuarterUnderstandingCommand(ticker, filingDate).catch((error) => {
      logger.error("Quarter Understanding generation failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
