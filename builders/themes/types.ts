import type { SourceEvidence, ThemeCategory } from "./contract.js";

export type FilingType = "10-K" | "10-Q" | "Transcript";

export type ThemesBuilderInput = {
  company_id: string;
  filing_id: string;
  filing_type: FilingType;
  filing_content: string;
  filing_hash: string;
  period_id: string;
};

export type ThemeCandidate = {
  title: string;
  description: string;
  category: ThemeCategory;
  importance: "low" | "medium" | "high";
  evidence: SourceEvidence[];
  frequency?: number;
};

export type ThemesLLMOutput = {
  themes: ThemeCandidate[];
};

