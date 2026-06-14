import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { HISTORICAL_INGESTION_DEFAULTS } from "../config/ingestion.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingSubdirectory } from "../storage/filing-paths.js";
import { getLatestAvailableFiling } from "../storage/list-filings.js";
import type { CompanyConfig } from "../types/company.types.js";
import type {
  AvailableFiling,
  FilingMetadata,
  HistoricalDiscoveredFiling,
  HistoricalIngestionEntry,
  HistoricalIngestionFailure,
  HistoricalIngestionReport,
  PipelineMetadata,
  SecSubmissionResponse,
} from "../types/pipeline.types.js";
import {
  findPrimaryFilingDocumentPath,
  PIPELINE_VERSION,
  SEC_USER_AGENT,
  THEME_MODEL,
} from "./sec-ingestion.js";

type HistoricalIngestionOptions = {
  maxFilings?: number;
  formTypes?: string[];
};

export async function getAvailableFilings(ticker: string, formType: string): Promise<AvailableFiling[]> {
  const company = getCompanyConfig(ticker);
  const submission = await loadSubmissionMetadata(company);
  return getAvailableFilingsFromSubmission(submission, formType);
}

export function getAvailableFilingsFromSubmission(
  submission: SecSubmissionResponse,
  formType: string,
): AvailableFiling[] {
  const recent = submission.filings.recent;
  const filings: AvailableFiling[] = [];

  for (let index = 0; index < recent.form.length; index += 1) {
    if (recent.form[index] !== formType) {
      continue;
    }

    filings.push({
      filingDate: recent.filingDate[index],
      accessionNumber: recent.accessionNumber[index],
      formType: recent.form[index],
    });
  }

  return filings.sort((left, right) => right.filingDate.localeCompare(left.filingDate));
}

export function mapDiscoveredFilings(filings: AvailableFiling[]): HistoricalDiscoveredFiling[] {
  return filings.map((filing) => ({
    filing_date: filing.filingDate,
    form_type: filing.formType,
    accession_number: filing.accessionNumber,
  }));
}

export function buildHistoricalIngestionReport(params: {
  startedAt: string;
  completedAt: string;
  requested: number;
  discovered: AvailableFiling[];
  downloaded: HistoricalIngestionEntry[];
  skipped: HistoricalIngestionEntry[];
  failed: HistoricalIngestionFailure[];
}): HistoricalIngestionReport {
  const startedTime = Date.parse(params.startedAt);
  const completedTime = Date.parse(params.completedAt);

  return {
    started_at: params.startedAt,
    completed_at: params.completedAt,
    duration_ms: Number.isNaN(startedTime) || Number.isNaN(completedTime) ? 0 : completedTime - startedTime,
    requested: params.requested,
    downloaded_count: params.downloaded.length,
    skipped_count: params.skipped.length,
    failed_count: params.failed.length,
    discovered: mapDiscoveredFilings(params.discovered),
    downloaded: params.downloaded,
    skipped: params.skipped,
    failed: params.failed,
  };
}

export async function ingestHistoricalFilings(
  ticker: string,
  options: HistoricalIngestionOptions = {},
): Promise<HistoricalIngestionReport> {
  const startedAt = getCurrentTimestamp();
  const company = getCompanyConfig(ticker);
  const maxFilings = options.maxFilings ?? HISTORICAL_INGESTION_DEFAULTS.maxFilings;
  const formTypes = options.formTypes ?? [...HISTORICAL_INGESTION_DEFAULTS.supportedForms];
  const availableFilings = (await Promise.all(formTypes.map((formType) => getAvailableFilings(company.ticker, formType))))
    .flat()
    .sort((left, right) => right.filingDate.localeCompare(left.filingDate));
  const selectedFilings = availableFilings.slice(0, maxFilings);
  const downloaded: HistoricalIngestionEntry[] = [];
  const skipped: HistoricalIngestionEntry[] = [];
  const failed: HistoricalIngestionFailure[] = [];

  for (const filing of selectedFilings) {
    try {
      if (filingExists(company.ticker, filing.filingDate)) {
        skipped.push({
          filing_date: filing.filingDate,
          reason: "already_exists",
        });
        continue;
      }

      await downloadHistoricalFiling(company, filing);
      downloaded.push({
        filing_date: filing.filingDate,
        reason: "download_success",
      });
    } catch (error) {
      failed.push({
        filing_date: filing.filingDate,
        reason: "download_failed",
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`Failed to ingest ${company.ticker} ${filing.formType} ${filing.filingDate}:`);
      console.error(error);
    }
  }

  const completedAt = getCurrentTimestamp();
  const report = buildHistoricalIngestionReport({
    startedAt,
    completedAt,
    requested: selectedFilings.length,
    discovered: availableFilings,
    downloaded,
    skipped,
    failed,
  });
  const reportsDir = join(getCompanyDirectory(company.ticker), "reports");
  const reportPath = join(reportsDir, "historical-ingestion-report.json");
  await writeJsonFile(reportPath, report);

  console.log(`Historical ingestion report saved to: ${reportPath}`);
  console.log(`Requested: ${report.requested}`);
  console.log(`Discovered: ${report.discovered.length}`);
  console.log(`Downloaded: ${report.downloaded_count}`);
  console.log(`Skipped: ${report.skipped_count}`);
  console.log(`Failed: ${report.failed_count}`);

  return report;
}

async function downloadHistoricalFiling(company: CompanyConfig, filing: AvailableFiling): Promise<void> {
  const rawDir = getFilingSubdirectory(company.ticker, filing.filingDate, "raw");
  const metadataDir = getFilingSubdirectory(company.ticker, filing.filingDate, "metadata");
  const rawMetadataPath = join(rawDir, "filings.json");
  const rawIndexPath = join(rawDir, "latest-10q-index.html");
  const rawFilingPath = join(rawDir, "latest-10q.html");
  const filingMetadataPath = join(metadataDir, "filing.json");
  const pipelineMetadataPath = join(metadataDir, "pipeline.json");
  const submission = await loadSubmissionMetadata(company);
  const rawSubmissionMetadata = JSON.stringify(submission, null, 2);
  const filingDirectoryUrl = buildFilingDirectoryUrl(company, filing.accessionNumber);
  const filingIndexUrl = `${filingDirectoryUrl}${filing.accessionNumber}-index.html`;

  await ensureDirectory(rawDir);
  await ensureDirectory(metadataDir);
  await writeTextFile(rawMetadataPath, `${rawSubmissionMetadata}\n`);

  const filingIndexHtml = await fetchText(filingIndexUrl, "SEC filing index");
  await writeTextFile(rawIndexPath, filingIndexHtml);

  const filingDocumentPath = findPrimaryFilingDocumentPath(filingIndexHtml, filing.formType);
  const filingHtmlUrl = filingDocumentPath.startsWith("/")
    ? `https://www.sec.gov${filingDocumentPath}`
    : `${filingDirectoryUrl}${filingDocumentPath}`;
  const filingHtml = await fetchText(filingHtmlUrl, "SEC filing HTML");
  await writeTextFile(rawFilingPath, filingHtml);

  const filingMetadata: FilingMetadata = {
    company: company.company,
    ticker: company.ticker,
    filing_date: filing.filingDate,
    form_type: filing.formType,
    accession_number: filing.accessionNumber,
  };
  const pipelineMetadata: PipelineMetadata = {
    pipeline_version: PIPELINE_VERSION,
    generated_at: getCurrentTimestamp(),
    theme_model: THEME_MODEL,
  };

  await writeJsonFile(filingMetadataPath, filingMetadata);
  await writeJsonFile(pipelineMetadataPath, pipelineMetadata);
}

async function loadSubmissionMetadata(company: CompanyConfig): Promise<SecSubmissionResponse> {
  const latestFiling = await getLatestAvailableFiling(company.ticker);
  const filingMetadataPath = latestFiling
    ? join(getFilingSubdirectory(company.ticker, latestFiling, "raw"), "filings.json")
    : "";
  const legacyMetadataPath = join(getCompanyDirectory(company.ticker), "raw", "filings.json");

  if (filingMetadataPath && fileExists(filingMetadataPath)) {
    return readJsonFile<SecSubmissionResponse>(filingMetadataPath);
  }

  if (fileExists(legacyMetadataPath)) {
    return readJsonFile<SecSubmissionResponse>(legacyMetadataPath);
  }

  return fetchSubmissionMetadata(company);
}

async function fetchSubmissionMetadata(company: CompanyConfig): Promise<SecSubmissionResponse> {
  const secSubmissionsUrl = `https://data.sec.gov/submissions/CIK${company.cik}.json`;
  const responseText = await fetchText(secSubmissionsUrl, "SEC metadata");
  return JSON.parse(responseText) as SecSubmissionResponse;
}

async function fetchText(url: string, label: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`${label} request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function filingExists(ticker: string, filingDate: string): boolean {
  return fileExists(join(getFilingSubdirectory(ticker, filingDate, "metadata"), "filing.json"));
}

function buildFilingDirectoryUrl(company: CompanyConfig, accessionNumber: string): string {
  const cikWithoutLeadingZeros = company.cik.replace(/^0+/, "");
  const accessionWithoutDashes = accessionNumber.replaceAll("-", "");
  return `https://www.sec.gov/Archives/edgar/data/${cikWithoutLeadingZeros}/${accessionWithoutDashes}/`;
}

if (require.main === module) {
  const ticker = process.argv[2];
  const maxFilings = process.argv[3] ? Number(process.argv[3]) : undefined;

  if (!ticker) {
    console.error("Usage: npm run ingest:history -- <ticker> [max-filings]");
    process.exitCode = 1;
  } else {
    ingestHistoricalFilings(ticker, { maxFilings }).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
