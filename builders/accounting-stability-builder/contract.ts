export const ACCOUNTING_STABILITY_BUILDER_TYPE =
  "accounting-stability-builder";
export const ACCOUNTING_STABILITY_BUILDER_VERSION =
  "accounting-stability-builder-v1";
export const ACCOUNTING_STABILITY_SCHEMA_VERSION =
  "accounting-stability-v1";
export const ACCOUNTING_STABILITY_PIPELINE_VERSION =
  "accounting-stability-pipeline-v1";

export const ACCOUNTING_STABILITY_RULE_SET = {
  ref: "accounting-stability-rules",
  version: "accounting-stability-rules-v1",
} as const;

/**
 * Accounting Stability owns these deterministic, non-trust classifications.
 *
 * Two periods are the locked minimum history. Four periods establish full
 * longitudinal depth. Non-GAAP materiality classifies the latest absolute gap.
 * Equal confidence component weights avoid hidden dominance by one component.
 */
export const ACCOUNTING_STABILITY_CALIBRATION = {
  ref: "accounting-stability-calibration",
  version: "accounting-stability-calibration-v1",
  minimum_history_periods: 2,
  standard_history_periods: 3,
  full_history_periods: 4,
  non_gaap_materiality: {
    medium_minimum_percentage: 10,
    high_minimum_percentage: 25,
  },
  confidence_weights: {
    extraction: 0.25,
    policy_detection: 0.25,
    segment_detection: 0.25,
    historical_depth: 0.25,
  },
  rounding_precision: 4,
} as const;

export const POLICY_TYPES = [
  "revenue_recognition",
  "expense_recognition",
  "inventory",
  "depreciation",
  "goodwill",
  "tax",
  "segment_reporting",
  "other",
] as const;

export type PolicyType = typeof POLICY_TYPES[number];

export const COMPARABILITY_IMPACTS = [
  "none",
  "minor",
  "moderate",
  "material",
] as const;

export type ComparabilityImpact = typeof COMPARABILITY_IMPACTS[number];

export const SEGMENT_CHANGE_TYPES = [
  "added",
  "removed",
  "merged",
  "split",
  "renamed",
  "restructured",
] as const;

export type SegmentChangeType = typeof SEGMENT_CHANGE_TYPES[number];

export const RESTATEMENT_SCOPES = [
  "financial_statement",
  "segment_reporting",
  "revenue",
  "expense",
  "tax",
  "other",
] as const;

export type RestatementScope = typeof RESTATEMENT_SCOPES[number];

export const MATERIALITY_LEVELS = ["low", "medium", "high"] as const;
export type Materiality = typeof MATERIALITY_LEVELS[number];

export const TREND_DIRECTIONS = ["widening", "stable", "narrowing"] as const;
export type TrendDirection = typeof TREND_DIRECTIONS[number];

export const COVERAGE_STATES = ["complete", "partial", "unavailable"] as const;
export type CoverageState = typeof COVERAGE_STATES[number];

export const DEPTH_LEVELS = ["base", "standard", "full"] as const;
export type AccountingDepthLevel = typeof DEPTH_LEVELS[number];

