import type { PromptProvenance } from "../prompt-registry/prompt-provenance.types.js";

export type ThemeImportance = "high" | "medium" | "low";

export type Theme = {
  theme: string;
  category: string;
  importance: ThemeImportance;
  summary: string;
  evidence: string[];
};

export type ThemeOutput = {
  company: string;
  ticker: string;
  filing_date: string;
  prompt_provenance: PromptProvenance;
  themes: Theme[];
};

export type ChunkHashMetadata = {
  hash: string;
  generated_at: string;
};

export type ThemeGenerationStatus = "generated" | "skipped";

export type ThemeGenerationReason = "themes_missing" | "chunks_unchanged" | "chunk_changes_detected" | "metadata_missing";

export type ThemeGenerationReport = {
  status: ThemeGenerationStatus;
  reason: ThemeGenerationReason;
  estimated_input_tokens: number;
  chunk_hash: string;
  generated_at: string;
  model_version: string;
  prompt_provenance: PromptProvenance;
};
