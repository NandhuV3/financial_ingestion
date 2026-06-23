import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

export type PartnerCompanyKnowledgeSource = {
  business_description: string;
  products: string[];
  customers: string[];
  revenue_drivers: string[];
  competitive_positioning: Array<{
    signal: string;
    source_type: "claimed" | "observed";
  }>;
  strategic_priorities: string[];
  risks: string[];
};

export type PartnerQuarterChange = {
  summary: {
    new_categories: number;
    removed_categories: number;
    importance_increases: number;
    importance_decreases: number;
    evidence_increases: number;
    evidence_decreases: number;
  };
  changes: Array<{
    change_type:
      | "NEW_CATEGORY"
      | "REMOVED_CATEGORY"
      | "IMPORTANCE_INCREASED"
      | "IMPORTANCE_DECREASED"
      | "EVIDENCE_INCREASED"
      | "EVIDENCE_DECREASED";
    category: string;
    current_theme_names: string[];
    previous_theme_names: string[];
  }>;
  topic_changes: Array<{
    change_type:
      | "TOPIC_NEW"
      | "TOPIC_DISAPPEARED"
      | "TOPIC_PERSISTED"
      | "TOPIC_EVOLVED"
      | "TOPIC_INTENSIFIED"
      | "TOPIC_WEAKENED";
    topic_id: string;
  }>;
};

export type PartnerTopicEvolutionSource = {
  generated_at: string;
  filing_dates: string[];
  summary: {
    new_topics: number;
    disappeared_topics: number;
    strengthening_topics: number;
    weakening_topics: number;
  };
  topics: Array<{
    topic_id: string;
    topic_name: string;
    presence_state:
      | "new"
      | "recurring"
      | "persistent"
      | "dormant"
      | "disappeared"
      | "insufficient_history";
    trend_state:
      | "strengthening"
      | "weakening"
      | "stable"
      | "mixed"
      | "insufficient_history"
      | "unknown";
    current_status: "present" | "absent";
    history: Array<{
      filing_date: string;
      present: boolean;
      importance: "high" | "medium" | "low" | null;
    }>;
  }>;
};

export type PartnerSourceArtifacts = {
  filing: FilingMetadata;
  companyKnowledge: PartnerCompanyKnowledgeSource;
  themes: ThemeOutput | null;
  quarterChange: PartnerQuarterChange | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};
