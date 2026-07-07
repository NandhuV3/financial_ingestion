import { TOPIC_EVOLUTION_CONFIDENCE_DECIMAL_PLACES } from "./contract.js";
import type {
  TopicEvolutionConfidence,
  TopicEvolutionTopicRecord,
} from "./types.js";

export function averageConfidence(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return roundConfidence(rawAverage(values));
}

export function persistentConfidence(
  priorAssignmentConfidences: number[],
  currentAssignmentConfidences: number[],
): number {
  return roundConfidence(
    rawAverage([
      rawAverage(priorAssignmentConfidences),
      rawAverage(currentAssignmentConfidences),
    ]),
  );
}

export function calculateTopicEvolutionConfidence(
  evolutions: TopicEvolutionTopicRecord[],
): TopicEvolutionConfidence {
  return {
    overall: averageConfidence(
      evolutions.map(({ confidence }) => confidence),
    ),
  };
}

export function roundConfidence(value: number): number {
  const factor = 10 ** TOPIC_EVOLUTION_CONFIDENCE_DECIMAL_PLACES;

  return Math.round(value * factor) / factor;
}

function rawAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
