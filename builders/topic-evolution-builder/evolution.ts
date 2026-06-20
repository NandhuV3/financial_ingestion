import {
  averageConfidence,
  persistentConfidence,
} from "./confidence.js";
import type {
  TopicEvolution,
  TopicPeriodObservation,
} from "./types.js";

export function buildTopicEvolutions(
  priorPeriod: string,
  currentPeriod: string,
  priorObservations: Map<string, TopicPeriodObservation>,
  currentObservations: Map<string, TopicPeriodObservation>,
): TopicEvolution[] {
  const topicIds = new Set([
    ...priorObservations.keys(),
    ...currentObservations.keys(),
  ]);

  return [...topicIds]
    .sort((left, right) => left.localeCompare(right))
    .map((topicId) => buildTopicEvolution(
      topicId,
      priorPeriod,
      currentPeriod,
      priorObservations.get(topicId),
      currentObservations.get(topicId),
    ))
    .filter((evolution): evolution is TopicEvolution => evolution !== null);
}

function buildTopicEvolution(
  topicId: string,
  priorPeriod: string,
  currentPeriod: string,
  prior: TopicPeriodObservation | undefined,
  current: TopicPeriodObservation | undefined,
): TopicEvolution | null {
  if (prior === undefined && current === undefined) {
    return null;
  }

  if (prior !== undefined && current !== undefined) {
    return {
      topic_id: topicId,
      first_seen_period: priorPeriod,
      last_seen_period: currentPeriod,
      periods_present: 2,
      evolution_state: "PERSISTENT",
      strength_direction: "not_assessed",
      narrative_drift: "not_assessed",
      confidence: persistentConfidence(
        prior.assignment_confidences,
        current.assignment_confidences,
      ),
      evidence: buildEvidence(
        priorPeriod,
        currentPeriod,
        prior,
        current,
      ),
    };
  }

  if (current !== undefined) {
    return {
      topic_id: topicId,
      first_seen_period: currentPeriod,
      last_seen_period: currentPeriod,
      periods_present: 1,
      evolution_state: "EMERGING",
      strength_direction: "not_assessed",
      narrative_drift: "not_assessed",
      confidence: averageConfidence(current.assignment_confidences),
      evidence: buildEvidence(
        priorPeriod,
        currentPeriod,
        undefined,
        current,
      ),
    };
  }

  return {
    topic_id: topicId,
    first_seen_period: priorPeriod,
    last_seen_period: priorPeriod,
    periods_present: 1,
    evolution_state: "DISAPPEARED",
    strength_direction: "not_assessed",
    narrative_drift: "not_assessed",
    confidence: averageConfidence(prior!.assignment_confidences),
    evidence: buildEvidence(
      priorPeriod,
      currentPeriod,
      prior,
      undefined,
    ),
  };
}

function buildEvidence(
  priorPeriod: string,
  currentPeriod: string,
  prior: TopicPeriodObservation | undefined,
  current: TopicPeriodObservation | undefined,
): TopicEvolution["evidence"] {
  const observations = [prior, current].filter(
    (observation): observation is TopicPeriodObservation =>
      observation !== undefined,
  );

  return {
    periods_analyzed: [priorPeriod, currentPeriod],
    supporting_assignment_refs: observations
      .flatMap(({ assignment_ids }) => assignment_ids)
      .sort((left, right) => left.localeCompare(right)),
    theme_summaries_by_period: [
      summariesForPeriod(priorPeriod, prior),
      summariesForPeriod(currentPeriod, current),
    ],
  };
}

function summariesForPeriod(
  period: string,
  observation: TopicPeriodObservation | undefined,
): TopicEvolution["evidence"]["theme_summaries_by_period"][number] {
  return {
    period,
    theme_summaries: observation === undefined
      ? []
      : [...observation.theme_summaries]
        .sort((left, right) => left.localeCompare(right)),
  };
}
