import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type { SemanticMatchReason, SemanticTopicMatch } from "../topic-intelligence/semantic-topic.types.js";

export type TopicRecommendationMethod = "semantic" | "variant_match";

export type TopicAssignmentMethod = "automatic";

export type TopicAssignmentStatus = "assigned" | "low_confidence" | "unassigned";

export type TopicAssignedThemeV2 = Theme & {
  topic_id: string | null;
  confidence: number | null;
  assignment_method: TopicAssignmentMethod | null;
  recommendation_method: TopicRecommendationMethod | null;
  recommendation_reason: SemanticMatchReason | null;
  assignment_status: TopicAssignmentStatus;
};

export type TopicAssignmentOutputV2 = Omit<ThemeOutput, "themes" | "prompt_provenance"> & {
  themes: TopicAssignedThemeV2[];
};

export type TopicAssignmentSummary = {
  assigned_count: number;
  low_confidence_count: number;
  unassigned_count: number;
};
