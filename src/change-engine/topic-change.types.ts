import type { Theme, ThemeImportance, ThemeOutput } from "../types/theme.types.js";

export type TopicChangeType =
  | "TOPIC_NEW"
  | "TOPIC_DISAPPEARED"
  | "TOPIC_PERSISTED"
  | "TOPIC_EVOLVED"
  | "TOPIC_INTENSIFIED"
  | "TOPIC_WEAKENED";

export type TopicAwareTheme = Theme & {
  topic_id?: string | null;
};

export type TopicAwareThemeOutput = Omit<ThemeOutput, "themes"> & {
  themes: TopicAwareTheme[];
};

export type TopicSnapshot = {
  topic_id: string;
  categories: string[];
  theme_names: string[];
  importance: ThemeImportance;
  evidence_count: number;
};

export type TopicChange = {
  change_type: TopicChangeType;
  topic_id: string;
  previous_categories: string[];
  current_categories: string[];
  previous_theme_names: string[];
  current_theme_names: string[];
  previous_importance: ThemeImportance | null;
  current_importance: ThemeImportance | null;
  previous_evidence_count: number;
  current_evidence_count: number;
};

export type TopicChangeSummary = {
  persisted_topics: number;
  evolved_topics: number;
  intensified_topics: number;
  weakened_topics: number;
};

export type TopicComparisonResult = {
  topic_changes: TopicChange[];
  topic_summary: TopicChangeSummary;
};
