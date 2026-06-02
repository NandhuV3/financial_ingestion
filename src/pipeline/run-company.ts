import { getCompanyConfig } from "../config/companies.js";
import { ingestSecFilings } from "../ingestion/sec-ingestion.js";
import { extractBoundaries } from "../extraction/extract-boundaries.js";
import { deduplicateSections } from "../processing/deduplicate-sections.js";
import { deduplicateOverlap } from "../processing/deduplicate-overlap.js";
import { normalizeSections } from "../processing/normalize-sections.js";
import { chunkSections } from "../processing/chunk-sections.js";
import { generateThemes } from "../ai/generate-themes.js";

async function runCompanyPipeline(ticker: string): Promise<void> {
  const company = getCompanyConfig(ticker);

  console.log(`Running pipeline for ${company.company} (${company.ticker})`);

  const ingestionResult = await ingestSecFilings(company);

  if (!ingestionResult) {
    throw new Error(`No latest 10-Q filing found for ${company.ticker}`);
  }

  await extractBoundaries(company, ingestionResult.filingDate);
  await deduplicateSections(company, ingestionResult.filingDate);
  await deduplicateOverlap(company, ingestionResult.filingDate);
  await normalizeSections(company, ingestionResult.filingDate);
  await chunkSections(company, ingestionResult.filingDate);
  await generateThemes(company, ingestionResult.filingDate);

  console.log(`Pipeline complete for ${company.company} (${company.ticker})`);
}

const ticker = process.argv[2];

if (!ticker) {
  console.error("Usage: npm run pipeline -- <ticker>");
  process.exitCode = 1;
} else {
  runCompanyPipeline(ticker).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
