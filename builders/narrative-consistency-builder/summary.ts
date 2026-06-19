import type {
  LanguageShift,
  NarrativeSummary,
  StrategicPriority,
} from "./types.js";

export function buildNarrativeSummary(
  priorities: StrategicPriority[],
  shifts: LanguageShift[],
): NarrativeSummary {
  const persistent = priorities.filter(
    (priority) => priority.current_status === "persistent",
  ).length;

  return {
    active_priorities: priorities.filter((priority) =>
      ["active", "persistent", "declining", "reintroduced"].includes(
        priority.current_status,
      )).length,
    new_priorities: priorities.filter(
      (priority) => priority.current_status === "new",
    ).length,
    dropped_priorities: priorities.filter(
      (priority) => priority.current_status === "dropped",
    ).length,
    significant_language_shifts: shifts.filter(
      (shift) => shift.shift_magnitude === "significant",
    ).length,
    stable_priority_ratio: priorities.length === 0
      ? 0
      : persistent / priorities.length,
  };
}
