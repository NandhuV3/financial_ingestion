import type { Theme } from "../types/theme.types.js";

export type TopicDefinition = {
  topic_id: string;
  topic_name: string;
  categories: string[];
  theme_variants: string[];
};

export type TopicRegistry = {
  topics: TopicDefinition[];
};

export type TopicCandidate = {
  candidate_id: string;
  suggested_topic_name: string;
  categories: string[];
  theme_variants: string[];
  filing_dates: string[];
  reason: string;
};

export type TopicCandidateReport = {
  company: string;
  ticker: string;
  candidates: TopicCandidate[];
};

export type TopicAssignment = {
  filing_date: string;
  theme: string;
  category: string;
  topic_id: string | null;
  assignment_status: "assigned" | "unknown";
};

export type TopicAssignedTheme = Theme & {
  topic_id: string | null;
};

export type TopicAssignmentOutput = {
  company: string;
  ticker: string;
  filing_date: string;
  themes: TopicAssignedTheme[];
};

export type TopicAssignmentReport = {
  company: string;
  ticker: string;
  total_themes: number;
  assigned_themes: number;
  unknown_themes: number;
  topic_coverage: number;
  unknown_topics: string[];
  unassigned_themes: TopicAssignment[];
  topic_frequency_by_quarter: Record<string, Record<string, number>>;
};
