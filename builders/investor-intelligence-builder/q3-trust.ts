import type { InvestorIntelligenceBuildContext, Q3PromptOutput } from "./types.js";
import {
  optionalString,
  parsePromptJson,
  requiredEvidence,
  requiredString,
  requiredStringArray,
} from "./prompt-output.js";

export function buildQ3PromptInput(context: InvestorIntelligenceBuildContext): object {
  const trustDimensionAbsent = context.quarterUnderstandingArtifact.content.depth_indicator.trust_dimension === "absent";

  return {
    company_id: context.companyId,
    period_id: context.periodId,
    company_knowledge: context.companyKnowledgeArtifact.content,
    quarter_understanding: context.quarterUnderstandingArtifact.content,
    trust_signals: trustDimensionAbsent ? context.trustSignalsArtifact?.content ?? null : null,
    commitment_tracking: context.commitmentTrackingArtifact?.content ?? null,
  };
}

export function buildQ3UserPrompt(input: object): string {
  return JSON.stringify({ question_id: "q3", input }, null, 2);
}

export function parseQ3PromptOutput(outputText: string): Q3PromptOutput {
  const value = parsePromptJson(outputText, "Q3", [
    "status",
    "summary",
    "trust_assessment",
    "trust_depth_limitation",
    "evidence_package",
    "limitations",
  ]);

  return {
    status: requiredString(value.status, "q3.status") as Q3PromptOutput["status"],
    summary: requiredString(value.summary, "q3.summary"),
    trust_assessment: optionalString(value.trust_assessment, "q3.trust_assessment"),
    trust_depth_limitation: optionalString(value.trust_depth_limitation, "q3.trust_depth_limitation"),
    evidence_package: requiredEvidence(value.evidence_package, "q3.evidence_package"),
    limitations: requiredStringArray(value.limitations, "q3.limitations"),
  };
}
