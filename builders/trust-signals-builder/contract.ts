export const TRUST_SIGNALS_BUILDER_TYPE = "trust-signals-builder";
export const TRUST_SIGNALS_BUILDER_VERSION = "trust-signals-builder-v1";
export const TRUST_SIGNALS_SCHEMA_VERSION = "trust-signals-v1";
export const TRUST_SIGNALS_PIPELINE_VERSION = "trust-signals-pipeline-v1";

export const TRUST_DIMENSIONS = [
  "commitment_follow_through",
  "narrative_consistency",
  "explanation_quality",
  "accounting_stability",
  "capital_allocation_consistency",
] as const;

export type TrustDimension = typeof TRUST_DIMENSIONS[number];

export const SIGNAL_SEVERITIES = [
  "low",
  "medium",
  "high",
] as const;

export type SignalSeverity = typeof SIGNAL_SEVERITIES[number];

export const SIGNAL_DIRECTIONS = [
  "positive",
  "negative",
  "neutral",
] as const;

export type SignalDirection = typeof SIGNAL_DIRECTIONS[number];

export const SIGNAL_LIFECYCLE_STATUSES = [
  "active",
  "resolved",
  "escalated",
] as const;

export type SignalLifecycleStatus = typeof SIGNAL_LIFECYCLE_STATUSES[number];

export const DEPTH_LEVELS = [
  "base",
  "standard",
  "full",
] as const;

export type DepthLevel = typeof DEPTH_LEVELS[number];

export const TRUST_SIGNAL_TYPES = [
  "COMMITMENT_CREATED",
  "COMMITMENT_FULFILLED",
  "COMMITMENT_DELAYED",
  "COMMITMENT_OVERDUE",
  "COMMITMENT_MODIFIED",
  "COMMITMENT_ABANDONED",
  "COMMITMENT_ABANDONED_MULTI_PERIOD",
  "STRATEGIC_PRIORITY_CREATED",
  "STRATEGIC_PRIORITY_DROPPED",
  "STRATEGIC_PRIORITY_REINTRODUCED",
  "LANGUAGE_SHIFT_MINOR",
  "LANGUAGE_SHIFT_MODERATE",
  "LANGUAGE_SHIFT_SIGNIFICANT",
  "NARRATIVE_STABILITY_HIGH",
  "NARRATIVE_STABILITY_LOW",
  "ACCOUNTING_POLICY_CHANGED",
  "SEGMENT_REDEFINED",
  "SEGMENT_RESTRUCTURED",
  "RESTATEMENT_ISSUED",
  "NON_GAAP_GAP_WIDENING",
  "NON_GAAP_GAP_NARROWING",
  "REPORTING_STABILITY_DECREASED",
  "CAPITAL_ALLOCATION_ALIGNED",
  "CAPITAL_ALLOCATION_UNDER_SUPPORTED",
  "CAPITAL_ALLOCATION_UNSUPPORTED_DEPLOYMENT",
  "CAPITAL_ALLOCATION_EVIDENCE_INSUFFICIENT",
] as const;

export type TrustSignalType = typeof TRUST_SIGNAL_TYPES[number];

export const PILLAR_ARTIFACT_TYPES = [
  "commitment_tracking",
  "narrative_consistency",
  "accounting_stability",
  "capital_allocation_tracking",
] as const;

export type TrustPillarArtifactType = typeof PILLAR_ARTIFACT_TYPES[number];
