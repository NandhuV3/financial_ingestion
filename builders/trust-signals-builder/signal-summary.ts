import { availablePillarCount } from "./enrichment.js";
import type {
  EnrichmentStatus,
  TrustSignal,
  TrustSignalConfidence,
  TrustSignalSummary,
  TrustSignalsEvaluationHooks,
} from "./types.js";
import { TRUST_SIGNAL_RULES } from "./rules.js";

export function buildTrustSignalSummary(signals: TrustSignal[]): TrustSignalSummary {
  return {
    total_signals: signals.length,
    positive_signals: signals.filter((signal) => signal.direction === "positive").length,
    negative_signals: signals.filter((signal) => signal.direction === "negative").length,
    neutral_signals: signals.filter((signal) => signal.direction === "neutral").length,
    high_severity_signals: signals.filter((signal) => signal.severity === "high").length,
  };
}

export function buildTrustSignalConfidence(
  signals: TrustSignal[],
  enrichmentStatus: EnrichmentStatus,
): TrustSignalConfidence {
  const sourceDataConfidence = availablePillarCount(enrichmentStatus) / 4;
  const evidenceCompleteness = signals.length === 0
    ? sourceDataConfidence
    : signals.filter((signal) =>
      signal.evidence_refs.length > 0
      && signal.source_artifact_refs.length > 0
      && signal.source_record_refs.length > 0).length / signals.length;
  const ruleEvaluationConfidence = signals.length === 0
    ? sourceDataConfidence
    : signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;

  return {
    overall: round((sourceDataConfidence + evidenceCompleteness + ruleEvaluationConfidence) / 3),
    source_data_confidence: round(sourceDataConfidence),
    rule_evaluation_confidence: round(ruleEvaluationConfidence),
    evidence_completeness_score: round(evidenceCompleteness),
  };
}

export function buildTrustSignalsEvaluationHooks(input: {
  signals: TrustSignal[];
  enrichmentStatus: EnrichmentStatus;
  missingDimensionCount: number;
}): TrustSignalsEvaluationHooks {
  return {
    available_pillar_count: availablePillarCount(input.enrichmentStatus),
    emitted_signal_count: input.signals.length,
    missing_dimension_count: input.missingDimensionCount,
    rule_count: TRUST_SIGNAL_RULES.length,
  };
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
