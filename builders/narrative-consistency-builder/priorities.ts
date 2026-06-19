import {
  NARRATIVE_CONSISTENCY_CALIBRATION,
  type PriorityStatus,
} from "./contract.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  NarrativeBuildDependencies,
  PriorityObservation,
  PriorityTimeline,
  StrategicPriority,
} from "./types.js";
import { isPeriodAfter } from "./period.js";

type PriorityState = {
  priority_id: string;
  concept_ref: string;
  description: string;
  first_seen_period: string;
  last_seen_period: string;
  consecutive_periods: number;
  status: PriorityStatus;
  evidence_refs: string[];
  continuity_broken: boolean;
  confidence_values: number[];
  timeline: PriorityTimeline["periods"];
};

export function buildPriorityContent(
  dependencies: NarrativeBuildDependencies,
  currentPeriod: string,
): {
  priorities: StrategicPriority[];
  timelines: PriorityTimeline[];
} {
  const states = seedPriorities(dependencies);
  const observationsByPeriod = observationsByPeriodAndPriority(dependencies);
  const availablePeriods = new Set(dependencies.sources.map(
    ({ declaration }) => declaration.period_id,
  ));
  const priorPeriod = dependencies.prior?.content.period ?? null;
  const periods = [...new Set([
    ...availablePeriods,
    ...dependencies.missing_periods.map(({ period_id }) => period_id),
  ])]
    .filter((period) => priorPeriod === null || isPeriodAfter(period, priorPeriod))
    .sort();

  for (const period of periods) {
    if (!availablePeriods.has(period)) {
      for (const [priorityId, state] of states) {
        states.set(priorityId, breakPriorityContinuity(state));
      }
      continue;
    }

    const observations = observationsByPeriod.get(period) ?? new Map();
    const knownIds = new Set([...states.keys(), ...observations.keys()]);

    for (const priorityId of [...knownIds].sort()) {
      const observation = observations.get(priorityId);
      const state = states.get(priorityId);

      if (observation !== undefined) {
        states.set(priorityId, updateObservedPriority(state, observation, period));
      } else if (state !== undefined && state.last_seen_period !== period) {
        states.set(priorityId, updateMissingPriority(
          state,
          period,
          evidenceForAvailablePeriod(dependencies, period),
        ));
      }
    }
  }

  const priorities = [...states.values()]
    .filter((state) =>
      state.timeline.at(-1)?.period === currentPeriod
      || state.last_seen_period.localeCompare(currentPeriod) <= 0)
    .map((state): StrategicPriority => ({
      priority_id: state.priority_id,
      concept_ref: state.concept_ref,
      description: state.description,
      first_seen_period: state.first_seen_period,
      last_seen_period: state.last_seen_period,
      consecutive_periods: state.consecutive_periods,
      current_status: state.status,
      evidence_refs: sortedUnique(state.evidence_refs),
      confidence: average(state.confidence_values),
    }))
    .sort((left, right) => left.priority_id.localeCompare(right.priority_id));
  const timelines = [...states.values()]
    .map((state): PriorityTimeline => ({
      priority_id: state.priority_id,
      periods: [...state.timeline].sort((left, right) => left.period.localeCompare(right.period)),
    }))
    .sort((left, right) => left.priority_id.localeCompare(right.priority_id));

  return {
    priorities,
    timelines,
  };
}

function seedPriorities(
  dependencies: NarrativeBuildDependencies,
): Map<string, PriorityState> {
  const states = new Map<string, PriorityState>();

  if (dependencies.prior === null) {
    return states;
  }

  const timelineById = new Map(
    dependencies.prior.content.priority_timelines.map((timeline) => [
      timeline.priority_id,
      timeline.periods,
    ]),
  );

  for (const priority of dependencies.prior.content.strategic_priorities) {
    states.set(priority.priority_id, {
      priority_id: priority.priority_id,
      concept_ref: priority.concept_ref,
      description: priority.description,
      first_seen_period: priority.first_seen_period,
      last_seen_period: priority.last_seen_period,
      consecutive_periods: priority.consecutive_periods,
      status: priority.current_status,
      evidence_refs: [...priority.evidence_refs],
      continuity_broken: false,
      confidence_values: [priority.confidence],
      timeline: [...timelineById.get(priority.priority_id) ?? []],
    });
  }

  return states;
}

function observationsByPeriodAndPriority(
  dependencies: NarrativeBuildDependencies,
): Map<string, Map<string, PriorityObservation>> {
  const result = new Map<string, Map<string, PriorityObservation>>();

  for (const source of dependencies.sources) {
    const period = source.declaration.period_id;
    const observations = result.get(period) ?? new Map<string, PriorityObservation>();

    for (const observation of source.artifact.content.priority_observations) {
      const existing = observations.get(observation.priority_id);
      if (existing === undefined) {
        observations.set(observation.priority_id, {
          ...observation,
          evidence_refs: [...observation.evidence_refs],
        });
        continue;
      }

      if (existing.concept_ref !== observation.concept_ref) {
        throw new BuilderValidationError(
          `Priority ${observation.priority_id} has conflicting concept references.`,
        );
      }

      observations.set(observation.priority_id, {
        ...existing,
        mention_count: existing.mention_count + observation.mention_count,
        evidence_refs: sortedUnique([...existing.evidence_refs, ...observation.evidence_refs]),
        confidence: average([existing.confidence, observation.confidence]),
      });
    }

    result.set(period, observations);
  }

  return result;
}

function updateObservedPriority(
  state: PriorityState | undefined,
  observation: PriorityObservation,
  period: string,
): PriorityState {
  if (state === undefined) {
    return {
      priority_id: observation.priority_id,
      concept_ref: observation.concept_ref,
      description: observation.description,
      first_seen_period: period,
      last_seen_period: period,
      consecutive_periods: 1,
      status: "new",
      evidence_refs: [...observation.evidence_refs],
      continuity_broken: false,
      confidence_values: [observation.confidence],
      timeline: [{
        period,
        status: "new",
        mention_count: observation.mention_count,
        evidence_refs: [...observation.evidence_refs].sort(),
      }],
    };
  }

  assertStablePriority(state, observation);
  const previousEvent = state.timeline.at(-1);
  const reintroduced = state.status === "dropped";
  const consecutivePeriods = reintroduced ? 1 : state.consecutive_periods + 1;
  const status = classifyObservedStatus({
    reintroduced,
    consecutivePeriods,
    previousMentions: state.continuity_broken
      ? observation.mention_count
      : previousEvent?.mention_count ?? observation.mention_count,
    currentMentions: observation.mention_count,
  });

  return {
    ...state,
    description: observation.description,
    last_seen_period: period,
    consecutive_periods: consecutivePeriods,
    status,
    evidence_refs: sortedUnique([...state.evidence_refs, ...observation.evidence_refs]),
    continuity_broken: false,
    confidence_values: [...state.confidence_values, observation.confidence],
    timeline: upsertTimeline(state.timeline, {
      period,
      status,
      mention_count: observation.mention_count,
      evidence_refs: [...observation.evidence_refs].sort(),
    }),
  };
}

function updateMissingPriority(
  state: PriorityState,
  period: string,
  evidenceRefs: string[],
): PriorityState {
  if (state.status === "dropped") {
    return state;
  }

  return {
    ...state,
    consecutive_periods: 0,
    status: "dropped",
    evidence_refs: sortedUnique([...state.evidence_refs, ...evidenceRefs]),
    timeline: upsertTimeline(state.timeline, {
      period,
      status: "dropped",
      mention_count: 0,
      evidence_refs: [...evidenceRefs],
    }),
  };
}

function breakPriorityContinuity(state: PriorityState): PriorityState {
  return {
    ...state,
    consecutive_periods: 0,
    continuity_broken: true,
  };
}

function classifyObservedStatus(input: {
  reintroduced: boolean;
  consecutivePeriods: number;
  previousMentions: number;
  currentMentions: number;
}): PriorityStatus {
  if (input.reintroduced) {
    return "reintroduced";
  }

  if (input.currentMentions < input.previousMentions) {
    return "declining";
  }

  if (
    input.consecutivePeriods
    >= NARRATIVE_CONSISTENCY_CALIBRATION.persistent_after_consecutive_periods
  ) {
    return "persistent";
  }

  return "active";
}

function assertStablePriority(
  state: PriorityState,
  observation: PriorityObservation,
): void {
  if (state.concept_ref !== observation.concept_ref) {
    throw new BuilderValidationError(
      `Priority ${observation.priority_id} changed its stable concept reference.`,
    );
  }
}

function upsertTimeline(
  timeline: PriorityTimeline["periods"],
  event: PriorityTimeline["periods"][number],
): PriorityTimeline["periods"] {
  const existing = timeline.find((item) => item.period === event.period);

  if (existing !== undefined) {
    return timeline.map((item) => item.period === event.period ? event : item);
  }

  return [...timeline, event];
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function evidenceForAvailablePeriod(
  dependencies: NarrativeBuildDependencies,
  period: string,
): string[] {
  return dependencies.sources
    .filter(({ declaration }) => declaration.period_id === period)
    .map(({ artifact }) => artifact.identity.artifact_id)
    .sort();
}
