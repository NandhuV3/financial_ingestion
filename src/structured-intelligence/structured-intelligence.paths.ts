import { join } from "node:path";
import { getFilingDirectory } from "../storage/filing-paths.js";

export function getStructuredIntelligencePath(
  ticker: string,
  filingDate: string,
): string {
  return join(getIntelligenceDirectory(ticker, filingDate), "structured-intelligence.json");
}

export function getStructuredIntelligencePromptPath(
  ticker: string,
  filingDate: string,
): string {
  return join(getIntelligenceDirectory(ticker, filingDate), "structured-intelligence.prompt.txt");
}

export function getStructuredIntelligenceRawResponsePath(
  ticker: string,
  filingDate: string,
): string {
  return join(getIntelligenceDirectory(ticker, filingDate), "structured-intelligence.raw.json");
}

export function getStructuredIntelligenceReportPath(
  ticker: string,
  filingDate: string,
): string {
  return join(getIntelligenceDirectory(ticker, filingDate), "structured-intelligence.report.json");
}

function getIntelligenceDirectory(ticker: string, filingDate: string): string {
  return join(getFilingDirectory(ticker, filingDate), "intelligence");
}
