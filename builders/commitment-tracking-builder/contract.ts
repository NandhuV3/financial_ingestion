export const COMMITMENT_TRACKING_BUILDER_TYPE = "commitment-tracking-builder";
export const COMMITMENT_TRACKING_BUILDER_VERSION = "commitment-tracking-builder-v1";
export const COMMITMENT_TRACKING_SCHEMA_VERSION = "commitment-tracking-v1";
export const COMMITMENT_TRACKING_PIPELINE_VERSION = "commitment-tracking-pipeline-v1";

export const COMMITMENT_TRACKING_RULE_SET = {
  ref: "commitment-tracking-rules",
  version: "commitment-tracking-rules-v1",
} as const;

/**
 * Commitment Tracking owns this deterministic calibration contract.
 *
 * Equal component weights keep extraction, linkage, resolution, and historical
 * support independently visible. History scores represent the locked
 * first-population, minimum-longitudinal, and preferred-history boundaries.
 */
export const COMMITMENT_TRACKING_CALIBRATION = {
  ref: "commitment-tracking-calibration",
  version: "commitment-tracking-calibration-v1",
  component_weights: {
    extraction: 0.25,
    linkage: 0.25,
    resolution: 0.25,
    history_depth: 0.25,
  },
  history_depth_scores: {
    first_population: 0.25,
    minimum_longitudinal: 0.5,
    extended_longitudinal: 0.75,
    preferred_history: 1,
  },
  rounding_precision: 6,
} as const;

export const COMMITMENT_TYPES = [
  "product_launch",
  "capacity_expansion",
  "cost_reduction",
  "margin_improvement",
  "revenue_growth",
  "customer_growth",
  "strategic_initiative",
  "acquisition_integration",
  "capital_allocation",
  "other",
] as const;

export type CommitmentType = typeof COMMITMENT_TYPES[number];

export const COMMITMENT_STATUSES = [
  "new",
  "active",
  "achieved",
  "delayed",
  "modified",
  "abandoned",
  "expired",
] as const;

export type CommitmentStatus = typeof COMMITMENT_STATUSES[number];

export const TERMINAL_COMMITMENT_STATUSES = [
  "achieved",
  "abandoned",
  "expired",
] as const satisfies readonly CommitmentStatus[];

export const RESOLUTION_RESULTS = [
  "fulfilled",
  "partially_fulfilled",
  "not_fulfilled",
  "unable_to_determine",
] as const;

export type ResolutionResult = typeof RESOLUTION_RESULTS[number];

export const SOURCE_TYPES = [
  "10K",
  "10Q",
  "earnings_call",
  "investor_day",
] as const;

export type CommitmentSourceType = typeof SOURCE_TYPES[number];

export const EVIDENCE_ROLES = [
  "creation",
  "confirmation",
  "modification",
  "resolution",
] as const;

export type EvidenceRole = typeof EVIDENCE_ROLES[number];

export const SOURCE_ARTIFACT_TYPES = [
  "filing",
  "structured_intelligence",
] as const;

export type CommitmentSourceArtifactType = typeof SOURCE_ARTIFACT_TYPES[number];

export const ALLOWED_LIFECYCLE_TRANSITIONS: Readonly<
  Record<CommitmentStatus, readonly CommitmentStatus[]>
> = {
  new: ["new", "active", "achieved", "delayed", "modified", "abandoned", "expired"],
  active: ["active", "achieved", "delayed", "modified", "abandoned", "expired"],
  delayed: ["delayed", "active", "achieved", "modified", "abandoned", "expired"],
  modified: ["modified", "active", "achieved", "delayed", "abandoned", "expired"],
  achieved: ["achieved"],
  abandoned: ["abandoned"],
  expired: ["expired"],
};

export const RESOLUTION_RESULTS_BY_STATUS: Readonly<
  Record<CommitmentStatus, readonly ResolutionResult[]>
> = {
  new: [],
  active: [],
  achieved: ["fulfilled"],
  delayed: ["partially_fulfilled", "not_fulfilled", "unable_to_determine"],
  modified: ["partially_fulfilled", "unable_to_determine"],
  abandoned: ["not_fulfilled", "partially_fulfilled"],
  expired: ["not_fulfilled", "unable_to_determine"],
};
