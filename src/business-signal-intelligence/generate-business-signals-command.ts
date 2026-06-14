import { join } from "node:path";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import { FileCompanyKnowledgeRepository } from "../company-knowledge/company-knowledge.repository.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { createLogger } from "../shared/logger.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import { FileBusinessSignalRepository } from "./business-signal.repository.js";
import { generateBusinessSignals } from "./generate-business-signals.js";
import type { BusinessSignalArtifact, BusinessSignalType } from "./types/business-signal.types.js";

const logger = createLogger("business-signals-command");

export async function generateBusinessSignalsCommand(ticker: string, filingDate: string): Promise<BusinessSignalArtifact> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const normalizedFilingDate = filingDate.trim();
  const filingDir = getFilingDirectory(normalizedTicker, normalizedFilingDate);
  const warehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;
  const filingMetadata = await readRequiredJson<FilingMetadata>(
    join(filingDir, "metadata", "filing.json"),
    `Missing filing metadata for ${normalizedTicker} ${normalizedFilingDate}. Run filing ingestion before Business Signals.`,
  );
  const reportingPeriod = deriveReportingPeriodFromMetadata(filingMetadata);
  const companyKnowledgeRepository = new FileCompanyKnowledgeRepository(warehouseRoot);
  const companyKnowledge = await companyKnowledgeRepository.loadCurrent(normalizedTicker);

  if (!companyKnowledge) {
    throw new Error(`Missing Company Knowledge for ${normalizedTicker}. Run: npm run generate:company-knowledge -- ${normalizedTicker} ${normalizedFilingDate}`);
  }

  const quarterChange = await readRequiredJson<QuarterChangeReport>(
    join(filingDir, "comparison", "quarter-change-report.json"),
    `Missing quarter-change-report.json for ${normalizedTicker} ${normalizedFilingDate}. Run: npm run compare:changes -- ${normalizedTicker} ${normalizedFilingDate}`,
  );
  const topicEvolution = await readRequiredJson<TopicEvolutionReport>(
    join(getCompanyDirectory(normalizedTicker), "reports", "topic-evolution-report.json"),
    `Missing topic-evolution-report.json for ${normalizedTicker}. Run: npm run generate:topic-evolution -- ${normalizedTicker}`,
  );
  const repository = new FileBusinessSignalRepository(warehouseRoot);
  const artifact = await generateBusinessSignals({
    ticker: normalizedTicker,
    reportingPeriod,
    companyKnowledge,
    quarterChange,
    topicEvolution,
    filingMetadata,
    repository,
  });
  const counts = countSignalsByType(artifact);
  const artifactPath = businessSignalsCurrentPath(warehouseRoot, normalizedTicker, reportingPeriod);

  logger.info("Business Signals generated.", {
    ticker: normalizedTicker,
    filing_date: normalizedFilingDate,
    reporting_period: reportingPeriod,
    signal_count: artifact.signals.length,
    artifact_path: artifactPath,
  });

  for (const [signalType, count] of Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))) {
    logger.info("Business Signal count.", {
      ticker: normalizedTicker,
      reporting_period: reportingPeriod,
      signal_type: signalType,
      count: count ?? 0,
    });
  }

  console.log(`Business Signals generated for ${normalizedTicker} ${reportingPeriod}`);
  console.log(`Signals: ${artifact.signals.length}`);
  console.log(`Current artifact: ${artifactPath}`);

  return artifact;
}

export function deriveReportingPeriodFromMetadata(metadata: FilingMetadata): string {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(metadata.filing_date.trim());

  if (!match) {
    throw new Error(`Cannot derive reporting period from filing_date "${metadata.filing_date}".`);
  }

  const year = match[1];
  const month = Number(match[2]);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Cannot derive reporting period from filing_date "${metadata.filing_date}".`);
  }

  return `${year}-Q${Math.ceil(month / 3)}`;
}

export function countSignalsByType(artifact: BusinessSignalArtifact): Partial<Record<BusinessSignalType, number>> {
  const counts: Partial<Record<BusinessSignalType, number>> = {};

  for (const signal of artifact.signals) {
    counts[signal.signal_type] = (counts[signal.signal_type] ?? 0) + 1;
  }

  return counts;
}

async function readRequiredJson<T>(path: string, missingMessage: string): Promise<T> {
  if (!fileExists(path)) {
    throw new Error(missingMessage);
  }

  return readJsonFile<T>(path);
}

function businessSignalsCurrentPath(warehouseRoot: string | undefined, ticker: string, reportingPeriod: string): string {
  return join(
    warehouseRoot ?? join(process.cwd(), "warehouse"),
    "companies",
    ticker.trim().toUpperCase(),
    "business-signals",
    reportingPeriod.trim(),
    "current.json",
  );
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    logger.error("Usage: npm run generate:business-signals -- <ticker> <filing-date>", {});
    process.exitCode = 1;
  } else {
    generateBusinessSignalsCommand(ticker, filingDate).catch((error) => {
      logger.error("Business Signal generation failed.", {
        ticker,
        filing_date: filingDate,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  }
}
