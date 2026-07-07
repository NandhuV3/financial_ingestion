export const TOPIC_EVOLUTION_HISTORY_STATES = [
  "FIRST_FILING",
  "FIRST_ARTIFACT",
  "DEPENDENCY_MISSING",
  "HISTORY_AVAILABLE",
] as const;

export type TopicEvolutionHistoryState =
  typeof TOPIC_EVOLUTION_HISTORY_STATES[number];

export const TOPIC_EVOLUTION_HISTORY_REASONS = [
  "FIRST_FILING",
  "FIRST_ARTIFACT",
  "PREVIOUS_ARTIFACT_NOT_FOUND",
  "PREVIOUS_ARTIFACT_FAILED",
  "PREVIOUS_ARTIFACT_REJECTED",
  "DEPENDENCY_NOT_AVAILABLE",
] as const;

export type TopicEvolutionHistoryReason =
  typeof TOPIC_EVOLUTION_HISTORY_REASONS[number];

export const TOPIC_EVOLUTION_TYPES = [
  "persistent",
  "emerging",
  "disappearing",
  "strengthening",
  "weakening",
  "narrative_drift",
] as const;

export type TopicEvolutionType = typeof TOPIC_EVOLUTION_TYPES[number];

export type TopicEvolutionHistoryAvailability = {
  history_state: TopicEvolutionHistoryState;
  reason: TopicEvolutionHistoryReason | null;
  requires_previous_period: boolean;
  comparison_performed: boolean;
};

export type TopicEvolutionEvidenceByPeriod = {
  period_id: string;
  assignment_ids: string[];
  theme_summaries: string[];
};

export type TopicEvolutionTopicRecord = {
  topic_id: string;
  evolution_type: TopicEvolutionType;
  current_period: string;
  first_observed_period: string | null;
  last_observed_period: string | null;
  periods_observed: number;
  historical_periods_analyzed: string[];
  current_assignment_count: number;
  previous_assignment_count: number;
  assignment_count_delta: number;
  confidence: number;
  evidence_refs: string[];
  evidence_by_period: TopicEvolutionEvidenceByPeriod[];
};

export type TopicEvolutionConfidence = {
  overall: number;
};

export type TopicEvolutionArtifactContent = {
  company_id: string;
  period_id: string;
  filing_id: string;
  assignment_version: string;
  registry_versions: number[];
  history: TopicEvolutionHistoryAvailability;
  topics: TopicEvolutionTopicRecord[];
  confidence: TopicEvolutionConfidence;
};
