export const CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE = "capital-allocation-tracking-builder";
export const CAPITAL_ALLOCATION_TRACKING_BUILDER_VERSION = "capital-allocation-tracking-builder-v1";
export const CAPITAL_ALLOCATION_TRACKING_SCHEMA_VERSION = "capital-allocation-tracking-v1";
export const CAPITAL_ALLOCATION_TRACKING_PIPELINE_VERSION = "capital-allocation-tracking-pipeline-v1";

export const CAPITAL_ALLOCATION_TYPES = [
  "buybacks",
  "dividends",
  "acquisitions",
  "organic_investment",
  "debt_reduction",
  "capital_expenditure",
  "other",
] as const;

export type CapitalAllocationType = typeof CAPITAL_ALLOCATION_TYPES[number];

export const GAP_TYPES = [
  "aligned",
  "under_supported",
  "unsupported_deployment",
  "insufficient_evidence",
] as const;

export type GapType = typeof GAP_TYPES[number];

export const FINANCIAL_STATEMENT_COVERAGE = [
  "complete",
  "partial",
  "missing",
] as const;

export type FinancialStatementCoverage = typeof FINANCIAL_STATEMENT_COVERAGE[number];

export const DEPTH_LEVELS = [
  "base",
  "standard",
  "full",
] as const;

export type DepthLevel = typeof DEPTH_LEVELS[number];
