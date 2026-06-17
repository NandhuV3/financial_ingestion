import type { InvestorIntelligenceBuildContext, Q1PromptOutput } from "./types.js";
import {
  parsePromptJson,
  requiredEvidence,
  requiredString,
  requiredStringArray,
} from "./prompt-output.js";

export function buildQ1PromptInput(context: InvestorIntelligenceBuildContext): object {
  return {
    company_id: context.companyId,
    period_id: context.periodId,
    company_knowledge: context.companyKnowledgeArtifact.content,
    quarter_understanding: context.quarterUnderstandingArtifact.content,
  };
}

export function buildQ1UserPrompt(input: object): string {
  return JSON.stringify({ question_id: "q1", input }, null, 2);
}

export function parseQ1PromptOutput(outputText: string): Q1PromptOutput {
  const value = parsePromptJson(outputText, "Q1", [
    "status",
    "summary",
    "strengths",
    "weaknesses",
    "evidence_package",
    "limitations",
  ]);

  return {
    status: requiredString(value.status, "q1.status") as Q1PromptOutput["status"],
    summary: requiredString(value.summary, "q1.summary"),
    strengths: requiredStringArray(value.strengths, "q1.strengths"),
    weaknesses: requiredStringArray(value.weaknesses, "q1.weaknesses"),
    evidence_package: requiredEvidence(value.evidence_package, "q1.evidence_package"),
    limitations: requiredStringArray(value.limitations, "q1.limitations"),
  };
}
