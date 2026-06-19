export const INVESTOR_INTELLIGENCE_BUILDER_TYPE = "investor-intelligence-builder";
export const INVESTOR_INTELLIGENCE_BUILDER_VERSION = "investor-intelligence-builder-v1";
export const INVESTOR_INTELLIGENCE_SCHEMA_VERSION = "investor-intelligence-v1";
export const INVESTOR_INTELLIGENCE_PIPELINE_VERSION = "investor-intelligence-pipeline-v1";
export const INVESTOR_INTELLIGENCE_MODEL_VERSION = "investor-intelligence-model-v1";

export const INVESTOR_Q1_PROMPT_ID = "investor_q1";
export const INVESTOR_Q2_PROMPT_ID = "investor_q2";
export const INVESTOR_Q3_PROMPT_ID = "investor_q3";
export const INVESTOR_Q4_PROMPT_ID = "investor_q4";
export const INVESTOR_Q5_PROMPT_ID = "investor_q5";

export const DEPTH_LEVELS = [
  "base",
  "standard",
  "full",
] as const;

export type DepthLevel = typeof DEPTH_LEVELS[number];

export const QUESTION_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
] as const;

export type QuestionConfidenceLevel = typeof QUESTION_CONFIDENCE_LEVELS[number];

export const QUESTION_STATUSES = [
  "answered",
  "partial",
  "insufficient_data",
] as const;

export type QuestionStatus = typeof QUESTION_STATUSES[number];
