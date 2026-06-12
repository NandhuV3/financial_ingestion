import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

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
