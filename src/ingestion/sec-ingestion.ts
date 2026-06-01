import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getCompanyConfig, getCompanyDataDir } from "../config/companies.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { SecIngestionResult, SecSubmissionResponse } from "../types/pipeline.types.js";

const USER_AGENT = "FinancialIngestion dev@example.com";

export async function ingestSecFilings(company: CompanyConfig): Promise<SecIngestionResult | undefined> {
  const secSubmissionsUrl = `https://data.sec.gov/submissions/CIK${company.cik}.json`;
  const rawDir = join(process.cwd(), "data", getCompanyDataDir(company), "raw");
  const rawMetadataPath = join(rawDir, "filings.json");
  const rawIndexPath = join(rawDir, "latest-10q-index.html");
  const rawFilingPath = join(rawDir, "latest-10q.html");

  const metadataResponse = await fetch(secSubmissionsUrl, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!metadataResponse.ok) {
    throw new Error(
      `SEC metadata request failed: ${metadataResponse.status} ${metadataResponse.statusText}`,
    );
  }

  const rawMetadata = await metadataResponse.text();
  await mkdir(dirname(rawMetadataPath), { recursive: true });
  await writeFile(rawMetadataPath, rawMetadata, "utf8");

  const submission = JSON.parse(rawMetadata) as SecSubmissionResponse;
  const recent = submission.filings.recent;

  const latestTenQIndex = recent.form.findIndex((form) => form === "10-Q");

  if (latestTenQIndex === -1) {
    console.log(`Company: ${submission.name}`);
    console.log("No recent 10-Q filing found.");
    return undefined;
  }

  const filingDate = recent.filingDate[latestTenQIndex];
  const accessionNumber = recent.accessionNumber[latestTenQIndex];
  const cikWithoutLeadingZeros = company.cik.replace(/^0+/, "");
  const accessionWithoutDashes = accessionNumber.replaceAll("-", "");
  const filingDirectoryUrl = `https://www.sec.gov/Archives/edgar/data/${cikWithoutLeadingZeros}/${accessionWithoutDashes}/`;
  const filingIndexUrl = `${filingDirectoryUrl}${accessionNumber}-index.html`;

  const indexResponse = await fetch(filingIndexUrl, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!indexResponse.ok) {
    throw new Error(
      `SEC filing index request failed: ${indexResponse.status} ${indexResponse.statusText}`,
    );
  }

  const filingIndexHtml = await indexResponse.text();
  await writeFile(rawIndexPath, filingIndexHtml, "utf8");

  const filingDocumentPath = findPrimaryTenQDocumentPath(filingIndexHtml);
  const filingHtmlUrl = filingDocumentPath.startsWith("/")
    ? `https://www.sec.gov${filingDocumentPath}`
    : `${filingDirectoryUrl}${filingDocumentPath}`;

  const filingResponse = await fetch(filingHtmlUrl, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!filingResponse.ok) {
    throw new Error(
      `SEC filing HTML request failed: ${filingResponse.status} ${filingResponse.statusText}`,
    );
  }

  const filingHtml = await filingResponse.text();
  await writeFile(rawFilingPath, filingHtml, "utf8");

  console.log(`Company: ${submission.name}`);
  console.log(`Filing date: ${filingDate}`);
  console.log(`Accession number: ${accessionNumber}`);
  console.log(`Filing index URL: ${filingIndexUrl}`);
  console.log(`Filing HTML URL: ${filingHtmlUrl}`);
  console.log(`Raw metadata saved to: ${rawMetadataPath}`);
  console.log(`Raw filing index saved to: ${rawIndexPath}`);
  console.log(`Raw filing HTML saved to: ${rawFilingPath}`);

  return {
    filingDate,
    accessionNumber,
    filingIndexUrl,
    filingHtmlUrl,
  };
}

function findPrimaryTenQDocumentPath(indexHtml: string): string {
  const rows = indexHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rows) {
    const isTenQRow = /<td[^>]*>\s*10-Q\s*<\/td>/i.test(row);
    const hrefMatch = row.match(/href="([^"]+\.(?:htm|html))"/i);

    if (isTenQRow && hrefMatch) {
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
    "Could not find primary 10-Q document link in SEC filing index page.",
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
