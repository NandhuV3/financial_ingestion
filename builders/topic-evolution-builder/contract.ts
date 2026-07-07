export const TOPIC_EVOLUTION_BUILDER_TYPE = "topic-evolution-builder";
export const TOPIC_EVOLUTION_BUILDER_VERSION = "topic-evolution-builder-v1";
export const TOPIC_EVOLUTION_SCHEMA_VERSION = "topic-evolution-artifact-v1";
export const TOPIC_EVOLUTION_PIPELINE_VERSION = "topic-evolution-pipeline-v1";

/**
 * Owner: Topic Evolution V1 contract.
 * Purpose: stabilize persisted confidence calculations.
 * Justification: 020 requires confidence rounded to four decimal places.
 * Range: non-negative integer decimal places.
 */
export const TOPIC_EVOLUTION_CONFIDENCE_DECIMAL_PLACES = 4;

/**
 * Owner: Topic Evolution V1 contract.
 * Purpose: define the minimum number of distinct periods required to classify evolution.
 * Justification: 020 requires the current and immediately preceding periods.
 * Range: positive integer.
 */
export const TOPIC_EVOLUTION_MINIMUM_PERIODS = 2;

export function historicalTopicAssignmentDependencyKey(
  period: string,
): string {
  return `historical_topic_assignments:${period}`;
}
