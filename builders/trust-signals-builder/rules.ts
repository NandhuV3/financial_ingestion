import type {
  SignalDirection,
  SignalSeverity,
  TrustDimension,
  TrustPillarArtifactType,
  TrustSignalType,
} from "./contract.js";

export type TrustSignalRuleDefinition = {
  rule_ref: string;
  signal_type: TrustSignalType;
  dimension: TrustDimension;
  source_artifact: TrustPillarArtifactType;
  severity: SignalSeverity;
  direction: SignalDirection;
};

export const TRUST_SIGNAL_RULES: TrustSignalRuleDefinition[] = [
  rule("commitment.created", "COMMITMENT_CREATED", "commitment_follow_through", "commitment_tracking", "low", "neutral"),
  rule("commitment.fulfilled", "COMMITMENT_FULFILLED", "commitment_follow_through", "commitment_tracking", "medium", "positive"),
  rule("commitment.delayed", "COMMITMENT_DELAYED", "commitment_follow_through", "commitment_tracking", "medium", "negative"),
  rule("commitment.overdue", "COMMITMENT_OVERDUE", "commitment_follow_through", "commitment_tracking", "high", "negative"),
  rule("commitment.modified", "COMMITMENT_MODIFIED", "commitment_follow_through", "commitment_tracking", "medium", "neutral"),
  rule("commitment.abandoned", "COMMITMENT_ABANDONED", "commitment_follow_through", "commitment_tracking", "high", "negative"),
  rule("commitment.abandoned_multi_period", "COMMITMENT_ABANDONED_MULTI_PERIOD", "commitment_follow_through", "commitment_tracking", "high", "negative"),
  rule("narrative.priority_created", "STRATEGIC_PRIORITY_CREATED", "narrative_consistency", "narrative_consistency", "low", "neutral"),
  rule("narrative.priority_dropped", "STRATEGIC_PRIORITY_DROPPED", "narrative_consistency", "narrative_consistency", "medium", "negative"),
  rule("narrative.priority_reintroduced", "STRATEGIC_PRIORITY_REINTRODUCED", "narrative_consistency", "narrative_consistency", "medium", "neutral"),
  rule("narrative.language_shift_minor", "LANGUAGE_SHIFT_MINOR", "explanation_quality", "narrative_consistency", "low", "neutral"),
  rule("narrative.language_shift_moderate", "LANGUAGE_SHIFT_MODERATE", "explanation_quality", "narrative_consistency", "medium", "neutral"),
  rule("narrative.language_shift_significant", "LANGUAGE_SHIFT_SIGNIFICANT", "explanation_quality", "narrative_consistency", "high", "negative"),
  rule("narrative.stability_high", "NARRATIVE_STABILITY_HIGH", "narrative_consistency", "narrative_consistency", "low", "positive"),
  rule("narrative.stability_low", "NARRATIVE_STABILITY_LOW", "narrative_consistency", "narrative_consistency", "medium", "negative"),
  rule("accounting.policy_changed", "ACCOUNTING_POLICY_CHANGED", "accounting_stability", "accounting_stability", "medium", "negative"),
  rule("accounting.segment_redefined", "SEGMENT_REDEFINED", "accounting_stability", "accounting_stability", "medium", "neutral"),
  rule("accounting.segment_restructured", "SEGMENT_RESTRUCTURED", "accounting_stability", "accounting_stability", "medium", "neutral"),
  rule("accounting.restatement_issued", "RESTATEMENT_ISSUED", "accounting_stability", "accounting_stability", "high", "negative"),
  rule("accounting.non_gaap_widening", "NON_GAAP_GAP_WIDENING", "accounting_stability", "accounting_stability", "medium", "negative"),
  rule("accounting.non_gaap_narrowing", "NON_GAAP_GAP_NARROWING", "accounting_stability", "accounting_stability", "low", "positive"),
  rule("accounting.reporting_stability_decreased", "REPORTING_STABILITY_DECREASED", "accounting_stability", "accounting_stability", "high", "negative"),
  rule("capital_allocation.aligned", "CAPITAL_ALLOCATION_ALIGNED", "capital_allocation_consistency", "capital_allocation_tracking", "low", "positive"),
  rule("capital_allocation.under_supported", "CAPITAL_ALLOCATION_UNDER_SUPPORTED", "capital_allocation_consistency", "capital_allocation_tracking", "medium", "negative"),
  rule("capital_allocation.unsupported_deployment", "CAPITAL_ALLOCATION_UNSUPPORTED_DEPLOYMENT", "capital_allocation_consistency", "capital_allocation_tracking", "medium", "negative"),
  rule("capital_allocation.insufficient_evidence", "CAPITAL_ALLOCATION_EVIDENCE_INSUFFICIENT", "capital_allocation_consistency", "capital_allocation_tracking", "low", "neutral"),
];

export function ruleByRef(ruleRef: string): TrustSignalRuleDefinition | null {
  return TRUST_SIGNAL_RULES.find((definition) => definition.rule_ref === ruleRef) ?? null;
}

function rule(
  suffix: string,
  signalType: TrustSignalType,
  dimension: TrustDimension,
  sourceArtifact: TrustPillarArtifactType,
  severity: SignalSeverity,
  direction: SignalDirection,
): TrustSignalRuleDefinition {
  return {
    rule_ref: `trust_signals.${suffix}`,
    signal_type: signalType,
    dimension,
    source_artifact: sourceArtifact,
    severity,
    direction,
  };
}
