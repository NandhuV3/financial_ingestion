import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeImportance } from "../types/theme.types.js";

export type ChangeType =
  | "NEW_CATEGORY"
  | "REMOVED_CATEGORY"
  | "IMPORTANCE_INCREASED"
  | "IMPORTANCE_DECREASED"
  | "EVIDENCE_INCREASED"
  | "EVIDENCE_DECREASED";

export type CategorySnapshot = {
  category: string;
  theme_names: string[];
  importance: ThemeImportance;
  evidence: string[];
  evidence_count: number;
};

export type QuarterChange = {
  change_type: ChangeType;
  category: string;
  previous_importance: ThemeImportance | null;
  current_importance: ThemeImportance | null;
  previous_evidence_count: number;
  current_evidence_count: number;
  previous_theme_names: string[];
  current_theme_names: string[];
};

export type QuarterChangeReport = {
  company: string;
  ticker: string;
  previous_filing: FilingMetadata | null;
  current_filing: FilingMetadata;
  summary: {
    new_categories: number;
    removed_categories: number;
    importance_increases: number;
    importance_decreases: number;
    evidence_increases: number;
    evidence_decreases: number;
  };
  changes: QuarterChange[];
};
