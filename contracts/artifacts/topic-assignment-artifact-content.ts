export const TOPIC_ASSIGNMENT_METHODS = [
  "exact_match",
  "semantic_match",
  "human_override",
] as const;

export type TopicAssignmentMethod =
  typeof TOPIC_ASSIGNMENT_METHODS[number];

export type TopicAssignment = {
  assignment_id: string;
  theme_id: string;
  topic_id: string;
  theme_title: string;
  theme_summary: string;
  assignment_method: TopicAssignmentMethod;
  similarity_score: number;
  confidence: number;
};

export type TopicAssignmentCandidateTopic = {
  topic_id: string;
  similarity_score: number;
  rejection_reason: string;
};

export type UnassignedTheme = {
  theme_id: string;
  theme_title: string;
  theme_summary: string;
  highest_similarity_score: number;
  candidate_topics: TopicAssignmentCandidateTopic[];
};

export type TopicAssignmentConfidence = {
  overall: number;
  exact_match_rate: number;
  semantic_match_rate: number;
  unassigned_rate: number;
};

export type TopicAssignmentArtifactContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  registry_version: number;
  assignments: TopicAssignment[];
  unassigned_themes: UnassignedTheme[];
  confidence: TopicAssignmentConfidence;
};
