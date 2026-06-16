import type {
  QuarterUnderstandingConfidence,
  QuarterUnderstandingEvaluationHooks,
  Understanding,
  EnrichmentStatus,
  DepthIndicator,
} from "./types.js";

export function buildQuarterUnderstandingConfidence(input: {
  understandings: Understanding[];
  availableSignalCount: number;
  enrichmentStatus: EnrichmentStatus;
}): QuarterUnderstandingConfidence {
  const evidenceCoverageScore = input.understandings.length === 0
    ? 0
    : input.understandings.filter((understanding) =>
      evidenceCount(understanding) > 0).length / input.understandings.length;
  const signalUtilizationScore = input.availableSignalCount === 0
    ? 0
    : usedSignalCount(input.understandings) / input.availableSignalCount;
  const enrichmentScore = [
    input.enrichmentStatus.trust_signals,
    input.enrichmentStatus.topic_evolution,
    input.enrichmentStatus.concept_registry,
  ].filter((status) => status.available).length / 3;
  const groundingScore = round((evidenceCoverageScore + Math.max(signalUtilizationScore, 0.25)) / 2);
  const interpretationQualityScore = round((groundingScore + enrichmentScore + 1) / 3);

  return {
    overall: round((groundingScore + signalUtilizationScore + evidenceCoverageScore + interpretationQualityScore) / 4),
    grounding_score: groundingScore,
    signal_utilization_score: round(signalUtilizationScore),
    evidence_coverage_score: round(evidenceCoverageScore),
    interpretation_quality_score: interpretationQualityScore,
  };
}

export function buildQuarterUnderstandingEvaluationHooks(input: {
  understandings: Understanding[];
  availableSignalCount: number;
  proposedConceptCount: number;
  depth: DepthIndicator;
  enrichmentStatus: EnrichmentStatus;
}): QuarterUnderstandingEvaluationHooks {
  const usedSignals = usedSignalCount(input.understandings);

  return {
    prompt_version: "deterministic-quarter-understanding-v1",
    model_version: "deterministic",
    understanding_count: input.understandings.length,
    signal_utilization: {
      available_signal_count: input.availableSignalCount,
      used_signal_count: usedSignals,
      ignored_signal_count: Math.max(0, input.availableSignalCount - usedSignals),
    },
    grounding: {
      evidence_package_count: input.understandings.filter((understanding) =>
        evidenceCount(understanding) > 0).length,
      missing_evidence_count: input.understandings.filter((understanding) =>
        evidenceCount(understanding) === 0).length,
    },
    concept_usage: {
      concept_registry_available: input.enrichmentStatus.concept_registry.available,
      emitted_concept_count: input.understandings.filter((understanding) => understanding.concept_id !== undefined).length,
      proposed_concept_count: input.proposedConceptCount,
    },
    depth: input.depth,
    enrichment_status: input.enrichmentStatus,
  };
}

function usedSignalCount(understandings: Understanding[]): number {
  return new Set(understandings.flatMap((understanding) => understanding.evidence_package.signal_refs)).size;
}

function evidenceCount(understanding: Understanding): number {
  return understanding.evidence_package.signal_refs.length
    + understanding.evidence_package.company_knowledge_refs.length
    + understanding.evidence_package.trust_signal_refs.length
    + understanding.evidence_package.topic_refs.length;
}

function round(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}
