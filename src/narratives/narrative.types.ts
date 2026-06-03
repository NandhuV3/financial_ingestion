import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";

export type InvestorNarrative = {
  headline: string;
  executive_summary: string;
  what_changed: string;
  bull_case: string;
  bear_case: string;
  investor_takeaway: string;
};

export type NarrativePromptInput = {
  company: string;
  ticker: string;
  filing_date: string;
  filing_metadata: FilingMetadata;
  quarter_changes: QuarterChangeReport;
  investor_signals: InvestorInsight;
  topics: ThemeOutput | null;
  new_topics: string[];
  removed_topics: string[];
  risks: string[];
  opportunities: string[];
  top_signals: string[];
};

export type NarrativeMetadata = {
  input_hash: string;
  generated_at: string;
  model: string;
};

export type NarrativeGenerationStatus = "generated" | "skipped";

export type NarrativeGenerationReport = {
  status: NarrativeGenerationStatus;
  reason: "generated" | "unchanged";
  input_hash: string;
  token_estimate: number;
  model: string;
  generated_at: string;
};

export type NarrativeDecision = {
  shouldGenerate: boolean;
  status: NarrativeGenerationStatus;
  reason: "generated" | "unchanged";
};
