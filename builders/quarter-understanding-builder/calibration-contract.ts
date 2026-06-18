/*
 * Quarter Understanding calibration contract.
 *
 * Ownership: Quarter Understanding Builder contract.
 * Purpose: centralize deterministic confidence, classification, and output
 * precision constants so period interpretation remains auditable and
 * replayable. Values in this file affect confidence, importance, direction, or
 * depth-related behavior and must not be embedded in builder logic.
 */

export const QUARTER_UNDERSTANDING_CALIBRATION = {
  /**
   * Purpose: total supported enrichment dimensions in Quarter Understanding.
   * Ownership: Quarter Understanding enrichment contract.
   * Justification: Trust Signals, Topic Evolution, and Concept Registry are the
   * locked Sprint 10 enrichment inputs.
   * Range: positive integer enrichment dimension count.
   */
  SUPPORTED_ENRICHMENT_DIMENSION_COUNT: 3,

  /**
   * Purpose: minimum signal utilization used when evidence exists but no
   * Business Signal references are consumed.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: preserves a bounded grounding contribution from
   * non-signal evidence without implying strong signal utilization.
   * Range: normalized confidence [0, 1].
   */
  SIGNAL_UTILIZATION_GROUNDING_FLOOR: 0.25,

  /**
   * Purpose: component count for grounding score calculation.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: grounding averages evidence coverage and adjusted signal
   * utilization.
   * Range: positive integer component count.
   */
  GROUNDING_COMPONENT_COUNT: 2,

  /**
   * Purpose: deterministic baseline added to interpretation quality.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: preserves the existing baseline for structurally valid
   * interpretations before enrichment depth is considered.
   * Range: normalized contribution [0, 1].
   */
  INTERPRETATION_QUALITY_BASELINE: 1,

  /**
   * Purpose: component count for interpretation quality calculation.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: interpretation quality averages grounding, enrichment, and
   * baseline validity.
   * Range: positive integer component count.
   */
  INTERPRETATION_QUALITY_COMPONENT_COUNT: 3,

  /**
   * Purpose: component count for overall confidence calculation.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: overall confidence averages grounding, signal utilization,
   * evidence coverage, and interpretation quality.
   * Range: positive integer component count.
   */
  OVERALL_CONFIDENCE_COMPONENT_COUNT: 4,

  /**
   * Purpose: decimal places used when serializing confidence values.
   * Ownership: Quarter Understanding confidence contract.
   * Justification: preserves deterministic output precision for replayability.
   * Range: non-negative integer decimal precision.
   */
  CONFIDENCE_ROUNDING_DECIMAL_PLACES: 4,

  /**
   * Purpose: signal magnitudes that classify an understanding as high
   * importance.
   * Ownership: Quarter Understanding importance classification contract.
   * Justification: high-magnitude Business Signals indicate high importance.
   * Range: valid Business Signal magnitude values.
   */
  HIGH_IMPORTANCE_SIGNAL_MAGNITUDES: ["high"],

  /**
   * Purpose: minimum relevant signal count that classifies an understanding as
   * medium importance when no high-magnitude signal is present.
   * Ownership: Quarter Understanding importance classification contract.
   * Justification: presence of at least one relevant observation raises
   * importance above low.
   * Range: non-negative integer signal count.
   */
  MEDIUM_IMPORTANCE_MIN_SIGNAL_COUNT: 1,

  /**
   * Purpose: Trust Signal severities that classify trust interpretation as high
   * importance.
   * Ownership: Quarter Understanding trust interpretation contract.
   * Justification: high-severity Trust Signals require high-importance trust
   * interpretation.
   * Range: valid Trust Signal severity values.
   */
  HIGH_IMPORTANCE_TRUST_SEVERITIES: ["high"],

  /**
   * Purpose: minimum Trust Signal count that classifies trust interpretation as
   * medium importance when no high-severity Trust Signal is present.
   * Ownership: Quarter Understanding trust interpretation contract.
   * Justification: available trust observations require at least medium
   * interpretation importance.
   * Range: non-negative integer signal count.
   */
  MEDIUM_IMPORTANCE_MIN_TRUST_SIGNAL_COUNT: 1,

  /**
   * Purpose: Business Signal directions interpreted as improving.
   * Ownership: Quarter Understanding direction classification contract.
   * Justification: preserves deterministic mapping from observation direction
   * to interpretation direction.
   * Range: valid Business Signal direction values.
   */
  IMPROVING_BUSINESS_SIGNAL_DIRECTIONS: ["improving"],

  /**
   * Purpose: Business Signal directions interpreted as deteriorating.
   * Ownership: Quarter Understanding direction classification contract.
   * Justification: preserves deterministic mapping from observation direction
   * to interpretation direction.
   * Range: valid Business Signal direction values.
   */
  DETERIORATING_BUSINESS_SIGNAL_DIRECTIONS: ["deteriorating"],

  /**
   * Purpose: Trust Signal directions interpreted as improving.
   * Ownership: Quarter Understanding trust direction classification contract.
   * Justification: preserves deterministic mapping from trust observation
   * direction to trust interpretation direction.
   * Range: valid Trust Signal direction values.
   */
  IMPROVING_TRUST_SIGNAL_DIRECTIONS: ["positive"],

  /**
   * Purpose: Trust Signal directions interpreted as deteriorating.
   * Ownership: Quarter Understanding trust direction classification contract.
   * Justification: preserves deterministic mapping from trust observation
   * direction to trust interpretation direction.
   * Range: valid Trust Signal direction values.
   */
  DETERIORATING_TRUST_SIGNAL_DIRECTIONS: ["negative"],
} as const;
