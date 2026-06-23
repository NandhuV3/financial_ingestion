import type { Theme } from "../themes/contract.js";
import {
  STRUCTURED_INTELLIGENCE_CONFIDENCE_COMPONENT_COUNT,
  STRUCTURED_INTELLIGENCE_CONFIDENCE_DECIMALS,
  STRUCTURED_INTELLIGENCE_TOP_LEVEL_FIELD_COUNT,
  type StructuredIntelligenceConfidence,
  type StructuredIntelligenceEvaluationHooks,
  type StructuredIntelligenceStatus,
  type StructuredUnderstanding,
} from "./contract.js";

export function calculateStructuredIntelligenceConfidence(
  understanding: StructuredUnderstanding,
  themes: Theme[],
): StructuredIntelligenceConfidence {
  const evidenceCoverage = calculateEvidenceCoverage(understanding);
  const fieldCompleteness = calculateFieldCompleteness(understanding);
  const themeUtilization = calculateThemeUtilization(understanding, themes);

  return {
    overall: round(
      (
        evidenceCoverage
        + fieldCompleteness
        + themeUtilization
      ) / STRUCTURED_INTELLIGENCE_CONFIDENCE_COMPONENT_COUNT,
    ),
    evidence_coverage: round(evidenceCoverage),
    field_completeness: round(fieldCompleteness),
    theme_utilization: round(themeUtilization),
    hallucination_risk: "not_assessed",
  };
}

export function calculateStructuredIntelligenceStatus(
  understanding: StructuredUnderstanding,
): StructuredIntelligenceStatus {
  const emittedValues = emittedValueCount(understanding);

  if (emittedValues === 0) {
    return "insufficient_filing";
  }

  return populatedTopLevelFieldCount(understanding)
    === STRUCTURED_INTELLIGENCE_TOP_LEVEL_FIELD_COUNT
    ? "complete"
    : "partial";
}

export function buildStructuredIntelligenceEvaluationHooks(
  confidence: StructuredIntelligenceConfidence,
): StructuredIntelligenceEvaluationHooks {
  return {
    schema_compliance: 1,
    field_coverage: confidence.field_completeness,
    evidence_coverage: confidence.evidence_coverage,
    theme_utilization: confidence.theme_utilization,
    unsupported_claim_count: "not_assessed",
  };
}

export function emittedValueCount(
  understanding: StructuredUnderstanding,
): number {
  return (understanding.business_model === null ? 0 : 1)
    + (understanding.revenue_model === null ? 0 : 1)
    + understanding.products.length
    + understanding.customers.length
    + understanding.revenue_drivers.length
    + understanding.competitive_positioning.length
    + understanding.strategic_priorities.length
    + understanding.management_focus.length
    + understanding.risks.length
    + understanding.dependencies.length;
}

export function populatedTopLevelFieldCount(
  understanding: StructuredUnderstanding,
): number {
  return [
    understanding.business_model !== null,
    understanding.products.length > 0,
    understanding.customers.length > 0,
    understanding.revenue_model !== null,
    understanding.revenue_drivers.length > 0,
    understanding.competitive_positioning.length > 0,
    understanding.strategic_priorities.length > 0,
    understanding.management_focus.length > 0,
    understanding.risks.length > 0,
    understanding.dependencies.length > 0,
  ].filter(Boolean).length;
}

function calculateEvidenceCoverage(
  understanding: StructuredUnderstanding,
): number {
  const evidenceSets = evidenceReferenceSets(understanding);

  if (evidenceSets.length === 0) {
    return 0;
  }

  return evidenceSets.filter((references) => references.length > 0).length
    / evidenceSets.length;
}

function calculateFieldCompleteness(
  understanding: StructuredUnderstanding,
): number {
  return populatedTopLevelFieldCount(understanding)
    / STRUCTURED_INTELLIGENCE_TOP_LEVEL_FIELD_COUNT;
}

function calculateThemeUtilization(
  understanding: StructuredUnderstanding,
  themes: Theme[],
): number {
  if (themes.length === 0) {
    return 0;
  }

  const usedEvidence = new Set(evidenceReferenceSets(understanding).flat());
  const usedThemeCount = themes.filter((theme) =>
    theme.evidence.some(({ evidence_ref }) => usedEvidence.has(evidence_ref)))
    .length;

  return usedThemeCount / themes.length;
}

function evidenceReferenceSets(
  understanding: StructuredUnderstanding,
): string[][] {
  return [
    ...(understanding.business_model === null
      ? []
      : [understanding.business_model.evidence_refs]),
    ...(understanding.revenue_model === null
      ? []
      : [understanding.revenue_model.evidence_refs]),
    ...understanding.products.map(({ evidence_refs }) => evidence_refs),
    ...understanding.customers.map(({ evidence_refs }) => evidence_refs),
    ...understanding.revenue_drivers.map(({ evidence_refs }) => evidence_refs),
    ...understanding.competitive_positioning.map(
      ({ evidence_refs }) => evidence_refs,
    ),
    ...understanding.strategic_priorities.map(
      ({ evidence_refs }) => evidence_refs,
    ),
    ...understanding.management_focus.map(({ evidence_refs }) => evidence_refs),
    ...understanding.risks.map(({ evidence_refs }) => evidence_refs),
    ...understanding.dependencies.map(({ evidence_refs }) => evidence_refs),
  ];
}

function round(value: number): number {
  const factor = 10 ** STRUCTURED_INTELLIGENCE_CONFIDENCE_DECIMALS;

  return Math.round(value * factor) / factor;
}
