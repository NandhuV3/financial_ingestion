import type { FilingMetadata } from "../types/pipeline.types.js";

export type InvestorInsight = {
  company: string;
  ticker: string;
  filing_date: string;
  previous_filing_date: string | null;
  headline: string;
  executive_summary: string;
  key_changes: string[];
  new_topics: string[];
  removed_topics: string[];
  risks: string[];
  opportunities: string[];
  source: {
    current_filing: FilingMetadata;
    previous_filing: FilingMetadata | null;
    quarter_change_report: string;
    themes: string;
  };
};
