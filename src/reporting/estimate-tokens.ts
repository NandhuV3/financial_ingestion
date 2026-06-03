import { join } from "node:path";
import { buildThemeInputEstimate, loadThemeChunks } from "../ai/theme-input.js";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";

type TokenEstimateReport = {
  company: string;
  ticker: string;
  filing_date: string;
  total_chunks: number;
  input_characters: number;
  estimated_tokens: number;
  generated_at: string;
};

export async function estimateFilingTokens(ticker: string, filingDate?: string): Promise<TokenEstimateReport> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const chunks = await loadThemeChunks(join(filingDir, "chunks"));
  const estimate = buildThemeInputEstimate(company, chunks);
  const report: TokenEstimateReport = {
    company: company.company,
    ticker: company.ticker,
    filing_date: resolvedFilingDate,
    total_chunks: chunks.length,
    input_characters: estimate.inputCharacters,
    estimated_tokens: estimate.estimatedTokens,
    generated_at: getCurrentTimestamp(),
  };
  const reportPath = join(filingDir, "reports", "token-estimate.json");

  await writeJsonFile(reportPath, report);

  console.log(`Company: ${report.company} (${report.ticker})`);
  console.log(`Filing Date: ${report.filing_date}`);
  console.log("");
  console.log(`Total chunks analyzed: ${report.total_chunks}`);
  console.log(`Input size: ${report.input_characters} characters`);
  console.log(`Token count estimate: ${report.estimated_tokens}`);
  console.log("");
  console.log(`JSON report: ${reportPath}`);

  return report;
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run token:estimate -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    estimateFilingTokens(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
