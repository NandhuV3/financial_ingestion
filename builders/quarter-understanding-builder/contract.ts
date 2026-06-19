export const QUARTER_UNDERSTANDING_BUILDER_TYPE = "quarter-understanding-builder";
export const QUARTER_UNDERSTANDING_BUILDER_VERSION = "quarter-understanding-builder-v1";
export const QUARTER_UNDERSTANDING_SCHEMA_VERSION = "quarter-understanding-v1";
export const QUARTER_UNDERSTANDING_PIPELINE_VERSION = "quarter-understanding-pipeline-v1";
export const QUARTER_UNDERSTANDING_PROMPT_ID = "quarter-understanding";
export const QUARTER_UNDERSTANDING_MODEL_VERSION = "quarter-understanding-model-v1";
export const QUARTER_UNDERSTANDING_CALIBRATION_CONTRACT_VERSION =
  "quarter-understanding-calibration-v1";

export const UNDERSTANDING_CATEGORIES = [
  "business_model",
  "revenue",
  "products",
  "customers",
  "competition",
  "operations",
  "strategy",
  "execution",
  "trust",
] as const;

export type UnderstandingCategory = typeof UNDERSTANDING_CATEGORIES[number];

export const IMPORTANCE_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

export type UnderstandingImportance = typeof IMPORTANCE_LEVELS[number];

export const UNDERSTANDING_DIRECTIONS = [
  "improving",
  "stable",
  "deteriorating",
  "mixed",
] as const;

export type UnderstandingDirection = typeof UNDERSTANDING_DIRECTIONS[number];

export const DEPTH_LEVELS = [
  "base",
  "standard",
  "full",
] as const;

export type DepthLevel = typeof DEPTH_LEVELS[number];
