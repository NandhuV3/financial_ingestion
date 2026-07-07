import {
  averageConfidence,
  persistentConfidence,
  roundConfidence,
} from "./confidence.js";
import type {
  TopicEvolutionTopicRecord,
  TopicPeriodObservation,
} from "./types.js";

export function buildTopicEvolutions(
  historicalPeriods: string[],
  currentPeriod: string,
  historicalObservations: Array<Map<string, TopicPeriodObservation>>,
  currentObservations: Map<string, TopicPeriodObservation>,
): TopicEvolutionTopicRecord[] {
  const topicIds = new Set<string>();

  for (const observations of historicalObservations) {
    for (const topicId of observations.keys()) {
      topicIds.add(topicId);
    }
  }

  for (const topicId of currentObservations.keys()) {
    topicIds.add(topicId);
  }

  const previousObservations =
    historicalObservations[historicalObservations.length - 1] ?? new Map();

  return [...topicIds]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((topicId) => buildTopicEvolutionRecords({
      topicId,
      historicalPeriods,
      currentPeriod,
      historicalObservations,
      previous: previousObservations.get(topicId),
      current: currentObservations.get(topicId),
    }));
}

function buildTopicEvolutionRecords(input: {
  topicId: string;
  historicalPeriods: string[];
  currentPeriod: string;
  historicalObservations: Array<Map<string, TopicPeriodObservation>>;
  previous: TopicPeriodObservation | undefined;
  current: TopicPeriodObservation | undefined;
}): TopicEvolutionTopicRecord[] {
  const historicalForTopic = input.historicalObservations
    .map((observations) => observations.get(input.topicId))
    .filter((observation): observation is TopicPeriodObservation =>
      observation !== undefined);
  const observedPeriods = [
    ...historicalForTopic.map(({ period }) => period),
    ...(input.current === undefined ? [] : [input.current.period]),
  ].sort();

  if (input.current === undefined) {
    if (historicalForTopic.length === 0) {
      return [];
    }

    return [record({
      topicId: input.topicId,
      evolutionType: "disappearing",
      currentPeriod: input.currentPeriod,
      historicalPeriods: input.historicalPeriods,
      firstObservedPeriod: observedPeriods[0] ?? null,
      lastObservedPeriod: observedPeriods[observedPeriods.length - 1] ?? null,
      periodsObserved: observedPeriods.length,
      current: undefined,
      previous: input.previous,
      observations: historicalForTopic,
      confidence: averageConfidence(flattenConfidences(historicalForTopic)),
    })];
  }

  if (historicalForTopic.length === 0) {
    return [record({
      topicId: input.topicId,
      evolutionType: "emerging",
      currentPeriod: input.currentPeriod,
      historicalPeriods: input.historicalPeriods,
      firstObservedPeriod: input.currentPeriod,
      lastObservedPeriod: input.currentPeriod,
      periodsObserved: 1,
      current: input.current,
      previous: undefined,
      observations: [input.current],
      confidence: averageConfidence(input.current.assignment_confidences),
    })];
  }

  const records = [record({
    topicId: input.topicId,
    evolutionType: "persistent",
    currentPeriod: input.currentPeriod,
    historicalPeriods: input.historicalPeriods,
    firstObservedPeriod: observedPeriods[0] ?? null,
    lastObservedPeriod: input.currentPeriod,
    periodsObserved: observedPeriods.length,
    current: input.current,
    previous: input.previous,
    observations: [...historicalForTopic, input.current],
    confidence: persistentConfidence(
      flattenConfidences(historicalForTopic),
      input.current.assignment_confidences,
    ),
  })];

  if (input.previous !== undefined) {
    const delta =
      input.current.assignment_ids.length - input.previous.assignment_ids.length;

    if (delta > 0) {
      records.push(record({
        topicId: input.topicId,
        evolutionType: "strengthening",
        currentPeriod: input.currentPeriod,
        historicalPeriods: input.historicalPeriods,
        firstObservedPeriod: observedPeriods[0] ?? null,
        lastObservedPeriod: input.currentPeriod,
        periodsObserved: observedPeriods.length,
        current: input.current,
        previous: input.previous,
        observations: [input.previous, input.current],
        confidence: persistentConfidence(
          input.previous.assignment_confidences,
          input.current.assignment_confidences,
        ),
      }));
    }

    if (delta < 0) {
      records.push(record({
        topicId: input.topicId,
        evolutionType: "weakening",
        currentPeriod: input.currentPeriod,
        historicalPeriods: input.historicalPeriods,
        firstObservedPeriod: observedPeriods[0] ?? null,
        lastObservedPeriod: input.currentPeriod,
        periodsObserved: observedPeriods.length,
        current: input.current,
        previous: input.previous,
        observations: [input.previous, input.current],
        confidence: persistentConfidence(
          input.previous.assignment_confidences,
          input.current.assignment_confidences,
        ),
      }));
    }

    if (summariesChanged(input.previous, input.current)) {
      records.push(record({
        topicId: input.topicId,
        evolutionType: "narrative_drift",
        currentPeriod: input.currentPeriod,
        historicalPeriods: input.historicalPeriods,
        firstObservedPeriod: observedPeriods[0] ?? null,
        lastObservedPeriod: input.currentPeriod,
        periodsObserved: observedPeriods.length,
        current: input.current,
        previous: input.previous,
        observations: [input.previous, input.current],
        confidence: persistentConfidence(
          input.previous.assignment_confidences,
          input.current.assignment_confidences,
        ),
      }));
    }
  }

  return records.sort((left, right) =>
    left.evolution_type.localeCompare(right.evolution_type));
}

function record(input: {
  topicId: string;
  evolutionType: TopicEvolutionTopicRecord["evolution_type"];
  currentPeriod: string;
  historicalPeriods: string[];
  firstObservedPeriod: string | null;
  lastObservedPeriod: string | null;
  periodsObserved: number;
  current: TopicPeriodObservation | undefined;
  previous: TopicPeriodObservation | undefined;
  observations: TopicPeriodObservation[];
  confidence: number;
}): TopicEvolutionTopicRecord {
  const currentCount = input.current?.assignment_ids.length ?? 0;
  const previousCount = input.previous?.assignment_ids.length ?? 0;

  return {
    topic_id: input.topicId,
    evolution_type: input.evolutionType,
    current_period: input.currentPeriod,
    first_observed_period: input.firstObservedPeriod,
    last_observed_period: input.lastObservedPeriod,
    periods_observed: input.periodsObserved,
    historical_periods_analyzed: [...input.historicalPeriods],
    current_assignment_count: currentCount,
    previous_assignment_count: previousCount,
    assignment_count_delta: currentCount - previousCount,
    confidence: roundConfidence(input.confidence),
    evidence_refs: input.observations
      .flatMap(({ assignment_ids }) => assignment_ids)
      .sort((left, right) => left.localeCompare(right)),
    evidence_by_period: input.observations
      .map((observation) => ({
        period_id: observation.period,
        assignment_ids: [...observation.assignment_ids]
          .sort((left, right) => left.localeCompare(right)),
        theme_summaries: [...observation.theme_summaries]
          .sort((left, right) => left.localeCompare(right)),
      }))
      .sort((left, right) => left.period_id.localeCompare(right.period_id)),
  };
}

function flattenConfidences(
  observations: TopicPeriodObservation[],
): number[] {
  return observations.flatMap(({ assignment_confidences }) =>
    assignment_confidences);
}

function summariesChanged(
  previous: TopicPeriodObservation,
  current: TopicPeriodObservation,
): boolean {
  return canonicalSummaries(previous).join("\n")
    !== canonicalSummaries(current).join("\n");
}

function canonicalSummaries(observation: TopicPeriodObservation): string[] {
  return observation.theme_summaries
    .map((summary) => summary.trim().toLowerCase())
    .sort((left, right) => left.localeCompare(right));
}
