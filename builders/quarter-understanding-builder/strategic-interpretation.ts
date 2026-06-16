import { directionFromSignals, importanceFromSignals } from "./business-interpretation.js";
import type { QuarterUnderstandingBuildContext, UnderstandingSeed } from "./types.js";

export function buildStrategicInterpretations(context: QuarterUnderstandingBuildContext): UnderstandingSeed[] {
  const strategicSignals = context.businessSignalsArtifact.content.signals.filter((signal) =>
    signal.category === "strategic");
  const priorities = context.companyKnowledgeArtifact.content.knowledge.strategic_priorities;
  const topics = context.topicEvolutionArtifact?.content.topics.filter((topic) =>
    topic.current_status === "present" && topic.trend_state !== "insufficient_history") ?? [];

  if (strategicSignals.length === 0 && priorities.length === 0 && topics.length === 0) {
    return [];
  }

  return [{
    category: "strategy",
    title: "Strategic signals describe period progress",
    explanation: `Strategic interpretation combines ${strategicSignals.length} current strategic signal(s), ${priorities.length} durable priority statement(s), and ${topics.length} longitudinal topic observation(s).`,
    importance: importanceFromSignals(strategicSignals),
    direction: directionFromSignals(strategicSignals),
    signal_refs: strategicSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: priorities.map((_, index) => `strategic_priorities.${index}`),
    trust_signal_refs: [],
    topic_refs: topics.map((topic) => topic.topic_id),
  }];
}
