import type { ThemeImportance } from "../types/theme.types.js";
import type { PresenceState, TopicObservation } from "./topic-evolution.types.js";

const persistentPresenceRatio = 0.75;
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

function wasPresentInTwoPriorConsecutiveFilings(history: TopicObservation[]): boolean {
  const beforeLatest = history.slice(0, -1);

  for (let index = 1; index < beforeLatest.length; index += 1) {
    if (beforeLatest[index - 1].present && beforeLatest[index].present) {
      return true;
    }
  }

  return false;
}
