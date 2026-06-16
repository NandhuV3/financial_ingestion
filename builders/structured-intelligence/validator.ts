import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { STRUCTURED_INTELLIGENCE_STATUS_VALUES, type StructuredIntelligenceArtifactContent, type StructuredUnderstanding } from "./contract.js";
import type { FilingArtifactContent, StructuredIntelligenceBuilderInput, StructuredIntelligenceLLMOutput } from "./types.js";
import type { ThemesArtifactContent } from "../themes/contract.js";

const importanceValues = new Set(["high", "medium", "low"]);
const forbiddenPatterns = [
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\bundervalued\b/i,
  /\bovervalued\b/i,
  /\bprice target\b/i,
  /\bexpected return\b/i,
  /\btrustworthy\b/i,
  /\buntrustworthy\b/i,
  /\btrust score\b/i,
  /\bconcept[_ -]?id\b/i,
  /\btopic[_ -]?id\b/i,
];
const genericPatterns = [
  /\boperates in a competitive market\b/i,
  /\bmanagement focuses on growth\b/i,
  /\bserves customers globally\b/i,
  /\bcompany provides products and services\b/i,
];

export function validateStructuredIntelligenceInput(input: StructuredIntelligenceBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
}

export function validateFilingArtifact(content: FilingArtifactContent): void {
  requireText(content.filing_id, "filing.filing_id");
  requireText(content.filing_type, "filing.filing_type");
  requireText(content.filing_content, "filing.filing_content");
  requireText(content.filing_hash, "filing.filing_hash");
  requireText(content.filing_period, "filing.filing_period");
}

export function validateThemesArtifact(content: ThemesArtifactContent): void {
  requireText(content.filing_id, "themes.filing_id");

  if (!Array.isArray(content.themes)) {
    throw new BuilderValidationError("themes.themes must be an array.");
  }
}

export function parseStructuredIntelligenceLLMOutput(outputText: string): StructuredIntelligenceLLMOutput {
  try {
    const parsed = JSON.parse(outputText) as unknown;

    if (!isRecord(parsed) || !STRUCTURED_INTELLIGENCE_STATUS_VALUES.includes(parsed.status as never)) {
      throw new BuilderValidationError("Structured Intelligence output must include a valid status.");
    }

    if (!isRecord(parsed.understanding)) {
      throw new BuilderValidationError("Structured Intelligence output must include understanding.");
    }

    return parsed as StructuredIntelligenceLLMOutput;
  } catch (error) {
    if (error instanceof BuilderValidationError) {
      throw error;
    }

    throw new BuilderValidationError("Structured Intelligence LLM output must be valid JSON.", error);
  }
}

export function validateStructuredIntelligenceContent(content: StructuredIntelligenceArtifactContent): void {
  requireText(content.company_id, "content.company_id");
  requireText(content.period_id, "content.period_id");
  requireText(content.filing_id, "content.filing_id");
  requireText(content.filing_period, "content.filing_period");

  if (!STRUCTURED_INTELLIGENCE_STATUS_VALUES.includes(content.status)) {
    throw new BuilderValidationError("content.status is invalid.");
  }

  validateStructuredUnderstanding(content.understanding);
  validateScore(content.confidence.overall, "confidence.overall");
  validateScore(content.confidence.evidence_coverage, "confidence.evidence_coverage");
  validateScore(content.confidence.field_completeness, "confidence.field_completeness");
  validateScore(content.confidence.theme_utilization, "confidence.theme_utilization");
  validateScore(content.confidence.hallucination_risk, "confidence.hallucination_risk");
}

export function detectGenericLanguage(understanding: StructuredUnderstanding): string[] {
  return allClaimText(understanding)
    .filter((text) => genericPatterns.some((pattern) => pattern.test(text)));
}

export function detectUnsupportedEntityWarnings(
  understanding: StructuredUnderstanding,
  filingContent: string,
  themeTexts: string[],
): string[] {
  const supportText = `${filingContent}\n${themeTexts.join("\n")}`.toLowerCase();
  const warnings: string[] = [];

  for (const product of understanding.products) {
    if (!supportText.includes(product.product_name.toLowerCase())) {
      warnings.push(`Unsupported product reference: ${product.product_name}`);
    }
  }

  for (const customer of understanding.customers) {
    if (!supportText.includes(customer.customer_segment.toLowerCase())) {
      warnings.push(`Unsupported customer reference: ${customer.customer_segment}`);
    }
  }

  for (const position of understanding.competitive_positioning) {
    const firstTerm = position.position.split(/\s+/).find(Boolean) ?? "";

    if (firstTerm && !supportText.includes(firstTerm.toLowerCase())) {
      warnings.push(`Potential unsupported competitive reference: ${position.position}`);
    }
  }

  return warnings;
}

export function validateStructuredUnderstanding(understanding: StructuredUnderstanding): void {
  if (!isRecord(understanding.business_model)) {
    throw new BuilderValidationError("understanding.business_model is required.");
  }

  if (!isRecord(understanding.revenue_model)) {
    throw new BuilderValidationError("understanding.revenue_model is required.");
  }

  validateBusinessModel(understanding.business_model);
  validateRevenueModel(understanding.revenue_model);
  validateArray(understanding.products, "products");
  validateArray(understanding.customers, "customers");
  validateArray(understanding.revenue_drivers, "revenue_drivers");
  validateArray(understanding.competitive_positioning, "competitive_positioning");
  validateArray(understanding.strategic_priorities, "strategic_priorities");
  validateArray(understanding.management_focus, "management_focus");
  validateArray(understanding.risks, "risks");
  validateArray(understanding.dependencies, "dependencies");

  for (const [index, product] of understanding.products.entries()) {
    requireText(product.product_name, `products[${index}].product_name`);
    requireText(product.description, `products[${index}].description`);
    validateImportance(product.importance, `products[${index}].importance`);
    validateEvidence(product.evidence_refs, `products[${index}].evidence_refs`);
    rejectForbiddenLanguage(`${product.product_name} ${product.description}`, `products[${index}]`);
  }

  for (const [index, customer] of understanding.customers.entries()) {
    requireText(customer.customer_segment, `customers[${index}].customer_segment`);
    requireText(customer.description, `customers[${index}].description`);
    validateEvidence(customer.evidence_refs, `customers[${index}].evidence_refs`);
    rejectForbiddenLanguage(`${customer.customer_segment} ${customer.description}`, `customers[${index}]`);
  }

  for (const [index, driver] of understanding.revenue_drivers.entries()) {
    requireText(driver.driver, `revenue_drivers[${index}].driver`);
    requireText(driver.explanation, `revenue_drivers[${index}].explanation`);
    validateEvidence(driver.evidence_refs, `revenue_drivers[${index}].evidence_refs`);
    rejectForbiddenLanguage(`${driver.driver} ${driver.explanation}`, `revenue_drivers[${index}]`);
  }

  for (const [index, position] of understanding.competitive_positioning.entries()) {
    requireText(position.position, `competitive_positioning[${index}].position`);
    requireText(position.supporting_reasoning, `competitive_positioning[${index}].supporting_reasoning`);
    validateEvidence(position.evidence_refs, `competitive_positioning[${index}].evidence_refs`);
    rejectForbiddenLanguage(`${position.position} ${position.supporting_reasoning}`, `competitive_positioning[${index}]`);
  }

  validateNamedExplanationArray(understanding.strategic_priorities, "strategic_priorities", "priority", "rationale");
  validateNamedExplanationArray(understanding.management_focus, "management_focus", "focus_area", "explanation");
  validateNamedExplanationArray(understanding.risks, "risks", "risk", "explanation");
  validateNamedExplanationArray(understanding.dependencies, "dependencies", "dependency", "explanation");
}

function validateBusinessModel(value: StructuredUnderstanding["business_model"]): void {
  requireText(value.summary, "business_model.summary");
  requireText(value.value_creation, "business_model.value_creation");
  requireText(value.revenue_structure, "business_model.revenue_structure");
  validateEvidence(value.evidence_refs, "business_model.evidence_refs");
  rejectForbiddenLanguage(`${value.summary} ${value.value_creation} ${value.revenue_structure}`, "business_model");
}

function validateRevenueModel(value: StructuredUnderstanding["revenue_model"]): void {
  requireText(value.summary, "revenue_model.summary");
  validateArray(value.recurring_components, "revenue_model.recurring_components");
  validateArray(value.transactional_components, "revenue_model.transactional_components");
  validateEvidence(value.evidence_refs, "revenue_model.evidence_refs");
  rejectForbiddenLanguage(`${value.summary} ${value.recurring_components.join(" ")} ${value.transactional_components.join(" ")}`, "revenue_model");
}

function validateNamedExplanationArray<T extends Record<string, unknown>>(
  values: T[],
  field: string,
  nameKey: keyof T,
  explanationKey: keyof T,
): void {
  for (const [index, value] of values.entries()) {
    requireText(value[nameKey], `${field}[${index}].${String(nameKey)}`);
    requireText(value[explanationKey], `${field}[${index}].${String(explanationKey)}`);
    validateEvidence(value.evidence_refs, `${field}[${index}].evidence_refs`);
    rejectForbiddenLanguage(`${String(value[nameKey])} ${String(value[explanationKey])}`, `${field}[${index}]`);
  }
}

function allClaimText(understanding: StructuredUnderstanding): string[] {
  return [
    understanding.business_model.summary,
    understanding.business_model.value_creation,
    understanding.business_model.revenue_structure,
    understanding.revenue_model.summary,
    ...understanding.products.flatMap((product) => [product.product_name, product.description]),
    ...understanding.customers.flatMap((customer) => [customer.customer_segment, customer.description]),
    ...understanding.revenue_drivers.flatMap((driver) => [driver.driver, driver.explanation]),
    ...understanding.competitive_positioning.flatMap((position) => [position.position, position.supporting_reasoning]),
    ...understanding.strategic_priorities.flatMap((priority) => [priority.priority, priority.rationale]),
    ...understanding.management_focus.flatMap((focus) => [focus.focus_area, focus.explanation]),
    ...understanding.risks.flatMap((risk) => [risk.risk, risk.explanation]),
    ...understanding.dependencies.flatMap((dependency) => [dependency.dependency, dependency.explanation]),
  ];
}

function rejectForbiddenLanguage(value: string, field: string): void {
  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    throw new BuilderValidationError(`${field} contains forbidden boundary-crossing language.`);
  }
}

function validateEvidence(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new BuilderValidationError(`${field} must contain at least one evidence reference.`);
  }
}

function validateImportance(value: string, field: string): void {
  if (!importanceValues.has(value)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

function validateArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }
}

function validateScore(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
