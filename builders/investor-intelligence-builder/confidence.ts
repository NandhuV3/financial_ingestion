import type {
  InvestorIntelligenceConfidence,
  InvestorIntelligenceEvaluationHooks,
  Q1Business,
  Q2Money,
  Q3Trust,
  Q4Price,
  Q5Reason,
  DepthIndicator,
  EnrichmentStatus,
  InvestorPromptLineage,
} from "./types.js";
import {
  INVESTOR_CONFIDENCE_CALIBRATION,
  type InvestorConfidenceCalibration,
} from "./confidence-contract.js";

export function buildInvestorConfidence(sections: {
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  q4: Q4Price;
  q5: Q5Reason;
}, calibration: InvestorConfidenceCalibration = INVESTOR_CONFIDENCE_CALIBRATION): InvestorIntelligenceConfidence {
  const q1 = score(sections.q1.confidence, calibration);
  const q2 = score(sections.q2.confidence, calibration);
  const q3 = score(sections.q3.confidence, calibration);
  const q4 = score(sections.q4.confidence, calibration);
  const q5 = score(sections.q5.confidence, calibration);
  const grounding = evidenceCoverage(sections, calibration);
  const evidence = grounding;

  return {
    overall: round(Math.min(q1, q2, q3, q5, grounding), calibration),
    q1_score: q1,
    q2_score: q2,
    q3_score: q3,
    q4_score: q4,
    q5_score: q5,
    grounding_score: grounding,
    evidence_coverage_score: evidence,
  };
}

export function confidenceLevelFromCompanyKnowledgeScore(
  score: number,
  calibration: InvestorConfidenceCalibration = INVESTOR_CONFIDENCE_CALIBRATION,
): Q1Business["confidence"] {
  if (score >= calibration.company_knowledge_thresholds.high_min) {
    return "high";
  }

  if (score >= calibration.company_knowledge_thresholds.medium_min) {
    return "medium";
  }

  return "low";
}

export function confidenceForQ2BusinessSignalsAvailability(
  businessSignalsAvailable: boolean,
  calibration: InvestorConfidenceCalibration = INVESTOR_CONFIDENCE_CALIBRATION,
): Q2Money["confidence"] {
  return businessSignalsAvailable
    ? calibration.q2_confidence.with_business_signals
    : calibration.q2_confidence.without_business_signals;
}

export function confidenceForQ3TrustDepth(
  trustDimension: DepthIndicator["trust_dimension"],
  calibration: InvestorConfidenceCalibration = INVESTOR_CONFIDENCE_CALIBRATION,
): Q3Trust["confidence"] {
  return trustDimension === "absent"
    ? calibration.q3_confidence.trust_absent
    : calibration.q3_confidence.trust_present;
}

export function confidenceForQ4DeferredValuation(
  calibration: InvestorConfidenceCalibration = INVESTOR_CONFIDENCE_CALIBRATION,
): Q4Price["confidence"] {
  return calibration.q4_confidence.deferred_valuation;
}

export function confidenceFromQuestionInputs(
  q1: Q1Business,
  q2: Q2Money,
  q3: Q3Trust,
  q4: Q4Price,
): Q5Reason["confidence"] {
  const levels = [q1.confidence, q2.confidence, q3.confidence, q4.confidence];

  if (levels.includes("low")) {
    return "low";
  }

  if (levels.includes("medium")) {
    return "medium";
  }

  return "high";
}

export function buildInvestorEvaluationHooks(params: {
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  q4: Q4Price;
  q5: Q5Reason;
  depth: DepthIndicator;
  enrichmentStatus: EnrichmentStatus;
  promptLineage: InvestorPromptLineage;
}): InvestorIntelligenceEvaluationHooks {
  return {
    prompt_version: [
      params.promptLineage.q1.prompt_version,
      params.promptLineage.q2.prompt_version,
      params.promptLineage.q3.prompt_version,
      params.promptLineage.q4.prompt_version,
      params.promptLineage.q5.prompt_version,
    ].join("|"),
    model_version: [
      params.promptLineage.q1.model_version,
      params.promptLineage.q2.model_version,
      params.promptLineage.q3.model_version,
      params.promptLineage.q4.model_version,
      params.promptLineage.q5.model_version,
    ].join("|"),
    prompt_versions: {
      q1: params.promptLineage.q1.prompt_version,
      q2: params.promptLineage.q2.prompt_version,
      q3: params.promptLineage.q3.prompt_version,
      q4: params.promptLineage.q4.prompt_version,
      q5: params.promptLineage.q5.prompt_version,
    },
    model_versions: {
      q1: params.promptLineage.q1.model_version,
      q2: params.promptLineage.q2.model_version,
      q3: params.promptLineage.q3.model_version,
      q4: params.promptLineage.q4.model_version,
      q5: params.promptLineage.q5.model_version,
    },
    q1_present: params.q1.status !== "insufficient_data",
    q2_present: params.q2.status !== "insufficient_data",
    q3_present: params.q3.status !== "insufficient_data",
    q4_present: params.q4.status !== "insufficient_data",
    q5_present: params.q5.status !== "insufficient_data",
    depth: params.depth,
    enrichment_status: params.enrichmentStatus,
  };
}

function score(level: Q1Business["confidence"], calibration: InvestorConfidenceCalibration): number {
  return calibration.level_scores[level];
}

function evidenceCoverage(sections: {
  q1: Q1Business;
  q2: Q2Money;
  q3: Q3Trust;
  q4: Q4Price;
  q5: Q5Reason;
}, calibration: InvestorConfidenceCalibration): number {
  const sectionValues = Object.values(sections);
  const covered = sectionValues.filter((section) =>
    evidenceCount(section.evidence_package) >= calibration.evidence_min_refs_for_coverage
    || section.status === "insufficient_data"
  ).length;

  return round(covered / sectionValues.length, calibration);
}

function evidenceCount(evidence: Q1Business["evidence_package"]): number {
  return Object.values(evidence).reduce((total, values) => total + values.length, 0);
}

function round(value: number, calibration: InvestorConfidenceCalibration): number {
  return Math.round(value * calibration.rounding_scale) / calibration.rounding_scale;
}
