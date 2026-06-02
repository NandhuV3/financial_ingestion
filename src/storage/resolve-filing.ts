import { getLatestAvailableFiling } from "./list-filings.js";

export async function resolveFilingDate(ticker: string, filingDate?: string): Promise<string> {
  if (filingDate) {
    return filingDate;
  }

  const latestFiling = await getLatestAvailableFiling(ticker);

  if (!latestFiling) {
    throw new Error(`No filing directories found for ${ticker}.`);
  }

  return latestFiling;
}
