import { getCompanyConfig } from "../config/companies.js";
import { extractBoundaries } from "../extraction/extract-boundaries.js";
import { exploreSections } from "../extraction/extract-sections.js";
import { chunkSections } from "../processing/chunk-sections.js";
import { deduplicateOverlap } from "../processing/deduplicate-overlap.js";
import { deduplicateSections } from "../processing/deduplicate-sections.js";
import { normalizeSections } from "../processing/normalize-sections.js";
import { checkArtifactFreshness } from "../reporting/check-artifact-freshness.js";
import { generateCompanyReport } from "../reporting/generate-company-report.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";

export async function runPreAiPipeline(ticker: string, filingDate?: string): Promise<void> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);

  console.log(`Running pre-AI pipeline for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);

  await extractBoundaries(company, resolvedFilingDate);
  await exploreSections(company, resolvedFilingDate);
  await deduplicateSections(company, resolvedFilingDate);
  await deduplicateOverlap(company, resolvedFilingDate);
  await normalizeSections(company, resolvedFilingDate);
  await chunkSections(company, resolvedFilingDate);
  await checkArtifactFreshness(company, resolvedFilingDate);
  await generateCompanyReport(company, resolvedFilingDate);

  console.log(`Pre-AI pipeline complete for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run pipeline:pre-ai -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    runPreAiPipeline(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
