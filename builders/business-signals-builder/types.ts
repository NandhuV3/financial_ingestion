import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { SignalCategory, SignalDirection, SignalMagnitude, DepthLevel } from "./contract.js";

export type BusinessSignalsBuilderInput = {
  company_id: string;
  period_id: string;
};

export type BusinessSignalsBuilderDependencies = {
  company_knowledge: Artifact<CompanyKnowledgeArtifactContent>;
  quarter_change?: Artifact<QuarterChangeArtifactContent>;
  topic_evolution?: Artifact<TopicEvolutionArtifactContent>;
  transcript_signals?: Artifact<unknown>;
  market_context?: Artifact<unknown>;
  industry_context?: Artifact<unknown>;
};

export type SourceArtifactReference = {
  artifact_id: string;
  artifact_type: "company_knowledge" | "topic_evolution" | "quarter_change";
  artifact_version: number;
};

export type BusinessSignal = {
  signal_id: string;
  signal_type: string;
  company_id: string;
  period_id: string;
  category: SignalCategory;
  direction: SignalDirection;
  magnitude: SignalMagnitude;
  observation: string;
  evidence_refs: string[];
  source_artifact_refs: SourceArtifactReference[];
  rule_ref: string;
  company_knowledge_refs: string[];
  topic_refs: string[];
  evidence_confidence: number;
};

export type EnrichmentInputStatus = {
  available: boolean;
  artifact_ref: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

export type EnrichmentStatus = {
  quarter_change: EnrichmentInputStatus;
  topic_evolution: EnrichmentInputStatus;
  transcript_signals?: EnrichmentInputStatus;
  market_context?: EnrichmentInputStatus;
  industry_context?: EnrichmentInputStatus;
};

export type DepthIndicator = {
  overall: DepthLevel;
};

export type BusinessSignalSummary = {
  total_signals: number;
  by_category: Record<string, number>;
  by_magnitude: Record<string, number>;
};

export type BusinessSignalsArtifactContent = {
  company_id: string;
  period_id: string;
  signals: BusinessSignal[];
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
  signal_summary: BusinessSignalSummary;
};

export type QuarterChangeArtifactContent = {
  changes?: QuarterChangeInput[];
  topic_changes?: TopicChangeInput[];
};

export type QuarterChangeInput = {
  change_type:
    | "NEW_CATEGORY"
    | "REMOVED_CATEGORY"
    | "IMPORTANCE_INCREASED"
    | "IMPORTANCE_DECREASED"
    | "EVIDENCE_INCREASED"
    | "EVIDENCE_DECREASED";
  category: string;
  previous_importance: "low" | "medium" | "high" | null;
  current_importance: "low" | "medium" | "high" | null;
  previous_evidence_count: number;
  current_evidence_count: number;
  previous_theme_names: string[];
  current_theme_names: string[];
};

export type TopicChangeInput = {
  change_type:
    | "TOPIC_NEW"
    | "TOPIC_DISAPPEARED"
    | "TOPIC_PERSISTED"
    | "TOPIC_EVOLVED"
    | "TOPIC_INTENSIFIED"
    | "TOPIC_WEAKENED";
  topic_id: string;
  previous_categories: string[];
  current_categories: string[];
  previous_theme_names: string[];
  current_theme_names: string[];
  previous_importance: "low" | "medium" | "high" | null;
  current_importance: "low" | "medium" | "high" | null;
  previous_evidence_count: number;
  current_evidence_count: number;
};

export type TopicEvolutionArtifactContent = {
  topics: TopicEvolutionInput[];
};

export type TopicEvolutionInput = {
  topic_id: string;
  topic_name: string;
  presence_state: "new" | "recurring" | "persistent" | "dormant" | "disappeared" | "insufficient_history";
  trend_state: "strengthening" | "weakening" | "stable" | "mixed" | "insufficient_history" | "unknown";
  current_status: "present" | "absent";
  quarters_present: number;
  presence_ratio: number;
};

export type SignalBuildContext = {
  companyId: string;
  periodId: string;
  companyKnowledgeArtifact: Artifact<CompanyKnowledgeArtifactContent>;
  quarterChangeArtifact: Artifact<QuarterChangeArtifactContent> | null;
  topicEvolutionArtifact: Artifact<TopicEvolutionArtifactContent> | null;
};
