import type {
  StructuredIntelligenceConfidence,
  StructuredIntelligenceEvaluationHooks,
  StructuredUnderstanding,
} from "./contract.js";
import type { Theme } from "../themes/contract.js";

const totalSections = 10;

export function calculateStructuredIntelligenceConfidence(
  understanding: StructuredUnderstanding,
  themes: Theme[],
  unsupportedWarnings: string[],
): StructuredIntelligenceConfidence {
  const evidenceCoverage = evidenceCoverageScore(understanding);
  const fieldCompleteness = fieldCompletenessScore(understanding);
  const themeUtilization = themeUtilizationScore(understanding, themes);
  const hallucinationRisk = Math.max(0, 1 - unsupportedWarnings.length / Math.max(claimCount(understanding), 1));
  const overall = round((evidenceCoverage + fieldCompleteness + themeUtilization + hallucinationRisk) / 4);

  return {
    overall,
    evidence_coverage: round(evidenceCoverage),
    field_completeness: round(fieldCompleteness),
    theme_utilization: round(themeUtilization),
    hallucination_risk: round(hallucinationRisk),
  };
}

export function buildStructuredIntelligenceEvaluationHooks(
  understanding: StructuredUnderstanding,
  themes: Theme[],
  promptVersion: string,
  modelVersion: string,
  genericLanguageCount: number,
  unsupportedEntityWarnings: string[],
): StructuredIntelligenceEvaluationHooks {
  const confidence = calculateStructuredIntelligenceConfidence(understanding, themes, unsupportedEntityWarnings);

  return {
    prompt_version: promptVersion,
    model_version: modelVersion,
    section_coverage: round(sectionCoverageScore(understanding)),
    field_coverage: confidence.field_completeness,
    evidence_coverage: confidence.evidence_coverage,
    theme_utilization: confidence.theme_utilization,
    confidence_distribution: {
      low: confidence.overall < 0.5 ? 1 : 0,
      medium: confidence.overall >= 0.5 && confidence.overall < 0.8 ? 1 : 0,
      high: confidence.overall >= 0.8 ? 1 : 0,
    },
    generic_language_count: genericLanguageCount,
    unsupported_entity_warnings: unsupportedEntityWarnings,
  };
}

function sectionCoverageScore(understanding: StructuredUnderstanding): number {
  const populatedSections = [
    understanding.business_model.summary,
    understanding.products.length,
    understanding.customers.length,
    understanding.revenue_model.summary,
    understanding.revenue_drivers.length,
    understanding.competitive_positioning.length,
    understanding.strategic_priorities.length,
    understanding.management_focus.length,
    understanding.risks.length,
    understanding.dependencies.length,
  ].filter(Boolean).length;

  return populatedSections / totalSections;
}

function evidenceCoverageScore(understanding: StructuredUnderstanding): number {
  const sections = [
    understanding.business_model.evidence_refs,
    understanding.revenue_model.evidence_refs,
    ...understanding.products.map((item) => item.evidence_refs),
    ...understanding.customers.map((item) => item.evidence_refs),
    ...understanding.revenue_drivers.map((item) => item.evidence_refs),
    ...understanding.competitive_positioning.map((item) => item.evidence_refs),
    ...understanding.strategic_priorities.map((item) => item.evidence_refs),
    ...understanding.management_focus.map((item) => item.evidence_refs),
    ...understanding.risks.map((item) => item.evidence_refs),
    ...understanding.dependencies.map((item) => item.evidence_refs),
  ];

  return sections.length === 0 ? 0 : sections.filter((refs) => refs.length > 0).length / sections.length;
}

function fieldCompletenessScore(understanding: StructuredUnderstanding): number {
  const values = [
    understanding.business_model.summary,
    understanding.business_model.value_creation,
    understanding.business_model.revenue_structure,
    understanding.revenue_model.summary,
    ...understanding.revenue_model.recurring_components,
    ...understanding.revenue_model.transactional_components,
    ...understanding.products.flatMap((product) => [product.product_name, product.description]),
    ...understanding.customers.flatMap((customer) => [customer.customer_segment, customer.description]),
    ...understanding.revenue_drivers.flatMap((driver) => [driver.driver, driver.explanation]),
    ...understanding.competitive_positioning.flatMap((position) => [position.position, position.supporting_reasoning]),
    ...understanding.strategic_priorities.flatMap((priority) => [priority.priority, priority.rationale]),
    ...understanding.management_focus.flatMap((focus) => [focus.focus_area, focus.explanation]),
    ...understanding.risks.flatMap((risk) => [risk.risk, risk.explanation]),
    ...understanding.dependencies.flatMap((dependency) => [dependency.dependency, dependency.explanation]),
  ];

  return values.length === 0 ? 0 : values.filter((value) => value.trim() !== "" && value !== "unknown").length / values.length;
}

function themeUtilizationScore(
  understanding: StructuredUnderstanding,
  themes: Theme[],
): number {
  if (themes.length === 0) {
    return 0;
  }

  const references = new Set([
    ...understanding.business_model.evidence_refs,
    ...understanding.revenue_model.evidence_refs,
    ...understanding.products.flatMap((item) => item.evidence_refs),
    ...understanding.customers.flatMap((item) => item.evidence_refs),
    ...understanding.revenue_drivers.flatMap((item) => item.evidence_refs),
    ...understanding.competitive_positioning.flatMap((item) => item.evidence_refs),
    ...understanding.strategic_priorities.flatMap((item) => item.evidence_refs),
    ...understanding.management_focus.flatMap((item) => item.evidence_refs),
    ...understanding.risks.flatMap((item) => item.evidence_refs),
    ...understanding.dependencies.flatMap((item) => item.evidence_refs),
  ]);
  const utilizedThemes = themes.filter((theme) =>
    references.has(theme.theme_id)
    || theme.evidence.some(({ excerpt_hash }) =>
      references.has(excerpt_hash)));

  return utilizedThemes.length / themes.length;
}

function claimCount(understanding: StructuredUnderstanding): number {
  return 2
    + understanding.products.length
    + understanding.customers.length
    + understanding.revenue_drivers.length
    + understanding.competitive_positioning.length
    + understanding.strategic_priorities.length
    + understanding.management_focus.length
    + understanding.risks.length
    + understanding.dependencies.length;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
