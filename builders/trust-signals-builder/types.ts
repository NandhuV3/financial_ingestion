import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  DepthLevel,
  SignalDirection,
  SignalLifecycleStatus,
  SignalSeverity,
  TrustDimension,
  TrustPillarArtifactType,
  TrustSignalType,
} from "./contract.js";

export type TrustSignalsBuilderInput = {
  company_id: string;
  period_id: string;
};

export type TrustSignalsBuilderDependencies = {
  commitment_tracking?: Artifact<CommitmentTrackingArtifactContent>;
  narrative_consistency?: Artifact<NarrativeConsistencyArtifactContent>;
  accounting_stability?: Artifact<AccountingStabilityArtifactContent>;
  capital_allocation_tracking?: Artifact<CapitalAllocationTrackingArtifactContent>;
};

export type SourceArtifactReference = {
  artifact_id: string;
  artifact_type: TrustPillarArtifactType;
  artifact_version: number;
};

export type TrustSignalLifecycle = {
  status: SignalLifecycleStatus;
  first_seen_period: string;
  last_seen_period: string;
};

export type TrustSignal = {
  signal_id: string;
  signal_type: TrustSignalType;
  company_id: string;
  period_id: string;
  dimension: TrustDimension;
  severity: SignalSeverity;
  direction: SignalDirection;
  observation: string;
  evidence_refs: string[];
  source_artifact_refs: SourceArtifactReference[];
  source_record_refs: string[];
  source_artifact: TrustPillarArtifactType;
  rule_ref: string;
  confidence: number;
  lifecycle: TrustSignalLifecycle;
};

export type TrustSignalSummary = {
  total_signals: number;
  positive_signals: number;
  negative_signals: number;
  neutral_signals: number;
  high_severity_signals: number;
};

export type TrustSignalConfidence = {
  overall: number;
  source_data_confidence: number;
  rule_evaluation_confidence: number;
  evidence_completeness_score: number;
};

export type EnrichmentInputStatus = {
  available: boolean;
  artifact_path: string | null;
  artifact_version: number | null;
  absent_reason: string | null;
};

export type EnrichmentStatus = {
  commitment_tracking: EnrichmentInputStatus;
  narrative_consistency: EnrichmentInputStatus;
  accounting_stability: EnrichmentInputStatus;
  capital_allocation_tracking: EnrichmentInputStatus;
};

export type DepthIndicator = {
  overall: DepthLevel;
  commitment_dimension: "present" | "absent";
  narrative_dimension: "present" | "absent";
  explanation_dimension: "present" | "absent";
  accounting_dimension: "present" | "absent";
  capital_allocation_dimension: "present" | "absent";
};

export type TrustSignalsEvaluationHooks = {
  available_pillar_count: number;
  emitted_signal_count: number;
  missing_dimension_count: number;
  rule_count: number;
};

export type TrustSignalsArtifactContent = {
  company_id: string;
  period_id: string;
  trust_signals: TrustSignal[];
  summary: TrustSignalSummary;
  confidence: TrustSignalConfidence;
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
  missing_dimensions: TrustDimension[];
  evaluation_hooks: TrustSignalsEvaluationHooks;
};

export type CommitmentTrackingArtifactContent = {
  commitments?: CommitmentInput[];
  confidence?: PillarConfidence;
};

export type CommitmentInput = {
  commitment_id: string;
  status: "new" | "active" | "achieved" | "fulfilled" | "delayed" | "overdue" | "modified" | "abandoned" | "expired";
  statement?: string;
  evidence?: EvidenceInput[];
  confidence?: number;
};

export type NarrativeConsistencyArtifactContent = {
  strategic_priorities?: StrategicPriorityInput[];
  language_shifts?: LanguageShiftInput[];
  summary?: {
    stable_priority_ratio?: number;
  };
  confidence?: PillarConfidence;
};

export type StrategicPriorityInput = {
  priority_id: string;
  current_status: "new" | "active" | "persistent" | "declining" | "dropped" | "reintroduced";
  description?: string;
  confidence?: number;
};

export type LanguageShiftInput = {
  shift_id: string;
  shift_magnitude: "minor" | "moderate" | "significant";
  supporting_evidence?: string[];
  confidence?: number;
};

export type AccountingStabilityArtifactContent = {
  policy_changes?: PolicyChangeInput[];
  segment_changes?: SegmentChangeInput[];
  non_gaap_analysis?: {
    trend_assessment?: {
      direction?: "widening" | "stable" | "narrowing";
      materiality?: "low" | "medium" | "high";
    };
    confidence?: number;
  };
  restatements?: RestatementInput[];
  summary?: {
    reporting_stability_decreased?: boolean;
  };
  confidence?: PillarConfidence;
};

export type PolicyChangeInput = {
  policy_change_id: string;
  comparability_impact: "none" | "minor" | "moderate" | "material";
  confidence?: number;
};

export type SegmentChangeInput = {
  segment_change_id: string;
  change_type: "renamed" | "combined" | "split" | "added" | "removed" | "restructured";
  confidence?: number;
};

export type RestatementInput = {
  restatement_id: string;
  materiality: "low" | "medium" | "high";
  confidence?: number;
};

export type CapitalAllocationTrackingArtifactContent = {
  gaps?: CapitalAllocationGapInput[];
};

export type CapitalAllocationGapInput = {
  gap_id: string;
  gap_type: "aligned" | "under_supported" | "unsupported_deployment" | "insufficient_evidence";
  priority_refs: string[];
  deployment_refs: string[];
  evidence_refs: string[];
};

export type EvidenceInput = {
  evidence_id: string;
  confidence?: number;
};

export type PillarConfidence = {
  overall?: number;
};

export type TrustSignalBuildContext = {
  companyId: string;
  periodId: string;
  commitmentTrackingArtifact: Artifact<CommitmentTrackingArtifactContent> | null;
  narrativeConsistencyArtifact: Artifact<NarrativeConsistencyArtifactContent> | null;
  accountingStabilityArtifact: Artifact<AccountingStabilityArtifactContent> | null;
  capitalAllocationTrackingArtifact: Artifact<CapitalAllocationTrackingArtifactContent> | null;
};
