import type { BusinessSignal, SignalBuildContext, TopicEvolutionInput } from "./types.js";
import { buildSignal, sourceRef } from "./signal-factory.js";

export function buildTrendSignals(context: SignalBuildContext): BusinessSignal[] {
  if (context.topicEvolutionArtifact === null) {
    return [];
  }

  const source = sourceRef(context.topicEvolutionArtifact);

  return context.topicEvolutionArtifact.content.topics
    .filter((topic) => topic.trend_state !== "insufficient_history" && topic.trend_state !== "unknown")
    .map((topic) => buildSignal({
      signal_type: signalTypeForTopic(topic),
      company_id: context.companyId,
      period_id: context.periodId,
      category: "strategic",
      direction: directionForTopic(topic),
      magnitude: "medium",
      observation: `Topic trend observed: ${topic.topic_name} is ${topic.trend_state}`,
      evidence_refs: [`topic_evolution.topics.${topic.topic_id}`],
      source_artifact_refs: [
        sourceRef(context.companyKnowledgeArtifact),
        source,
      ],
      rule_ref: "business_signals.trend.topic_evolution_observed",
      company_knowledge_refs: ["strategic_priorities"],
      topic_refs: [topic.topic_id],
      evidence_confidence: boundedScore(topic.presence_ratio),
    }));
}

function signalTypeForTopic(topic: TopicEvolutionInput): string {
  return `TOPIC_${topic.trend_state.toUpperCase()}`;
}

function directionForTopic(topic: TopicEvolutionInput): BusinessSignal["direction"] {
  if (topic.trend_state === "weakening") {
    return "deteriorating";
  }

  if (topic.trend_state === "stable" || topic.trend_state === "mixed") {
    return "stable";
  }

  return "improving";
}

function boundedScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

