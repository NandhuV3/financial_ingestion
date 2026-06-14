import type { TopicObservation } from "./topic-evolution.types.js";
import type { TopicStrengthInput } from "./topic-trend.types.js";

export function calculateTopicStrength(input: TopicStrengthInput): number {
  return (input.importance_score * 10) + input.evidence_count + input.theme_count;
}

export function buildStrengthHistory(history: TopicObservation[]): number[] {
  return history
    .filter((observation) => observation.present)
    .map((observation) => calculateTopicStrength(observation));
}
