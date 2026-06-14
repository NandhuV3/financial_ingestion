import type { ThemeImportance } from "../types/theme.types.js";

export type PresenceState = "new" | "recurring" | "persistent" | "dormant" | "disappeared" | "insufficient_history";

export type TrendState = "strengthening" | "weakening" | "stable" | "mixed" | "insufficient_history" | "unknown";

export type CurrentStatus = "present" | "absent";

export type FilingMetadataForEvolution = {
  company: string;
  ticker: string;
  filing_date: string;
  form_type: string;
  accession_number?: string;
};

export type AssignedTopicTheme = {
  theme: string;
  category: string;
  importance: ThemeImportance;
  summary: string;
  evidence: string[];
  topic_id?: string | null;
  assignment_status?: "assigned" | "low_confidence" | "unassigned";
  confidence?: number | null;
};

export type TopicEvolutionFilingInput = {
  metadata: FilingMetadataForEvolution;
  themes: AssignedTopicTheme[];
  themes_with_topics_file_exists: boolean;
};

export type TopicObservation = {
  filing_date: string;
  form_type: string;
  accession_number: string | null;
  present: boolean;
  importance: ThemeImportance | null;
  importance_score: number;
  evidence_count: number;
  theme_count: number;
  topic_strength: number;
  theme_names: string[];
  categories: string[];
  assignment_statuses: string[];
  confidence_scores: number[];
};

export type TopicEvolution = {
  topic_id: string;
  topic_name: string;
  presence_state: PresenceState;
  trend_state: TrendState;
  current_status: CurrentStatus;
  first_seen: string | null;
  last_seen: string | null;
  quarters_present: number;
  quarters_absent: number;
  presence_ratio: number;
  strength_history: number[];
  history: TopicObservation[];
};

export type TopicEvolutionSummary = {
  topics_analyzed: number;
  topics_present_latest: number;
  new_topics: number;
  persistent_topics: number;
  recurring_topics: number;
  dormant_topics: number;
  disappeared_topics: number;
  strengthening_topics: number;
  weakening_topics: number;
  stable_topics: number;
  mixed_topics: number;
  unknown_trend_topics: number;
  insufficient_history_topics: number;
};

export type TopicEvolutionDiagnostics = {
  assigned_topics_used: number;
  unassigned_topics_ignored: number;
  themes_without_topic_ignored: number;
  missing_themes_with_topics_files: string[];
  filings_with_no_assigned_topics: string[];
  duration_ms: number;
};

export type TopicEvolutionReport = {
  company: string;
  ticker: string;
  generated_at: string;
  history_start: string | null;
  history_end: string | null;
  filings_analyzed: number;
  filing_dates: string[];
  topic_registry_version: string;
  topic_registry_hash: string;
  assignment_policy: {
    included_statuses: ["assigned", "low_confidence"];
    excluded_statuses: ["unassigned", "missing"];
  };
  summary: TopicEvolutionSummary;
  topics: TopicEvolution[];
  diagnostics: TopicEvolutionDiagnostics;
};
