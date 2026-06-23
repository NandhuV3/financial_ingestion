import type { ThemeQualityMetrics } from "./theme-quality/types.js";

export const THEMES_BUILDER_TYPE = "themes";
export const THEMES_BUILDER_VERSION = "themes-builder-v3";
export const THEMES_SCHEMA_VERSION = "themes-artifact-v3";
export const THEMES_PIPELINE_VERSION = "themes-pipeline-v3";
export const THEMES_MODEL_VERSION = "gpt-4o-mini";

export const THEME_CATEGORIES = [
  "strategy",
  "product",
  "customer",
  "competition",
  "operations",
  "financial",
  "capital_allocation",
  "management",
  "trust",
  "regulatory",
  "technology",
  "other",
] as const;

export type ThemeCategory = typeof THEME_CATEGORIES[number];

export type SourceEvidence = {
  evidence_ref: string;
  evidence_hash: string;
  section_name: string;
  paragraph_index: number;
};

export type Theme = {
  theme_id: string;
  title: string;
  summary: string;
  category: ThemeCategory;
  evidence: SourceEvidence[];
  evidence_count: number;
  directional_framing?: string;
  confidence: number;
};

export type ThemesConfidence = {
  overall: number;
  evidence_coverage: number;
  extraction_consistency: number;
  filing_coverage: number;
};

export type ThemesEvaluationHooks = {
  prompt_version: string;
  model_version: string;
  theme_count: number;
  average_confidence: number;
  confidence_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  evidence_density: number;
  duplicate_count: number;
  theme_quality?: ThemeQualityMetrics;
};

export type ThemesArtifactContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_type: string;
  themes: Theme[];
  confidence: ThemesConfidence;
  evaluation_hooks: ThemesEvaluationHooks;
};
