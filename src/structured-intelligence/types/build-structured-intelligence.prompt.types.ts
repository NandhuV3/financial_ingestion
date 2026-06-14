export type StructuredThemeInput = {
  theme: string;
  category: string;
  importance: string;
  summary: string;
};

export type StructuredTopicInput = {
  topic_id: string | null;
  theme: string;
  category: string;
  summary: string;
  importance: string;
  assignment_status: string;
  confidence: number | null;
};

export type StructuredQuarterChangeDetailInput = {
  change_type: string;
  category: string;
  previous_importance: string | null;
  current_importance: string | null;
  previous_evidence_count: number;
  current_evidence_count: number;
  previous_theme_names: string[];
  current_theme_names: string[];
};

export type StructuredTopicChangeInput = {
  change_type: string;
  topic_id: string;
  previous_categories: string[];
  current_categories: string[];
  previous_theme_names: string[];
  current_theme_names: string[];
  previous_importance: string | null;
  current_importance: string | null;
  previous_evidence_count: number;
  current_evidence_count: number;
};

export type StructuredQuarterChangeInput = {
  new_categories: number;
  removed_categories: number;
  importance_increases: number;
  importance_decreases: number;
  evidence_increases: number;
  evidence_decreases: number;
  changes: StructuredQuarterChangeDetailInput[];
  topic_changes: StructuredTopicChangeInput[];
};

export type StructuredTopicEvolutionTopicInput = {
  topic_id: string;
  topic_name: string;
  trend_state: string;
  presence_state: string;
  quarters_present: number;
  presence_ratio: number;
};

export type StructuredTopicEvolutionInput = {
  strengthening_topics: string[];
  weakening_topics: string[];
  stable_topics: string[];
  mixed_topics: string[];
  topics: StructuredTopicEvolutionTopicInput[];
};

export type StructuredIntelligencePromptInput = {
  company: string;

  filing_date: string;

  themes: StructuredThemeInput[];

  topics: StructuredTopicInput[];

  quarter_changes: StructuredQuarterChangeInput;

  topic_evolution: StructuredTopicEvolutionInput;
};

export type StructuredIntelligenceLLMOutput = {
  business_description: string;

  products: string[];

  customers: string[];

  revenue_drivers: string[];

  competitive_positioning: string[];

  operating_model: string[];

  key_dependencies: string[];

  strategic_priorities: string[];

  risks: string[];

  opportunities: string[];
};
