import type { FilingMetadata } from "../types/pipeline.types.js";
import type { Theme, ThemeOutput } from "../types/theme.types.js";

export type ComparisonMetadata = {
  ticker: string;
  current_filing_date: string;
  previous_filing_date: string | null;
};

export type FilingSnapshot = {
  metadata: FilingMetadata;
  themes: ThemeOutput;
};

export type ComparisonInput = {
  metadata: ComparisonMetadata;
  previousFiling: FilingSnapshot | null;
  currentFiling: FilingSnapshot;
  previousThemes: ThemeOutput | null;
  currentThemes: ThemeOutput;
};

export type ThemeComparisonResult = {
  newThemes: Theme[];
  removedThemes: Theme[];
  unchangedThemes: Theme[];
};

export type QuarterDelta = {
  company: string;
  ticker: string;
  previous_filing: FilingMetadata | null;
  current_filing: FilingMetadata;
  summary: {
    new_count: number;
    removed_count: number;
    unchanged_count: number;
  };
  new_themes: Theme[];
  removed_themes: Theme[];
  unchanged_themes: Theme[];
};
