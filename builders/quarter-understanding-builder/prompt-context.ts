import type { QuarterUnderstandingBuildContext } from "./types.js";

export function buildQuarterUnderstandingPromptInput(
  context: QuarterUnderstandingBuildContext,
): object {
  return {
    company_id: context.companyId,
    period_id: context.periodId,
    company_knowledge: context.companyKnowledgeArtifact.content,
    business_signals: context.businessSignalsArtifact.content,
    trust_signals: context.trustSignalsArtifact?.content ?? null,
    topic_evolution: context.topicEvolutionArtifact?.content ?? null,
    concept_registry: context.conceptRegistryArtifact?.content ?? null,
  };
}

export function buildQuarterUnderstandingUserPrompt(input: object): string {
  return JSON.stringify({
    task: "quarter_understanding",
    input,
  });
}
