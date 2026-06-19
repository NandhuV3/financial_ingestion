import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  Commitment,
  CommitmentTrackingArtifactContent,
} from "../commitment-tracking-builder/types.js";
import type {
  LanguageShift,
  NarrativeConsistencyArtifactContent,
  StrategicPriority,
} from "../narrative-consistency-builder/types.js";
import type {
  AccountingStabilityArtifactContent,
  PolicyChange,
  RestatementRecord,
  SegmentChange,
} from "../accounting-stability-builder/types.js";
import type {
  CapitalAllocationGap,
  CapitalAllocationTrackingArtifactContent,
} from "../capital-allocation-tracking-builder/types.js";
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
  generated_at: string;
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
  artifact_ref: string | null;
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

export type TrustSignalsReplayabilityMetadata = {
  schema_version: string;
  generated_at: string;
  source_artifact_references: string[];
  source_artifact_versions: number[];
  source_record_references: string[];
  evidence_references: string[];
  enrichment_status: EnrichmentStatus;
  depth_indicators: DepthIndicator;
  evaluation_hooks: TrustSignalsEvaluationHooks;
  calibration_version: string;
  rule_version: string;
};

export type TrustSignalsArtifactContent = {
  artifact_type: "trust_signals";
  company: string;
  period: string;
  trust_signals: TrustSignal[];
  summary: TrustSignalSummary;
  confidence: TrustSignalConfidence;
  enrichment_status: EnrichmentStatus;
  depth_indicator: DepthIndicator;
  missing_dimensions: TrustDimension[];
  evaluation_hooks: TrustSignalsEvaluationHooks;
  replayability_metadata: TrustSignalsReplayabilityMetadata;
};

export type CommitmentInput = Commitment;
export type StrategicPriorityInput = StrategicPriority;
export type LanguageShiftInput = LanguageShift;
export type PolicyChangeInput = PolicyChange;
export type SegmentChangeInput = SegmentChange;
export type RestatementInput = RestatementRecord;
export type CapitalAllocationGapInput = CapitalAllocationGap;

export type {
  AccountingStabilityArtifactContent,
  CapitalAllocationTrackingArtifactContent,
  CommitmentTrackingArtifactContent,
  NarrativeConsistencyArtifactContent,
};

export type TrustSignalBuildContext = {
  companyId: string;
  periodId: string;
  commitmentTrackingArtifact: Artifact<CommitmentTrackingArtifactContent> | null;
  narrativeConsistencyArtifact: Artifact<NarrativeConsistencyArtifactContent> | null;
  accountingStabilityArtifact: Artifact<AccountingStabilityArtifactContent> | null;
  capitalAllocationTrackingArtifact: Artifact<CapitalAllocationTrackingArtifactContent> | null;
};
