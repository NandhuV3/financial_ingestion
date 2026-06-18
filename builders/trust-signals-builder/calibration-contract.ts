/*
 * Trust Signals calibration contract.
 *
 * Ownership: Trust Signals Builder contract.
 * Purpose: centralize deterministic thresholds, confidence fallbacks, and
 * coverage constants so signal generation remains auditable and replayable.
 * These values affect Trust Signals classification, confidence, or depth
 * behavior and must not be embedded in builder logic.
 */

export const TRUST_SIGNALS_CALIBRATION = {
  /**
   * Purpose: fallback confidence when Commitment Tracking provides no
   * commitment-level or evidence-level confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves a bounded neutral-low confidence for emitted
   * commitment observations backed by artifact presence but no source score.
   * Range: normalized confidence [0, 1].
   */
  COMMITMENT_CONFIDENCE_FALLBACK: 0.6,

  /**
   * Purpose: fallback confidence when Narrative Consistency records do not
   * include record-level or artifact-level confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves existing neutral-low confidence for narrative
   * observations with source records but no source score.
   * Range: normalized confidence [0, 1].
   */
  NARRATIVE_RECORD_CONFIDENCE_FALLBACK: 0.6,

  /**
   * Purpose: fallback confidence for narrative stability summary observations
   * when artifact-level confidence is unavailable.
   * Ownership: Trust Signals confidence contract.
   * Justification: summary-derived stability observations carry more source
   * aggregation than a single record but remain below high confidence without
   * explicit pillar confidence.
   * Range: normalized confidence [0, 1].
   */
  NARRATIVE_STABILITY_CONFIDENCE_FALLBACK: 0.7,

  /**
   * Purpose: minimum stable-priority ratio that emits a high narrative
   * stability observation.
   * Ownership: Trust Signals classification contract.
   * Justification: preserves the locked deterministic boundary used to map
   * Narrative Consistency summary coverage into a Trust Signal observation.
   * Range: normalized ratio [0, 1].
   */
  NARRATIVE_STABILITY_HIGH_MIN_RATIO: 0.8,

  /**
   * Purpose: maximum stable-priority ratio that emits a low narrative
   * stability observation.
   * Ownership: Trust Signals classification contract.
   * Justification: preserves the locked deterministic boundary used to map
   * Narrative Consistency summary coverage into a Trust Signal observation.
   * Range: normalized ratio [0, 1].
   */
  NARRATIVE_STABILITY_LOW_MAX_RATIO: 0.4,

  /**
   * Purpose: fallback confidence when Accounting Stability records do not
   * include record-level or artifact-level confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves neutral-low confidence for accounting observations
   * backed by source records but no source score.
   * Range: normalized confidence [0, 1].
   */
  ACCOUNTING_CONFIDENCE_FALLBACK: 0.6,

  /**
   * Purpose: evidence-reference count at or above which a Capital Allocation
   * gap receives multi-evidence confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves deterministic evidence completeness mapping for
   * Capital Allocation Tracking gaps.
   * Range: positive integer evidence reference count.
   */
  CAPITAL_ALLOCATION_MULTI_EVIDENCE_MIN_REFS: 2,

  /**
   * Purpose: evidence-reference count that receives single-evidence confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves deterministic evidence completeness mapping for
   * Capital Allocation Tracking gaps.
   * Range: positive integer evidence reference count.
   */
  CAPITAL_ALLOCATION_SINGLE_EVIDENCE_REFS: 1,

  /**
   * Purpose: confidence for Capital Allocation gaps with multiple evidence refs.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves the strongest deterministic confidence tier for
   * gap observations with corroborating evidence refs.
   * Range: normalized confidence [0, 1].
   */
  CAPITAL_ALLOCATION_MULTI_EVIDENCE_CONFIDENCE: 0.85,

  /**
   * Purpose: confidence for Capital Allocation gaps with one evidence ref.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves the middle deterministic confidence tier for
   * gap observations with direct evidence.
   * Range: normalized confidence [0, 1].
   */
  CAPITAL_ALLOCATION_SINGLE_EVIDENCE_CONFIDENCE: 0.7,

  /**
   * Purpose: confidence for Capital Allocation gaps with no source evidence refs.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves the lowest deterministic confidence tier for
   * source records where the builder must synthesize a record reference.
   * Range: normalized confidence [0, 1].
   */
  CAPITAL_ALLOCATION_NO_EVIDENCE_CONFIDENCE: 0.5,

  /**
   * Purpose: fallback confidence when a source confidence value is not finite.
   * Ownership: Trust Signals confidence contract.
   * Justification: prevents invalid numeric input from producing non-replayable
   * confidence output while preserving a neutral midpoint.
   * Range: normalized confidence [0, 1].
   */
  NON_FINITE_CONFIDENCE_FALLBACK: 0.5,

  /**
   * Purpose: decimal places used when serializing normalized confidence values.
   * Ownership: Trust Signals confidence contract.
   * Justification: preserves deterministic output precision for replayability.
   * Range: non-negative integer decimal precision.
   */
  CONFIDENCE_ROUNDING_DECIMAL_PLACES: 4,

  /**
   * Purpose: number of confidence components included in Trust Signals overall
   * confidence.
   * Ownership: Trust Signals confidence contract.
   * Justification: documents the deterministic average across source data,
   * evidence completeness, and rule evaluation confidence.
   * Range: positive integer component count.
   */
  OVERALL_CONFIDENCE_COMPONENT_COUNT: 3,

  /**
   * Purpose: total supported Trust Pillar count used for coverage confidence
   * and full-depth determination.
   * Ownership: Trust Signals enrichment contract.
   * Justification: Trust Signals supports four locked pillar artifacts.
   * Range: positive integer pillar count.
   */
  SUPPORTED_PILLAR_COUNT: 4,

  /**
   * Purpose: minimum available pillar count for standard depth.
   * Ownership: Trust Signals enrichment contract.
   * Justification: locked enrichment model states two or three pillars produce
   * standard depth.
   * Range: positive integer pillar count.
   */
  STANDARD_DEPTH_MIN_PILLAR_COUNT: 2,
} as const;
