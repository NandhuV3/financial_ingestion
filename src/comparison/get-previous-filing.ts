import { listAvailableFilings } from "../storage/list-filings.js";

export async function getPreviousFiling(ticker: string, filingDate: string): Promise<string | null> {
  const filings = await listAvailableFilings(ticker);
  const currentIndex = filings.indexOf(filingDate);

  if (currentIndex <= 0) {
    return null;
  }

  return filings[currentIndex - 1];
}
