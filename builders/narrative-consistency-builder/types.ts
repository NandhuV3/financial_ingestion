import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  NarrativeCategory,
  NarrativeSourceArtifactType,
  NarrativeTrend,
  PriorityStatus,
  ShiftMagnitude,
} from "./contract.js";

export type NarrativeConsistencyBuilderInput = {
  company_id: string;
  period_id: string;
  source_dependencies: NarrativeSourceDependency[];
  rule_set: {
    rule_set_ref: string;
    rule_version: string;
  };
  calibration: {
    calibration_ref: string;
    calibration_version: string;
  };
};

export type NarrativeSourceDependency = {
  dependency_name: string;
  period_id: string;
  artifact_type: NarrativeSourceArtifactType;
  absent_reason: string | null;
};

export type NarrativeSourceArtifactContent = {
  priority_observations: PriorityObservation[];
  theme_observations: ThemeObservation[];
  language_shift_observations: LanguageShiftObservation[];
};

export type PriorityObservation = {
  priority_id: string;
  concept_ref: string;
  description: string;
  mention_count: number;
  evidence_refs: string[];
  confidence: number;
};

export type ThemeObservation = {
  theme_id: string;
  concept_ref: string;
  narrative_category: NarrativeCategory;
  mention_count: number;
  evidence_refs: string[];
  confidence: number;
};

export type LanguageShiftObservation = {
  shift_id: string;
  concept_ref: string;
  prior_framing: string;
  current_framing: string;
  shift_magnitude: ShiftMagnitude;
  shift_reason_detected: boolean;
  supporting_evidence: string[];
  confidence: number;
};

export type StrategicPriority = {
  priority_id: string;
  concept_ref: string;
  description: string;
  first_seen_period: string;
  last_seen_period: string;
  consecutive_periods: number;
  current_status: PriorityStatus;
  evidence_refs: string[];
  confidence: number;
};

export type NarrativeTheme = {
  theme_id: string;
  concept_ref: string;
  narrative_category: NarrativeCategory;
  first_seen_period: string;
  current_period_mentions: number;
  historical_average_mentions: number;
  trend: NarrativeTrend;
  evidence_refs: string[];
  confidence: number;
};

export type LanguageShift = LanguageShiftObservation;

export type PriorityTimeline = {
  priority_id: string;
  periods: Array<{
    period: string;
    status: PriorityStatus;
    mention_count: number;
    evidence_refs: string[];
  }>;
};

export type NarrativeSummary = {
  active_priorities: number;
  new_priorities: number;
  dropped_priorities: number;
  significant_language_shifts: number;
  stable_priority_ratio: number;
};

export type NarrativeConfidence = {
  overall: number;
  extraction_confidence: number;
  linkage_confidence: number;
  shift_detection_confidence: number;
  history_depth_score: number;
};

export type NarrativeCoverageStatus = {
  status: "complete" | "partial";
  available_periods: number;
  missing_periods: Array<{
    period_id: string;
    absent_reason: string;
  }>;
};

export type NarrativeDepthIndicator = {
  historical_periods_available: number;
  minimum_history_available: boolean;
  preferred_history_available: boolean;
};

export type NarrativeConsistencyReplayabilityMetadata = {
  schema_version: string;
  source_artifact_references: string[];
  source_artifact_versions: number[];
  evidence_references: string[];
  priority_history_references: string[];
  prior_narrative_consistency_ref: string | null;
  prior_narrative_consistency_version: number | null;
  rule_set_ref: string;
  rule_version: string;
  calibration_ref: string;
  calibration_version: string;
};

export type NarrativeConsistencyArtifactContent = {
  artifact_type: "narrative_consistency";
  company: string;
  period: string;
  strategic_priorities: StrategicPriority[];
  narrative_themes: NarrativeTheme[];
  language_shifts: LanguageShift[];
  priority_timelines: PriorityTimeline[];
  summary: NarrativeSummary;
  coverage_status: NarrativeCoverageStatus;
  depth_indicator: NarrativeDepthIndicator;
  confidence: NarrativeConfidence;
  replayability_metadata: NarrativeConsistencyReplayabilityMetadata;
};

export type ResolvedNarrativeSource = {
  declaration: NarrativeSourceDependency;
  artifact: Artifact<NarrativeSourceArtifactContent>;
};

export type NarrativeBuildDependencies = {
  sources: ResolvedNarrativeSource[];
  missing_periods: NarrativeCoverageStatus["missing_periods"];
  prior: Artifact<NarrativeConsistencyArtifactContent> | null;
};
