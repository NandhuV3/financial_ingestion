import { join } from "node:path";
import { getFilingDirectory } from "../storage/filing-paths.js";

export function getHealthDashboardDirectory(ticker: string, filingDate: string): string {
  return join(getFilingDirectory(ticker, filingDate), "health-dashboard");
}

export function getHealthDashboardEvidencePath(ticker: string, filingDate: string): string {
  return join(getHealthDashboardDirectory(ticker, filingDate), "health-dashboard.evidence.json");
}

export function getHealthDashboardEnrichedPath(ticker: string, filingDate: string): string {
  return join(getHealthDashboardDirectory(ticker, filingDate), "health-dashboard.enriched.json");
}

export function getHealthDashboardEnrichmentReportPath(ticker: string, filingDate: string): string {
  return join(getHealthDashboardDirectory(ticker, filingDate), "health-dashboard-enrichment-report.json");
}
