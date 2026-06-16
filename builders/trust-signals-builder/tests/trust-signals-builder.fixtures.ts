import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type {
  AccountingStabilityArtifactContent,
  CapitalAllocationTrackingArtifactContent,
  CommitmentTrackingArtifactContent,
  NarrativeConsistencyArtifactContent,
  TrustSignalsArtifactContent,
  TrustSignalsBuilderInput,
} from "../types.js";
import { artifact, TestArtifactRepository } from "../../business-signals-builder/tests/artifact-fixtures.js";

export { artifact, TestArtifactRepository };

export function input(): TrustSignalsBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
  };
}

export function commitmentTrackingArtifact(): Artifact<CommitmentTrackingArtifactContent> {
  return artifact("commitment-tracking-1", "commitment_tracking", {
    commitments: [
      {
        commitment_id: "commitment-1",
        status: "fulfilled",
        statement: "Expand cloud capacity.",
        evidence: [
          {
            evidence_id: "commitment-evidence-1",
            confidence: 0.9,
          },
        ],
        confidence: 0.88,
      },
      {
        commitment_id: "commitment-2",
        status: "overdue",
        statement: "Complete integration.",
        evidence: [
          {
            evidence_id: "commitment-evidence-2",
            confidence: 0.8,
          },
        ],
        confidence: 0.82,
      },
    ],
    confidence: {
      overall: 0.85,
    },
  });
}

export function narrativeConsistencyArtifact(): Artifact<NarrativeConsistencyArtifactContent> {
  return artifact("narrative-consistency-1", "narrative_consistency", {
    strategic_priorities: [
      {
        priority_id: "priority-1",
        current_status: "new",
        description: "AI infrastructure.",
        confidence: 0.78,
      },
      {
        priority_id: "priority-2",
        current_status: "dropped",
        description: "Device expansion.",
        confidence: 0.74,
      },
    ],
    language_shifts: [
      {
        shift_id: "shift-1",
        shift_magnitude: "significant",
        supporting_evidence: ["language-evidence-1"],
        confidence: 0.8,
      },
    ],
    summary: {
      stable_priority_ratio: 0.35,
    },
    confidence: {
      overall: 0.8,
    },
  });
}

export function accountingStabilityArtifact(): Artifact<AccountingStabilityArtifactContent> {
  return artifact("accounting-stability-1", "accounting_stability", {
    policy_changes: [
      {
        policy_change_id: "policy-change-1",
        comparability_impact: "moderate",
        confidence: 0.77,
      },
    ],
    segment_changes: [
      {
        segment_change_id: "segment-change-1",
        change_type: "restructured",
        confidence: 0.76,
      },
    ],
    non_gaap_analysis: {
      trend_assessment: {
        direction: "widening",
        materiality: "medium",
      },
      confidence: 0.75,
    },
    restatements: [
      {
        restatement_id: "restatement-1",
        materiality: "high",
        confidence: 0.82,
      },
    ],
    summary: {
      reporting_stability_decreased: true,
    },
    confidence: {
      overall: 0.78,
    },
  });
}

export function capitalAllocationTrackingArtifact(): Artifact<CapitalAllocationTrackingArtifactContent> {
  return artifact("capital-allocation-tracking-1", "capital_allocation_tracking", {
    gaps: [
      {
        gap_id: "gap-1",
        gap_type: "aligned",
        priority_refs: ["priority-a"],
        deployment_refs: ["deployment-a"],
        evidence_refs: ["capital-evidence-1", "capital-evidence-2"],
      },
      {
        gap_id: "gap-2",
        gap_type: "under_supported",
        priority_refs: ["priority-b"],
        deployment_refs: [],
        evidence_refs: ["capital-evidence-3"],
      },
    ],
  });
}

export function validTrustSignalsContent(): TrustSignalsArtifactContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    trust_signals: [
      {
        signal_id: "signal-1",
        signal_type: "COMMITMENT_FULFILLED",
        company_id: "MSFT",
        period_id: "2026-Q2",
        dimension: "commitment_follow_through",
        severity: "medium",
        direction: "positive",
        observation: "Commitment status observed: fulfilled.",
        evidence_refs: ["commitment-evidence-1"],
        source_artifact_refs: [
          {
            artifact_id: "commitment-tracking-1",
            artifact_type: "commitment_tracking",
            artifact_version: 1,
          },
        ],
        source_record_refs: ["commitment-1"],
        source_artifact: "commitment_tracking",
        rule_ref: "trust_signals.commitment.fulfilled",
        confidence: 0.88,
        lifecycle: {
          status: "resolved",
          first_seen_period: "2026-Q2",
          last_seen_period: "2026-Q2",
        },
      },
    ],
    summary: {
      total_signals: 1,
      positive_signals: 1,
      negative_signals: 0,
      neutral_signals: 0,
      high_severity_signals: 0,
    },
    confidence: {
      overall: 0.9583,
      source_data_confidence: 0.25,
      rule_evaluation_confidence: 0.88,
      evidence_completeness_score: 1,
    },
    enrichment_status: {
      commitment_tracking: {
        available: true,
        artifact_path: "commitment-tracking-1",
        artifact_version: 1,
        absent_reason: null,
      },
      narrative_consistency: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Narrative Consistency pillar was not provided.",
      },
      accounting_stability: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Accounting Stability pillar was not provided.",
      },
      capital_allocation_tracking: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Capital Allocation Tracking pillar was not provided.",
      },
    },
    depth_indicator: {
      overall: "base",
      commitment_dimension: "present",
      narrative_dimension: "absent",
      explanation_dimension: "absent",
      accounting_dimension: "absent",
      capital_allocation_dimension: "absent",
    },
    missing_dimensions: [
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ],
    evaluation_hooks: {
      available_pillar_count: 1,
      emitted_signal_count: 1,
      missing_dimension_count: 4,
      rule_count: 26,
    },
  };
}
