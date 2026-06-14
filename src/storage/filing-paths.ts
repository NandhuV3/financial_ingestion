import { join } from "node:path";

export function getCompanyDirectory(ticker: string): string {
  return join(process.cwd(), "data", ticker.trim().toUpperCase());
}

export function getFilingDirectory(ticker: string, filingDate: string): string {
  return join(getCompanyDirectory(ticker), "filings", filingDate);
}

export function getFilingSubdirectory(ticker: string, filingDate: string, subdirectory: string): string {
  return join(getFilingDirectory(ticker, filingDate), subdirectory);
}
