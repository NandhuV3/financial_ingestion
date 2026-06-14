import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { ensureDirectory, writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingSubdirectory } from "../storage/filing-paths.js";
import type { CompanyConfig } from "../types/company.types.js";
import type {
  FilingMetadata,
  PipelineMetadata,
  SecIngestionResult,
  SecSubmissionResponse,
} from "../types/pipeline.types.js";

export const SEC_USER_AGENT = "FinancialIngestion dev@example.com";
const FORM_TYPE = "10-Q";
export const PIPELINE_VERSION = "0.5.0";
export const THEME_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function ingestSecFilings(company: CompanyConfig): Promise<SecIngestionResult | undefined> {
  const secSubmissionsUrl = `https://data.sec.gov/submissions/CIK${company.cik}.json`;

  const metadataResponse = await fetch(secSubmissionsUrl, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
    },
  });

  if (!metadataResponse.ok) {
    throw new Error(
      `SEC metadata request failed: ${metadataResponse.status} ${metadataResponse.statusText}`,
    );
  }

  const rawMetadata = await metadataResponse.text();
  const submission = JSON.parse(rawMetadata) as SecSubmissionResponse;
  const recent = submission.filings.recent;

  const latestTenQIndex = recent.form.findIndex((form) => form === FORM_TYPE);

  if (latestTenQIndex === -1) {
    console.log(`Company: ${submission.name}`);
    console.log("No recent 10-Q filing found.");
    return undefined;
  }

  const filingDate = recent.filingDate[latestTenQIndex];
  const accessionNumber = recent.accessionNumber[latestTenQIndex];
  const rawDir = getFilingSubdirectory(company.ticker, filingDate, "raw");
  const metadataDir = getFilingSubdirectory(company.ticker, filingDate, "metadata");
  const rawMetadataPath = join(rawDir, "filings.json");
  const rawIndexPath = join(rawDir, "latest-10q-index.html");
  const rawFilingPath = join(rawDir, "latest-10q.html");
  const filingMetadataPath = join(metadataDir, "filing.json");
  const pipelineMetadataPath = join(metadataDir, "pipeline.json");
  const cikWithoutLeadingZeros = company.cik.replace(/^0+/, "");
  const accessionWithoutDashes = accessionNumber.replaceAll("-", "");
  const filingDirectoryUrl = `https://www.sec.gov/Archives/edgar/data/${cikWithoutLeadingZeros}/${accessionWithoutDashes}/`;
  const filingIndexUrl = `${filingDirectoryUrl}${accessionNumber}-index.html`;

  await ensureDirectory(rawDir);
  await ensureDirectory(metadataDir);
  await writeFile(rawMetadataPath, rawMetadata, "utf8");

  const indexResponse = await fetch(filingIndexUrl, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
    },
  });

  if (!indexResponse.ok) {
    throw new Error(
      `SEC filing index request failed: ${indexResponse.status} ${indexResponse.statusText}`,
    );
  }

  const filingIndexHtml = await indexResponse.text();
  await writeFile(rawIndexPath, filingIndexHtml, "utf8");

  const filingDocumentPath = findPrimaryFilingDocumentPath(filingIndexHtml, FORM_TYPE);
  const filingHtmlUrl = filingDocumentPath.startsWith("/")
    ? `https://www.sec.gov${filingDocumentPath}`
    : `${filingDirectoryUrl}${filingDocumentPath}`;

  const filingResponse = await fetch(filingHtmlUrl, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
    },
  });

  if (!filingResponse.ok) {
    throw new Error(
      `SEC filing HTML request failed: ${filingResponse.status} ${filingResponse.statusText}`,
    );
  }

  const filingHtml = await filingResponse.text();
  await writeFile(rawFilingPath, filingHtml, "utf8");
  const filingMetadata: FilingMetadata = {
    company: company.company,
    ticker: company.ticker,
    filing_date: filingDate,
    form_type: FORM_TYPE,
    accession_number: accessionNumber,
  };
  const pipelineMetadata: PipelineMetadata = {
    pipeline_version: PIPELINE_VERSION,
    generated_at: getCurrentTimestamp(),
    theme_model: THEME_MODEL,
  };

  await writeJsonFile(filingMetadataPath, filingMetadata);
  await writeJsonFile(pipelineMetadataPath, pipelineMetadata);

  console.log(`Company: ${submission.name}`);
  console.log(`Filing date: ${filingDate}`);
  console.log(`Accession number: ${accessionNumber}`);
  console.log(`Filing index URL: ${filingIndexUrl}`);
  console.log(`Filing HTML URL: ${filingHtmlUrl}`);
  console.log(`Raw metadata saved to: ${rawMetadataPath}`);
  console.log(`Raw filing index saved to: ${rawIndexPath}`);
  console.log(`Raw filing HTML saved to: ${rawFilingPath}`);
  console.log(`Filing metadata saved to: ${filingMetadataPath}`);
  console.log(`Pipeline metadata saved to: ${pipelineMetadataPath}`);

  return {
    filingDate,
    accessionNumber,
    filingIndexUrl,
    filingHtmlUrl,
  };
}

export function findPrimaryFilingDocumentPath(indexHtml: string, formType: string): string {
  const rows = indexHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const escapedFormType = formType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const formPattern = new RegExp(`<td[^>]*>\\s*${escapedFormType}\\s*<\\/td>`, "i");

  for (const row of rows) {
    const isTargetFormRow = formPattern.test(row);
    const hrefMatch = row.match(/href="([^"]+\.(?:htm|html))"/i);

    if (isTargetFormRow && hrefMatch) {
      const href = hrefMatch[1].replaceAll("&amp;", "&");

      if (href.startsWith("/ix?")) {
        const ixViewerUrl = new URL(`https://www.sec.gov${href}`);
        const documentPath = ixViewerUrl.searchParams.get("doc");

        if (documentPath) {
          return documentPath;
        }
      }

      return href;
    }
  }

  throw new Error(
    `Could not find primary ${formType} document link in SEC filing index page.`,
  );
}

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: npm run ingest:sec -- <ticker>");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    ingestSecFilings(company).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
