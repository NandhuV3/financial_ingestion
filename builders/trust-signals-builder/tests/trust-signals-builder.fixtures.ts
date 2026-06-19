import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type {
  AccountingStabilityArtifactContent,
  CapitalAllocationTrackingArtifactContent,
  CommitmentTrackingArtifactContent,
  NarrativeConsistencyArtifactContent,
  TrustSignalsArtifactContent,
  TrustSignalsBuilderInput,
} from "../types.js";
import {
  artifact,
  TestArtifactRepository,
} from "../../business-signals-builder/tests/artifact-fixtures.js";
import { validFirstPopulationContent } from "../../commitment-tracking-builder/tests/commitment-tracking.fixtures.js";
import { validCapitalAllocationContent } from "../../capital-allocation-tracking-builder/tests/capital-allocation-tracking.fixtures.js";
import {
  TRUST_SIGNALS_CALIBRATION_VERSION,
} from "../calibration-contract.js";
import {
  TRUST_SIGNALS_RULE_VERSION,
  TRUST_SIGNALS_SCHEMA_VERSION,
} from "../contract.js";

export { artifact, TestArtifactRepository };

export function input(): TrustSignalsBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    generated_at: "2026-06-15T00:00:00.000Z",
  };
}

export function commitmentTrackingArtifact(): Artifact<CommitmentTrackingArtifactContent> {
  return artifact(
    "commitment-tracking-1",
    "commitment_tracking",
    validFirstPopulationContent(),
  );
}

export function narrativeConsistencyArtifact(): Artifact<NarrativeConsistencyArtifactContent> {
  return artifact("narrative-consistency-1", "narrative_consistency", {
    artifact_type: "narrative_consistency",
    company: "MSFT",
    period: "2026-Q2",
    strategic_priorities: [
      {
        priority_id: "priority-1",
        concept_ref: "ai_infrastructure",
        description: "AI infrastructure.",
        first_seen_period: "2026-Q2",
        last_seen_period: "2026-Q2",
        consecutive_periods: 1,
        current_status: "new",
        evidence_refs: ["narrative:priority:1"],
        confidence: 0.78,
      },
      {
        priority_id: "priority-2",
        concept_ref: "device_expansion",
        description: "Device expansion.",
        first_seen_period: "2026-Q1",
        last_seen_period: "2026-Q2",
        consecutive_periods: 0,
        current_status: "dropped",
        evidence_refs: ["narrative:priority:2"],
        confidence: 0.74,
      },
    ],
    narrative_themes: [],
    language_shifts: [
      {
        shift_id: "shift-1",
        concept_ref: "ai_infrastructure",
        prior_framing: "AI is exploratory.",
        current_framing: "AI is a primary priority.",
        shift_magnitude: "significant",
        shift_reason_detected: true,
        supporting_evidence: ["narrative:shift:1"],
        confidence: 0.8,
      },
    ],
    priority_timelines: [
      {
        priority_id: "priority-1",
        periods: [{
          period: "2026-Q2",
          status: "new",
          mention_count: 1,
          evidence_refs: ["narrative:priority:1"],
        }],
      },
      {
        priority_id: "priority-2",
        periods: [
          {
            period: "2026-Q1",
            status: "new",
            mention_count: 1,
            evidence_refs: ["narrative:priority:2:q1"],
          },
          {
            period: "2026-Q2",
            status: "dropped",
            mention_count: 0,
            evidence_refs: ["narrative:priority:2"],
          },
        ],
      },
    ],
    summary: {
      active_priorities: 0,
      new_priorities: 1,
      dropped_priorities: 1,
      significant_language_shifts: 1,
      stable_priority_ratio: 0.35,
    },
    coverage_status: {
      status: "complete",
      available_periods: 2,
      missing_periods: [],
    },
    depth_indicator: {
      historical_periods_available: 2,
      minimum_history_available: true,
      preferred_history_available: false,
    },
    confidence: {
      overall: 0.8,
      extraction_confidence: 0.8,
      linkage_confidence: 0.8,
      shift_detection_confidence: 0.8,
      history_depth_score: 0.5,
    },
    replayability_metadata: {
      schema_version: "narrative-consistency-v1",
      source_artifact_references: ["filing-q1", "filing-q2"],
      source_artifact_versions: [1, 1],
      evidence_references: [
        "narrative:priority:1",
        "narrative:priority:2",
        "narrative:priority:2:q1",
        "narrative:shift:1",
      ],
      priority_history_references: [
        "priority-1:2026-Q2:new",
        "priority-2:2026-Q1:new",
        "priority-2:2026-Q2:dropped",
      ],
      prior_narrative_consistency_ref: null,
      prior_narrative_consistency_version: null,
      rule_set_ref: "narrative-consistency-rules",
      rule_version: "narrative-consistency-rules-v1",
      calibration_ref: "narrative-consistency-calibration",
      calibration_version: "narrative-consistency-calibration-v1",
    },
  });
}

export function accountingStabilityArtifact(): Artifact<AccountingStabilityArtifactContent> {
  return artifact("accounting-stability-1", "accounting_stability", {
    artifact_type: "accounting_stability",
    company: "MSFT",
    period: "2026-Q2",
    policy_changes: [
      {
        policy_change_id: "policy-change-1",
        policy_type: "revenue_recognition",
        prior_policy: "Recognize ratably.",
        current_policy: "Recognize as consumed.",
        change_detected_period: "2026-Q2",
        proactively_disclosed: true,
        comparability_impact: "moderate",
        evidence_refs: ["accounting:policy:1"],
        source_artifact_refs: ["filing-q1", "filing-q2"],
        confidence: 0.77,
      },
    ],
    segment_changes: [
      {
        segment_change_id: "segment-change-1",
        change_detected_period: "2026-Q2",
        prior_segments: ["Cloud"],
        current_segments: ["Cloud and AI"],
        change_type: "restructured",
        disclosed_reason: "AI is managed with cloud.",
        comparability_impact: "moderate",
        evidence_refs: ["accounting:segment:1"],
        source_artifact_refs: ["filing-q1", "filing-q2"],
        confidence: 0.76,
      },
    ],
    non_gaap_analysis: {
      periods: [
        {
          period: "2026-Q1",
          gaap_value: 100,
          non_gaap_value: 105,
          gap_percentage: 5,
          exclusion_items: ["stock compensation"],
          evidence_refs: ["accounting:non-gaap:q1"],
          source_artifact_ref: "filing-q1",
        },
        {
          period: "2026-Q2",
          gaap_value: 100,
          non_gaap_value: 120,
          gap_percentage: 20,
          exclusion_items: ["stock compensation"],
          evidence_refs: ["accounting:non-gaap:q2"],
          source_artifact_ref: "filing-q2",
        },
      ],
      trend_assessment: {
        direction: "widening",
        consecutive_periods: 1,
        materiality: "medium",
      },
      confidence: 0.75,
    },
    restatements: [
      {
        restatement_id: "restatement-1",
        period_announced: "2026-Q2",
        periods_affected: ["2025-Q4"],
        scope: "revenue",
        description: "Prior revenue presentation corrected.",
        materiality: "high",
        evidence_refs: ["accounting:restatement:1"],
        source_artifact_refs: ["filing-q2"],
        confidence: 0.82,
      },
    ],
    accounting_timeline: [
      {
        period: "2026-Q1",
        policy_change_refs: [],
        segment_change_refs: [],
        restatement_refs: [],
      },
      {
        period: "2026-Q2",
        policy_change_refs: ["policy-change-1"],
        segment_change_refs: ["segment-change-1"],
        restatement_refs: ["restatement-1"],
      },
    ],
    summary: {
      policy_changes_detected: 1,
      segment_changes_detected: 1,
      restatements_detected: 1,
      non_gaap_gap_direction: "widening",
    },
    coverage_status: {
      accounting_policies: "complete",
      segments: "complete",
      non_gaap: "complete",
      restatements: "complete",
      overall: "complete",
    },
    depth_indicator: {
      overall: "base",
      period_count: 2,
    },
    confidence: {
      overall: 0.875,
      extraction_confidence: 1,
      policy_detection_confidence: 1,
      segment_detection_confidence: 1,
      historical_depth_score: 0.5,
    },
    replayability_metadata: {
      schema_version: "accounting-stability-v1",
      source_artifact_references: ["filing-q1", "filing-q2"],
      source_artifact_versions: [1, 1],
      evidence_references: [
        "accounting:non-gaap:q1",
        "accounting:non-gaap:q2",
        "accounting:policy:1",
        "accounting:restatement:1",
        "accounting:segment:1",
      ],
      accounting_change_references: [
        "non_gaap_analysis",
        "policy-change-1",
        "restatement-1",
        "segment-change-1",
      ],
      rule_set_ref: "accounting-stability-rules",
      rule_version: "accounting-stability-rules-v1",
      calibration_ref: "accounting-stability-calibration",
      calibration_version: "accounting-stability-calibration-v1",
    },
  });
}

export function capitalAllocationTrackingArtifact(): Artifact<CapitalAllocationTrackingArtifactContent> {
  return artifact(
    "capital-allocation-tracking-1",
    "capital_allocation_tracking",
    validCapitalAllocationContent(),
  );
}

export function validTrustSignalsContent(): TrustSignalsArtifactContent {
  const enrichmentStatus = {
    commitment_tracking: {
      available: true,
      artifact_ref: "commitment-tracking-1",
      artifact_version: 1,
      absent_reason: null,
    },
    narrative_consistency: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Narrative Consistency pillar was not provided.",
    },
    accounting_stability: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Accounting Stability pillar was not provided.",
    },
    capital_allocation_tracking: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Capital Allocation Tracking pillar was not provided.",
    },
  } as const;
  const depthIndicator = {
    overall: "base",
    commitment_dimension: "present",
    narrative_dimension: "absent",
    explanation_dimension: "absent",
    accounting_dimension: "absent",
    capital_allocation_dimension: "absent",
  } as const;
  const evaluationHooks = {
    available_pillar_count: 1,
    emitted_signal_count: 1,
    missing_dimension_count: 4,
    rule_count: 26,
  };

  return {
    artifact_type: "trust_signals",
    company: "MSFT",
    period: "2026-Q2",
    trust_signals: [
      {
        signal_id: "trust-signal-1",
        signal_type: "COMMITMENT_CREATED",
        company_id: "MSFT",
        period_id: "2026-Q2",
        dimension: "commitment_follow_through",
        severity: "low",
        direction: "neutral",
        observation: "Commitment status observed: new.",
        evidence_refs: ["evidence-ai-capacity-created"],
        source_artifact_refs: [
          {
            artifact_id: "commitment-tracking-1",
            artifact_type: "commitment_tracking",
            artifact_version: 1,
          },
        ],
        source_record_refs: [
          "commitment-ai-capacity",
          "filing-2026-q2:item2:commitment-1",
        ],
        source_artifact: "commitment_tracking",
        rule_ref: "trust_signals.commitment.created",
        confidence: 0.9,
        lifecycle: {
          status: "active",
          first_seen_period: "2026-Q2",
          last_seen_period: "2026-Q2",
        },
      },
    ],
    summary: {
      total_signals: 1,
      positive_signals: 0,
      negative_signals: 0,
      neutral_signals: 1,
      high_severity_signals: 0,
    },
    confidence: {
      overall: 0.7167,
      source_data_confidence: 0.25,
      rule_evaluation_confidence: 0.9,
      evidence_completeness_score: 1,
    },
    enrichment_status: structuredClone(enrichmentStatus),
    depth_indicator: structuredClone(depthIndicator),
    missing_dimensions: [
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ],
    evaluation_hooks: evaluationHooks,
    replayability_metadata: {
      schema_version: TRUST_SIGNALS_SCHEMA_VERSION,
      generated_at: "2026-06-15T00:00:00.000Z",
      source_artifact_references: ["commitment-tracking-1"],
      source_artifact_versions: [1],
      source_record_references: [
        "commitment-ai-capacity",
        "filing-2026-q2:item2:commitment-1",
      ],
      evidence_references: ["evidence-ai-capacity-created"],
      enrichment_status: structuredClone(enrichmentStatus),
      depth_indicators: structuredClone(depthIndicator),
      evaluation_hooks: structuredClone(evaluationHooks),
      calibration_version: TRUST_SIGNALS_CALIBRATION_VERSION,
      rule_version: TRUST_SIGNALS_RULE_VERSION,
    },
  };
}
