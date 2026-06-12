import type { SemanticDecision } from "./semantic-topic.types.js";

export const autoAssignThreshold = 0.95;

export function scoreToDecision(confidence: number): SemanticDecision {
  return confidence >= autoAssignThreshold ? "auto_assign" : "low_confidence";
}

export function normalizeConfidence(value: number): number {
  return Number(value.toFixed(4));
}
