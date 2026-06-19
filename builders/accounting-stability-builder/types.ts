import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  AccountingDepthLevel,
  ComparabilityImpact,
  CoverageState,
  Materiality,
  PolicyType,
  RestatementScope,
  SegmentChangeType,
  TrendDirection,
} from "./contract.js";

export type AccountingStabilityBuilderInput = {
  company_id: string;
  period_id: string;
  source_dependencies: AccountingSourceDependency[];
  rule_set: {
    rule_set_ref: string;
    rule_version: string;
  };
  calibration: {
    calibration_ref: string;
    calibration_version: string;
  };
};

export type AccountingSourceDependency = {
  dependency_name: string;
  period_id: string;
  artifact_type: "filing" | "structured_intelligence";
};

export type AccountingPeriodCoverage = {
  accounting_policies_available: boolean;
  segments_available: boolean;
  non_gaap_available: boolean;
  restatements_available: boolean;
};

export type AccountingPolicyObservation = {
  policy_type: PolicyType;
  policy_text: string;
  proactively_disclosed: boolean;
  comparability_impact: ComparabilityImpact;
  evidence_refs: string[];
  confidence: number;
};

export type SegmentObservation = {
  segment_name: string;
  disclosed_reason: string | null;
  comparability_impact: ComparabilityImpact;
  evidence_refs: string[];
  confidence: number;
};

export type NonGAAPMeasureObservation = {
  gaap_value: number;
  non_gaap_value: number;
  exclusion_items: string[];
  evidence_refs: string[];
  confidence: number;
};

export type RestatementObservation = {
  period_announced: string;
  periods_affected: string[];
  scope: RestatementScope;
  description: string;
  materiality: Materiality;
  evidence_refs: string[];
  confidence: number;
};

export type AccountingSourceArtifactContent = {
  accounting_policies: AccountingPolicyObservation[];
  segments: SegmentObservation[];
  non_gaap_measure: NonGAAPMeasureObservation | null;
  restatements: RestatementObservation[];
  coverage: AccountingPeriodCoverage;
  evidence_refs: string[];
};

export type PolicyChange = {
  policy_change_id: string;
  policy_type: PolicyType;
  prior_policy: string;
  current_policy: string;
  change_detected_period: string;
  proactively_disclosed: boolean;
  comparability_impact: ComparabilityImpact;
  evidence_refs: string[];
  source_artifact_refs: string[];
  confidence: number;
};

export type SegmentChange = {
  segment_change_id: string;
  change_detected_period: string;
  prior_segments: string[];
  current_segments: string[];
  change_type: SegmentChangeType;
  disclosed_reason: string | null;
  comparability_impact: ComparabilityImpact;
  evidence_refs: string[];
  source_artifact_refs: string[];
  confidence: number;
};

export type NonGAAPPeriod = {
  period: string;
  gaap_value: number;
  non_gaap_value: number;
  gap_percentage: number;
  exclusion_items: string[];
  evidence_refs: string[];
  source_artifact_ref: string;
};

export type NonGAAPTrend = {
  direction: TrendDirection;
  consecutive_periods: number;
  materiality: Materiality;
};

export type NonGAAPAnalysis = {
  periods: NonGAAPPeriod[];
  trend_assessment: NonGAAPTrend;
  confidence: number;
};

export type RestatementRecord = {
  restatement_id: string;
  period_announced: string;
  periods_affected: string[];
  scope: RestatementScope;
  description: string;
  materiality: Materiality;
  evidence_refs: string[];
  source_artifact_refs: string[];
  confidence: number;
};

export type AccountingSummary = {
  policy_changes_detected: number;
  segment_changes_detected: number;
  restatements_detected: number;
  non_gaap_gap_direction: TrendDirection | null;
};

export type AccountingStabilityCoverage = {
  accounting_policies: CoverageState;
  segments: CoverageState;
  non_gaap: CoverageState;
  restatements: CoverageState;
  overall: CoverageState;
};

export type AccountingStabilityDepthIndicator = {
  overall: AccountingDepthLevel;
  period_count: number;
};

export type AccountingTimeline = {
  period: string;
  policy_change_refs: string[];
  segment_change_refs: string[];
  restatement_refs: string[];
};

export type AccountingStabilityConfidence = {
  overall: number;
  extraction_confidence: number;
  policy_detection_confidence: number;
  segment_detection_confidence: number;
  historical_depth_score: number;
};

export type AccountingStabilityReplayabilityMetadata = {
  schema_version: string;
  source_artifact_references: string[];
  source_artifact_versions: number[];
  evidence_references: string[];
  accounting_change_references: string[];
  rule_set_ref: string;
  rule_version: string;
  calibration_ref: string;
  calibration_version: string;
};

export type AccountingStabilityArtifactContent = {
  artifact_type: "accounting_stability";
  company: string;
  period: string;
  policy_changes: PolicyChange[];
  segment_changes: SegmentChange[];
  non_gaap_analysis: NonGAAPAnalysis | null;
  restatements: RestatementRecord[];
  accounting_timeline: AccountingTimeline[];
  summary: AccountingSummary;
  coverage_status: AccountingStabilityCoverage;
  depth_indicator: AccountingStabilityDepthIndicator;
  confidence: AccountingStabilityConfidence;
  replayability_metadata: AccountingStabilityReplayabilityMetadata;
};

export type ResolvedAccountingSource = {
  declaration: AccountingSourceDependency;
  artifact: Artifact<AccountingSourceArtifactContent>;
};

export type AccountingBuildDependencies = {
  sources: ResolvedAccountingSource[];
};
