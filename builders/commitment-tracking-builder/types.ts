import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  CommitmentSourceArtifactType,
  CommitmentSourceType,
  CommitmentStatus,
  CommitmentType,
  EvidenceRole,
  ResolutionResult,
} from "./contract.js";

export type CommitmentTrackingBuilderInput = {
  company_id: string;
  period_id: string;
  source_dependencies: CommitmentSourceDependency[];
  rule_set: GovernedRuleSetReference;
  calibration: GovernedCalibrationReference;
};

export type CommitmentSourceDependency = {
  dependency_name: string;
  period_id: string;
  source_type: CommitmentSourceType;
  artifact_type: CommitmentSourceArtifactType;
  absent_reason: string | null;
};

export type GovernedRuleSetReference = {
  rule_set_ref: string;
  rule_version: string;
};

export type GovernedCalibrationReference = {
  calibration_ref: string;
  calibration_version: string;
};

export type CommitmentSourceArtifactContent = {
  commitment_records: CommitmentSourceRecord[];
};

export type CommitmentSourceRecord = {
  commitment_id: string;
  commitment_type: CommitmentType;
  statement: string;
  commitment_period: string;
  expected_resolution_period: string | null;
  actual_resolution_period: string | null;
  status: CommitmentStatus;
  expected_resolution_passed: boolean;
  identity_basis: CommitmentIdentityBasis;
  resolution: CommitmentResolutionInput | null;
  evidence: CommitmentSourceEvidence[];
  confidence: CommitmentSourceConfidence;
};

export type CommitmentIdentityBasis = {
  company_id: string;
  commitment_type: CommitmentType;
  canonical_statement: string;
  initial_commitment_period: string;
  expected_resolution_period: string | null;
  creation_evidence_ref: string;
  identity_rule_version: string;
};

export type CommitmentResolutionInput = {
  result: ResolutionResult;
  assessed_period: string;
  evidence_refs: string[];
  rule_version: string;
};

export type CommitmentSourceEvidence = {
  evidence_id: string;
  source_record_ref: string;
  evidence_text: string;
  evidence_role: EvidenceRole;
  confidence: number;
};

export type CommitmentSourceConfidence = {
  extraction_confidence: number;
  linkage_confidence: number;
  resolution_confidence: number;
};

export type CommitmentEvidence = CommitmentSourceEvidence & {
  source_artifact_ref: string;
  source_artifact_version: number;
  filing_period: string;
  source_type: CommitmentSourceType;
};

export type CommitmentResolution = {
  result: ResolutionResult;
  assessed_period: string;
  evidence_refs: string[];
  rule_version: string;
};

export type CommitmentTimelineEvent = {
  period: string;
  status: CommitmentStatus;
  evidence_ref: string;
  confidence: number;
};

export type Commitment = {
  commitment_id: string;
  commitment_type: CommitmentType;
  statement: string;
  commitment_period: string;
  expected_resolution_period: string | null;
  actual_resolution_period: string | null;
  status: CommitmentStatus;
  timing: {
    overdue: boolean;
  };
  identity_basis: CommitmentIdentityBasis;
  resolution: CommitmentResolution | null;
  evidence: CommitmentEvidence[];
  timeline: CommitmentTimelineEvent[];
  confidence: number;
};

export type CommitmentSummary = {
  total_commitments: number;
  active_commitments: number;
  achieved_commitments: number;
  delayed_commitments: number;
  modified_commitments: number;
  abandoned_commitments: number;
  fulfillment_rate: number;
};

export type MissingCommitmentSource = {
  period_id: string;
  source_type: CommitmentSourceType;
  absent_reason: string;
};

export type CommitmentTrackingCoverage = {
  status: "complete" | "partial";
  current_period_source_count: number;
  historical_period_count: number;
  missing_sources: MissingCommitmentSource[];
};

export type CommitmentTrackingDepthIndicator = {
  historical_periods_available: number;
  first_population: boolean;
  longitudinal_tracking_available: boolean;
  preferred_history_available: boolean;
};

export type CommitmentTrackingConfidence = {
  overall: number;
  extraction_confidence: number;
  linkage_confidence: number;
  resolution_confidence: number;
  history_depth_score: number;
};

export type CommitmentTrackingReplayabilityMetadata = {
  schema_version: string;
  source_artifact_references: string[];
  source_artifact_versions: number[];
  source_record_references: string[];
  prior_commitment_tracking_ref: string | null;
  prior_commitment_tracking_version: number | null;
  rule_set_ref: string;
  rule_version: string;
  calibration_ref: string;
  calibration_version: string;
  evidence_references: string[];
  lifecycle_references: string[];
};

export type CommitmentTrackingArtifactContent = {
  artifact_type: "commitment_tracking";
  company: string;
  period: string;
  commitments: Commitment[];
  summary: CommitmentSummary;
  coverage: CommitmentTrackingCoverage;
  depth_indicator: CommitmentTrackingDepthIndicator;
  confidence: CommitmentTrackingConfidence;
  replayability_metadata: CommitmentTrackingReplayabilityMetadata;
};

export type ResolvedCommitmentSource = {
  declaration: CommitmentSourceDependency;
  artifact: Artifact<CommitmentSourceArtifactContent>;
};

export type CommitmentTrackingBuildDependencies = {
  sources: ResolvedCommitmentSource[];
  missing_sources: MissingCommitmentSource[];
  prior: Artifact<CommitmentTrackingArtifactContent> | null;
};
