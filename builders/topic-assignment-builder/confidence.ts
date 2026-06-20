import type {
  TopicAssignment,
  TopicAssignmentConfidence,
} from "./types.js";
import { SIMILARITY_DECIMAL_PLACES } from "./contract.js";

export function calculateTopicAssignmentConfidence(
  assignments: TopicAssignment[],
  totalThemes: number,
  unassignedCount: number,
): TopicAssignmentConfidence {
  if (totalThemes === 0) {
    return {
      overall: 0,
      exact_match_rate: 0,
      semantic_match_rate: 0,
      unassigned_rate: 0,
    };
  }

  const assignedThemeIds = new Set(assignments.map(({ theme_id }) => theme_id));
  const exactThemeIds = new Set(
    assignments
      .filter(({ assignment_method }) => assignment_method === "exact_match")
      .map(({ theme_id }) => theme_id),
  );
  const semanticThemeIds = new Set(
    assignments
      .filter(({ assignment_method }) => assignment_method === "semantic_match")
      .map(({ theme_id }) => theme_id),
  );

  return {
    overall: round(assignedThemeIds.size / totalThemes),
    exact_match_rate: round(exactThemeIds.size / totalThemes),
    semantic_match_rate: round(semanticThemeIds.size / totalThemes),
    unassigned_rate: round(unassignedCount / totalThemes),
  };
}

function round(value: number): number {
  const factor = 10 ** SIMILARITY_DECIMAL_PLACES;

  return Math.round(value * factor) / factor;
}
