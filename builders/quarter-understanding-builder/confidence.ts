import type {
  QuarterUnderstandingConfidence,
  QuarterUnderstandingEvaluationHooks,
  Understanding,
  EnrichmentStatus,
  DepthIndicator,
} from "./types.js";
import { QUARTER_UNDERSTANDING_CALIBRATION } from "./calibration-contract.js";

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
  ].filter((status) => status.available).length
    / QUARTER_UNDERSTANDING_CALIBRATION.SUPPORTED_ENRICHMENT_DIMENSION_COUNT;
  const groundingScore = round(
    (evidenceCoverageScore + Math.max(
      signalUtilizationScore,
      QUARTER_UNDERSTANDING_CALIBRATION.SIGNAL_UTILIZATION_GROUNDING_FLOOR,
    )) / QUARTER_UNDERSTANDING_CALIBRATION.GROUNDING_COMPONENT_COUNT,
  );
  const interpretationQualityScore = round(
    (
      groundingScore
      + enrichmentScore
      + QUARTER_UNDERSTANDING_CALIBRATION.INTERPRETATION_QUALITY_BASELINE
    ) / QUARTER_UNDERSTANDING_CALIBRATION.INTERPRETATION_QUALITY_COMPONENT_COUNT,
  );

  return {
    overall: round(
      (
        groundingScore
        + signalUtilizationScore
        + evidenceCoverageScore
        + interpretationQualityScore
      ) / QUARTER_UNDERSTANDING_CALIBRATION.OVERALL_CONFIDENCE_COMPONENT_COUNT,
    ),
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
  return Number(Math.max(0, Math.min(1, value)).toFixed(
    QUARTER_UNDERSTANDING_CALIBRATION.CONFIDENCE_ROUNDING_DECIMAL_PLACES,
  ));
}
