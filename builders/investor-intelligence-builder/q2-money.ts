import type { InvestorIntelligenceBuildContext, Q2PromptOutput } from "./types.js";
import {
  parsePromptJson,
  requiredEvidence,
  requiredString,
  requiredStringArray,
} from "./prompt-output.js";

export function buildQ2PromptInput(context: InvestorIntelligenceBuildContext): object {
  return {
    company_id: context.companyId,
    period_id: context.periodId,
    company_knowledge: context.companyKnowledgeArtifact.content,
    quarter_understanding: context.quarterUnderstandingArtifact.content,
    business_signals: context.businessSignalsArtifact?.content ?? null,
    topic_evolution: context.topicEvolutionArtifact?.content ?? null,
  };
}

export function buildQ2UserPrompt(input: object): string {
  return JSON.stringify({ question_id: "q2", input }, null, 2);
}

export function parseQ2PromptOutput(outputText: string): Q2PromptOutput {
  const value = parsePromptJson(outputText, "Q2", [
    "status",
    "summary",
    "revenue_quality",
    "margin_quality",
    "cash_generation_quality",
    "evidence_package",
    "limitations",
  ]);

  return {
    status: requiredString(value.status, "q2.status") as Q2PromptOutput["status"],
    summary: requiredString(value.summary, "q2.summary"),
    revenue_quality: requiredString(value.revenue_quality, "q2.revenue_quality"),
    margin_quality: requiredString(value.margin_quality, "q2.margin_quality"),
    cash_generation_quality: requiredString(value.cash_generation_quality, "q2.cash_generation_quality"),
    evidence_package: requiredEvidence(value.evidence_package, "q2.evidence_package"),
    limitations: requiredStringArray(value.limitations, "q2.limitations"),
  };
}
