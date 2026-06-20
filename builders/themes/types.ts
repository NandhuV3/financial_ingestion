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

export type FilingEvidenceCatalogEntry = SourceEvidence & {
  excerpt: string;
};

export type ThemeCandidate = {
  title: string;
  summary: string;
  category: ThemeCategory;
  evidence_count: number;
  evidence: SourceEvidence[];
};

export type ThemesLLMOutput = {
  themes: ThemeCandidate[];
};
