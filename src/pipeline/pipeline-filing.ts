import { getCompanyConfig } from "../config/companies.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import { runPreAiPipeline } from "./pipeline-pre-ai.js";

async function runFilingPipeline(ticker: string, filingDate?: string): Promise<void> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);

  console.log(`Running filing pipeline for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);

  await runPreAiPipeline(company.ticker, resolvedFilingDate);

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
