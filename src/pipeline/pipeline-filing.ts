import { getCompanyConfig } from "../config/companies.js";
import { generateThemes } from "../ai/generate-themes.js";
import { extractBoundaries } from "../extraction/extract-boundaries.js";
import { deduplicateOverlap } from "../processing/deduplicate-overlap.js";
import { deduplicateSections } from "../processing/deduplicate-sections.js";
import { normalizeSections } from "../processing/normalize-sections.js";
import { chunkSections } from "../processing/chunk-sections.js";
import { generateCompanyReport } from "../reporting/generate-company-report.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";

async function runFilingPipeline(ticker: string, filingDate?: string): Promise<void> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);

  console.log(`Running filing pipeline for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);

  await extractBoundaries(company, resolvedFilingDate);
  await deduplicateSections(company, resolvedFilingDate);
  await deduplicateOverlap(company, resolvedFilingDate);
  await normalizeSections(company, resolvedFilingDate);
  await chunkSections(company, resolvedFilingDate);
  await generateThemes(company, resolvedFilingDate);
  await generateCompanyReport(company, resolvedFilingDate);

  console.log(`Filing pipeline complete for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (!ticker) {
  console.error("Usage: npm run pipeline:filing -- <ticker> [filing-date]");
  process.exitCode = 1;
} else {
  runFilingPipeline(ticker, filingDate).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
