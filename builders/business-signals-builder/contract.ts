export const BUSINESS_SIGNALS_BUILDER_TYPE = "business-signals-builder";
export const BUSINESS_SIGNALS_BUILDER_VERSION = "business-signals-builder-v1";
export const BUSINESS_SIGNALS_SCHEMA_VERSION = "business-signals-v1";
export const BUSINESS_SIGNALS_PIPELINE_VERSION = "business-signals-pipeline-v1";

export const SIGNAL_CATEGORIES = [
  "growth",
  "margin",
  "product",
  "customer",
  "competitive",
  "strategic",
] as const;

export type SignalCategory = typeof SIGNAL_CATEGORIES[number];

export const SIGNAL_DIRECTIONS = [
  "improving",
  "stable",
  "deteriorating",
] as const;

export type SignalDirection = typeof SIGNAL_DIRECTIONS[number];

export const SIGNAL_MAGNITUDES = [
  "low",
  "medium",
  "high",
] as const;

export type SignalMagnitude = typeof SIGNAL_MAGNITUDES[number];

export const DEPTH_LEVELS = [
  "base",
  "standard",
  "full",
] as const;

export type DepthLevel = typeof DEPTH_LEVELS[number];

