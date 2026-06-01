import type { CompanyConfig } from "../types/company.types.js";

export type { CompanyConfig };

export const companies: CompanyConfig[] = [
  {
    company: "Apple",
    ticker: "AAPL",
    cik: "0000320193",
  },
  {
    company: "Microsoft",
    ticker: "MSFT",
    cik: "0000789019",
  },
  {
    company: "Alphabet",
    ticker: "GOOGL",
    cik: "0001652044",
  },
  {
    company: "Amazon",
    ticker: "AMZN",
    cik: "0001018724",
  },
  {
    company: "Meta",
    ticker: "META",
    cik: "0001326801",
  },
];

export function getCompanyConfig(ticker: string): CompanyConfig {
  const normalizedTicker = ticker.trim().toUpperCase();
  const company = companies.find((entry) => entry.ticker === normalizedTicker);

  if (!company) {
    const supportedTickers = companies.map((entry) => entry.ticker).join(", ");
    throw new Error(`Unsupported ticker "${ticker}". Supported tickers: ${supportedTickers}`);
  }

  return company;
}

export function getCompanyDataDir(company: CompanyConfig): string {
  return company.ticker;
}
