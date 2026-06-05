import type { ThemeImportance } from "../types/theme.types.js";
import type { PresenceState, TopicObservation, TrendState } from "./topic-evolution.types.js";

const persistentPresenceRatio = 0.75;
const materialCountDelta = 2;

export function importanceScore(importance: ThemeImportance): number {
  if (importance === "high") return 3;
  if (importance === "medium") return 2;
  return 1;
}

export function classifyPresenceState(history: TopicObservation[]): PresenceState {
  if (history.length < 2) {
    return "insufficient_history";
  }

  const latestIndex = history.length - 1;
  const presentIndexes = history
    .map((observation, index) => (observation.present ? index : -1))
    .filter((index) => index >= 0);

  if (presentIndexes.length === 0) {
    return "insufficient_history";
  }

  const latestPresent = presentIndexes.includes(latestIndex);
  const firstPresentIndex = presentIndexes[0];
  const presenceRatio = presentIndexes.length / history.length;

  if (latestPresent && firstPresentIndex === latestIndex) {
    return "new";
  }

  if (!latestPresent && wasPresentInTwoPriorConsecutiveFilings(history)) {
    return "disappeared";
  }

  if (!latestPresent) {
    return "dormant";
  }

  if (presenceRatio >= persistentPresenceRatio) {
    return "persistent";
  }

  return "recurring";
}

export function classifyTrendState(history: TopicObservation[]): TrendState {
  const presentHistory = history.filter((observation) => observation.present);

  if (presentHistory.length < 2) {
    return "insufficient_history";
  }

  const importanceMovement = classifySeries(presentHistory.map((observation) => observation.importance_score), 1);
  const evidenceMovement = classifySeries(presentHistory.map((observation) => observation.evidence_count), materialCountDelta);
  const themeMovement = classifySeries(presentHistory.map((observation) => observation.theme_count), materialCountDelta);
  const movements = [importanceMovement, evidenceMovement, themeMovement];

  if (movements.every((movement) => movement === "flat")) {
    return "stable";
  }

  const hasIncrease = movements.includes("increase");
  const hasDecrease = movements.includes("decrease");
  const hasMixed = movements.includes("mixed");
  const hasWeakChange = movements.includes("weak_change");

  if (hasMixed || (hasIncrease && hasDecrease)) {
    return "mixed";
  }

  if (hasIncrease && !hasDecrease && !hasWeakChange) {
    return "strengthening";
  }

  if (hasDecrease && !hasIncrease && !hasWeakChange) {
    return "weakening";
  }

  return "unknown";
}

function wasPresentInTwoPriorConsecutiveFilings(history: TopicObservation[]): boolean {
  const beforeLatest = history.slice(0, -1);

  for (let index = 1; index < beforeLatest.length; index += 1) {
    if (beforeLatest[index - 1].present && beforeLatest[index].present) {
      return true;
    }
  }

  return false;
}

function classifySeries(values: number[], materialDelta: number): "increase" | "decrease" | "flat" | "mixed" | "weak_change" {
  const first = values[0];
  const last = values.at(-1) ?? first;
  const delta = last - first;

  if (values.every((value) => value === first)) {
    return "flat";
  }

  const nonDecreasing = values.every((value, index) => index === 0 || value >= values[index - 1]);
  const nonIncreasing = values.every((value, index) => index === 0 || value <= values[index - 1]);

  if (Math.abs(delta) < materialDelta) {
    return "weak_change";
  }

  if (nonDecreasing && delta > 0) {
    return "increase";
  }

  if (nonIncreasing && delta < 0) {
    return "decrease";
  }

  return "mixed";
}
