import type { QuestionConfidenceLevel } from "./contract.js";

// Name: INVESTOR_CONFIDENCE_LEVEL_SCORE_HIGH
// Purpose: Numeric artifact-confidence score for a high-confidence question.
// Ownership: Investor Intelligence Builder contract.
// Justification: Converts builder-owned question confidence labels into replayable artifact confidence.
// Allowed range: [0, 1].
export const INVESTOR_CONFIDENCE_LEVEL_SCORE_HIGH = 0.9;

// Name: INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM
// Purpose: Numeric artifact-confidence score for a medium-confidence question.
// Ownership: Investor Intelligence Builder contract.
// Justification: Provides a deterministic midpoint below high confidence while preserving confidence ordering.
// Allowed range: [0, 1].
export const INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM = 0.75;

// Name: INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW
// Purpose: Numeric artifact-confidence score for a low-confidence question.
// Ownership: Investor Intelligence Builder contract.
// Justification: Preserves low-confidence limitations without collapsing valid insufficient-data sections to zero.
// Allowed range: [0, 1].
export const INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW = 0.5;

// Name: INVESTOR_COMPANY_KNOWLEDGE_HIGH_CONFIDENCE_MIN
// Purpose: Minimum Company Knowledge confidence required for high Q1 confidence.
// Ownership: Investor Intelligence Builder contract.
// Justification: Q1 is grounded primarily in Company Knowledge, so its confidence inherits from that required input.
// Allowed range: [0, 1].
export const INVESTOR_COMPANY_KNOWLEDGE_HIGH_CONFIDENCE_MIN = 0.8;

// Name: INVESTOR_COMPANY_KNOWLEDGE_MEDIUM_CONFIDENCE_MIN
// Purpose: Minimum Company Knowledge confidence required for medium Q1 confidence.
// Ownership: Investor Intelligence Builder contract.
// Justification: Separates partial Company Knowledge grounding from low-confidence grounding deterministically.
// Allowed range: [0, 1].
export const INVESTOR_COMPANY_KNOWLEDGE_MEDIUM_CONFIDENCE_MIN = 0.6;

// Name: INVESTOR_Q2_CONFIDENCE_WITH_BUSINESS_SIGNALS
// Purpose: Q2 question confidence when Business Signals enrichment is available.
// Ownership: Investor Intelligence Builder contract.
// Justification: Business Signals is the locked Q2 enrichment source.
export const INVESTOR_Q2_CONFIDENCE_WITH_BUSINESS_SIGNALS: QuestionConfidenceLevel = "high";

// Name: INVESTOR_Q2_CONFIDENCE_WITHOUT_BUSINESS_SIGNALS
// Purpose: Q2 question confidence when Business Signals enrichment is absent.
// Ownership: Investor Intelligence Builder contract.
// Justification: Missing Q2 enrichment reduces depth but does not invalidate the artifact.
export const INVESTOR_Q2_CONFIDENCE_WITHOUT_BUSINESS_SIGNALS: QuestionConfidenceLevel = "medium";

// Name: INVESTOR_Q3_CONFIDENCE_TRUST_PRESENT
// Purpose: Q3 question confidence when Quarter Understanding trust depth is present.
// Ownership: Investor Intelligence Builder contract.
// Justification: Quarter Understanding remains the primary trust interpretation source.
export const INVESTOR_Q3_CONFIDENCE_TRUST_PRESENT: QuestionConfidenceLevel = "medium";

// Name: INVESTOR_Q3_CONFIDENCE_TRUST_ABSENT
// Purpose: Q3 question confidence when Quarter Understanding trust depth is absent.
// Ownership: Investor Intelligence Builder contract.
// Justification: Trust Signals are only a conditional fallback and cannot fully replace Quarter Understanding trust interpretation.
export const INVESTOR_Q3_CONFIDENCE_TRUST_ABSENT: QuestionConfidenceLevel = "low";

// Name: INVESTOR_Q4_DEFERRED_VALUATION_CONFIDENCE
// Purpose: Q4 question confidence while Market Data integration and valuation methodology are deferred.
// Ownership: Investor Intelligence Builder contract.
// Justification: Sprint 11 requires Q4 insufficient_data with market_data_unavailable.
export const INVESTOR_Q4_DEFERRED_VALUATION_CONFIDENCE: QuestionConfidenceLevel = "low";

// Name: INVESTOR_EVIDENCE_MIN_REFS_FOR_COVERAGE
// Purpose: Minimum evidence references required for a question to count as evidence-covered.
// Ownership: Investor Intelligence Builder contract.
// Justification: A question with at least one evidence reference has explicit grounding; insufficient_data sections are handled separately.
export const INVESTOR_EVIDENCE_MIN_REFS_FOR_COVERAGE = 1;

// Name: INVESTOR_CONFIDENCE_ROUNDING_SCALE
// Purpose: Decimal precision scale for replay-stable confidence scores.
// Ownership: Investor Intelligence Builder contract.
// Justification: Avoids nondeterministic floating precision in persisted confidence metadata.
export const INVESTOR_CONFIDENCE_ROUNDING_SCALE = 1000;

/**
 * Canonical confidence range.
 *
 * Owned by Investor Intelligence confidence contract.
 * All confidence values emitted by the builder must be
 * within this inclusive range.
 */
export const INVESTOR_CONFIDENCE_MIN = 0;
export const INVESTOR_CONFIDENCE_MAX = 1;

export type InvestorConfidenceCalibration = {
  level_scores: Record<QuestionConfidenceLevel, number>;
  company_knowledge_thresholds: {
    high_min: number;
    medium_min: number;
  };
  q2_confidence: {
    with_business_signals: QuestionConfidenceLevel;
    without_business_signals: QuestionConfidenceLevel;
  };
  q3_confidence: {
    trust_present: QuestionConfidenceLevel;
    trust_absent: QuestionConfidenceLevel;
  };
  q4_confidence: {
    deferred_valuation: QuestionConfidenceLevel;
  };
  evidence_min_refs_for_coverage: number;
  rounding_scale: number;
};

export const INVESTOR_CONFIDENCE_CALIBRATION: InvestorConfidenceCalibration = {
  level_scores: {
    high: INVESTOR_CONFIDENCE_LEVEL_SCORE_HIGH,
    medium: INVESTOR_CONFIDENCE_LEVEL_SCORE_MEDIUM,
    low: INVESTOR_CONFIDENCE_LEVEL_SCORE_LOW,
  },
  company_knowledge_thresholds: {
    high_min: INVESTOR_COMPANY_KNOWLEDGE_HIGH_CONFIDENCE_MIN,
    medium_min: INVESTOR_COMPANY_KNOWLEDGE_MEDIUM_CONFIDENCE_MIN,
  },
  q2_confidence: {
    with_business_signals: INVESTOR_Q2_CONFIDENCE_WITH_BUSINESS_SIGNALS,
    without_business_signals: INVESTOR_Q2_CONFIDENCE_WITHOUT_BUSINESS_SIGNALS,
  },
  q3_confidence: {
    trust_present: INVESTOR_Q3_CONFIDENCE_TRUST_PRESENT,
    trust_absent: INVESTOR_Q3_CONFIDENCE_TRUST_ABSENT,
  },
  q4_confidence: {
    deferred_valuation: INVESTOR_Q4_DEFERRED_VALUATION_CONFIDENCE,
  },
  evidence_min_refs_for_coverage: INVESTOR_EVIDENCE_MIN_REFS_FOR_COVERAGE,
  rounding_scale: INVESTOR_CONFIDENCE_ROUNDING_SCALE,
};
