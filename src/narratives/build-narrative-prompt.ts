import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { NarrativePromptInput } from "./narrative.types.js";

export const NARRATIVE_SYSTEM_PROMPT = `You are an investor communications analyst.

Write investor-friendly narrative from structured intelligence only.
Do not analyze raw filings.
Do not infer evidence.
Do not create new themes, risks, comparisons, or facts.
Use only the supplied structured artifacts.
Return JSON only.`;

export function buildNarrativePromptInput(params: {
  filingMetadata: FilingMetadata;
  quarterChangeReport: QuarterChangeReport;
  investorInsight: InvestorInsight;
  themesWithTopics: ThemeOutput | null;
}): NarrativePromptInput {
  return {
    company: params.filingMetadata.company,
    ticker: params.filingMetadata.ticker,
    filing_date: params.filingMetadata.filing_date,
    filing_metadata: params.filingMetadata,
    quarter_changes: params.quarterChangeReport,
    investor_signals: params.investorInsight,
    topics: params.themesWithTopics,
    new_topics: params.investorInsight.new_topics,
    removed_topics: params.investorInsight.removed_topics,
    risks: params.investorInsight.risks,
    opportunities: params.investorInsight.opportunities,
    top_signals: params.investorInsight.key_changes.slice(0, 8),
  };
}

export function buildNarrativePrompt(input: NarrativePromptInput): string {
  return `Generate an investor narrative from the structured intelligence below.

Output schema:
{
  "headline": "",
  "executive_summary": "",
  "what_changed": "",
  "bull_case": "",
  "bear_case": "",
  "investor_takeaway": ""
}

Rules:
- JSON only.
- Do not mention raw filings.
- Do not invent facts, metrics, risks, or opportunities.
- Do not perform additional comparison.
- Base all statements on the provided quarter_changes and investor_signals.
- Keep the tone investor-friendly, concise, and specific.
- Use plain business language.

Structured intelligence:
${JSON.stringify(input, null, 2)}`;
}

export function calculateNarrativeInputHash(input: NarrativePromptInput): string {
  return calculateStringHash(JSON.stringify(input));
}
