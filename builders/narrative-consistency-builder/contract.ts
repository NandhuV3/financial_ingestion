export const NARRATIVE_CONSISTENCY_BUILDER_TYPE = "narrative-consistency-builder";
export const NARRATIVE_CONSISTENCY_BUILDER_VERSION = "narrative-consistency-builder-v1";
export const NARRATIVE_CONSISTENCY_SCHEMA_VERSION = "narrative-consistency-v1";
export const NARRATIVE_CONSISTENCY_PIPELINE_VERSION = "narrative-consistency-pipeline-v1";

export const NARRATIVE_CONSISTENCY_RULE_SET = {
  ref: "narrative-consistency-rules",
  version: "narrative-consistency-rules-v1",
} as const;

/**
 * Narrative Consistency owns this deterministic calibration contract.
 *
 * The persistence boundary implements the contract's consecutive-period
 * definition. Confidence uses equal component weights so no hidden component
 * dominates the artifact-level result.
 */
export const NARRATIVE_CONSISTENCY_CALIBRATION = {
  ref: "narrative-consistency-calibration",
  version: "narrative-consistency-calibration-v1",
  persistent_after_consecutive_periods: 2,
  preferred_history_periods: 4,
  confidence_weights: {
    extraction: 0.25,
    linkage: 0.25,
    shift_detection: 0.25,
    history_depth: 0.25,
  },
  rounding_precision: 6,
} as const;

export const PRIORITY_STATUSES = [
  "new",
  "active",
  "persistent",
  "declining",
  "dropped",
  "reintroduced",
] as const;

export type PriorityStatus = typeof PRIORITY_STATUSES[number];

export const NARRATIVE_CATEGORIES = [
  "growth",
  "competition",
  "efficiency",
  "innovation",
  "capital_allocation",
  "customer",
  "risk",
  "strategy",
] as const;

export type NarrativeCategory = typeof NARRATIVE_CATEGORIES[number];

export const NARRATIVE_TRENDS = [
  "increasing",
  "stable",
  "decreasing",
  "volatile",
] as const;

export type NarrativeTrend = typeof NARRATIVE_TRENDS[number];

export const SHIFT_MAGNITUDES = [
  "minor",
  "moderate",
  "significant",
] as const;

export type ShiftMagnitude = typeof SHIFT_MAGNITUDES[number];

export const NARRATIVE_SOURCE_ARTIFACT_TYPES = [
  "filing",
  "structured_intelligence",
] as const;

export type NarrativeSourceArtifactType =
  typeof NARRATIVE_SOURCE_ARTIFACT_TYPES[number];
