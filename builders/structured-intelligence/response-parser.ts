import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  PRODUCT_IMPORTANCE_VALUES,
  type BusinessModelUnderstanding,
  type CompetitiveUnderstanding,
  type CustomerUnderstanding,
  type DependencyUnderstanding,
  type ManagementFocusUnderstanding,
  type ProductUnderstanding,
  type RevenueDriverUnderstanding,
  type RevenueModelUnderstanding,
  type RiskUnderstanding,
  type StrategicPriorityUnderstanding,
  type StructuredUnderstanding,
} from "./contract.js";
import type { StructuredIntelligencePromptOutput } from "./types.js";

export function parseStructuredIntelligencePromptOutput(
  outputText: string,
): StructuredIntelligencePromptOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    throw new BuilderValidationError(
      "Structured Intelligence prompt output must be valid JSON.",
      error,
    );
  }

  const root = exactRecord(
    parsed,
    "structured_intelligence_prompt_output",
    ["understanding"],
  );

  return {
    understanding: parseUnderstanding(root.understanding),
  };
}

function parseUnderstanding(value: unknown): StructuredUnderstanding {
  const record = exactRecord(value, "understanding", [
    "business_model",
    "products",
    "customers",
    "revenue_model",
    "revenue_drivers",
    "competitive_positioning",
    "strategic_priorities",
    "management_focus",
    "risks",
    "dependencies",
  ]);

  return {
    business_model: record.business_model === null
      ? null
      : parseBusinessModel(record.business_model),
    products: requiredArray(record.products, "understanding.products")
      .map(parseProduct),
    customers: requiredArray(record.customers, "understanding.customers")
      .map(parseCustomer),
    revenue_model: record.revenue_model === null
      ? null
      : parseRevenueModel(record.revenue_model),
    revenue_drivers: requiredArray(
      record.revenue_drivers,
      "understanding.revenue_drivers",
    ).map(parseRevenueDriver),
    competitive_positioning: requiredArray(
      record.competitive_positioning,
      "understanding.competitive_positioning",
    ).map(parseCompetitivePosition),
    strategic_priorities: requiredArray(
      record.strategic_priorities,
      "understanding.strategic_priorities",
    ).map(parseStrategicPriority),
    management_focus: requiredArray(
      record.management_focus,
      "understanding.management_focus",
    ).map(parseManagementFocus),
    risks: requiredArray(record.risks, "understanding.risks").map(parseRisk),
    dependencies: requiredArray(
      record.dependencies,
      "understanding.dependencies",
    ).map(parseDependency),
  };
}

function parseBusinessModel(value: unknown): BusinessModelUnderstanding {
  const field = "understanding.business_model";
  const record = groundedRecord(value, field, ["summary", "value_creation"]);

  return {
    summary: requiredString(record.summary, `${field}.summary`),
    value_creation: requiredString(
      record.value_creation,
      `${field}.value_creation`,
    ),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseProduct(value: unknown, index: number): ProductUnderstanding {
  const field = `understanding.products[${index}]`;
  const record = groundedRecord(value, field, [
    "product_name",
    "description",
    "importance",
  ]);
  const importance = requiredString(record.importance, `${field}.importance`);

  if (!PRODUCT_IMPORTANCE_VALUES.includes(importance as never)) {
    throw new BuilderValidationError(`${field}.importance is invalid.`);
  }

  return {
    product_name: requiredString(record.product_name, `${field}.product_name`),
    description: requiredString(record.description, `${field}.description`),
    importance: importance as ProductUnderstanding["importance"],
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseCustomer(value: unknown, index: number): CustomerUnderstanding {
  const field = `understanding.customers[${index}]`;
  const record = groundedRecord(value, field, [
    "customer_segment",
    "description",
  ]);

  return {
    customer_segment: requiredString(
      record.customer_segment,
      `${field}.customer_segment`,
    ),
    description: requiredString(record.description, `${field}.description`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseRevenueModel(value: unknown): RevenueModelUnderstanding {
  const field = "understanding.revenue_model";
  const record = groundedRecord(value, field, [
    "summary",
    "recurring_components",
    "transactional_components",
  ]);

  return {
    summary: requiredString(record.summary, `${field}.summary`),
    recurring_components: requiredStringArray(
      record.recurring_components,
      `${field}.recurring_components`,
    ),
    transactional_components: requiredStringArray(
      record.transactional_components,
      `${field}.transactional_components`,
    ),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseRevenueDriver(
  value: unknown,
  index: number,
): RevenueDriverUnderstanding {
  const field = `understanding.revenue_drivers[${index}]`;
  const record = groundedRecord(value, field, ["driver", "explanation"]);

  return {
    driver: requiredString(record.driver, `${field}.driver`),
    explanation: requiredString(record.explanation, `${field}.explanation`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseCompetitivePosition(
  value: unknown,
  index: number,
): CompetitiveUnderstanding {
  const field = `understanding.competitive_positioning[${index}]`;
  const record = groundedRecord(value, field, [
    "position",
    "supporting_reasoning",
  ]);

  return {
    position: requiredString(record.position, `${field}.position`),
    supporting_reasoning: requiredString(
      record.supporting_reasoning,
      `${field}.supporting_reasoning`,
    ),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseStrategicPriority(
  value: unknown,
  index: number,
): StrategicPriorityUnderstanding {
  const field = `understanding.strategic_priorities[${index}]`;
  const record = groundedRecord(value, field, ["priority", "rationale"]);

  return {
    priority: requiredString(record.priority, `${field}.priority`),
    rationale: requiredString(record.rationale, `${field}.rationale`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseManagementFocus(
  value: unknown,
  index: number,
): ManagementFocusUnderstanding {
  const field = `understanding.management_focus[${index}]`;
  const record = groundedRecord(value, field, ["focus_area", "explanation"]);

  return {
    focus_area: requiredString(record.focus_area, `${field}.focus_area`),
    explanation: requiredString(record.explanation, `${field}.explanation`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseRisk(value: unknown, index: number): RiskUnderstanding {
  const field = `understanding.risks[${index}]`;
  const record = groundedRecord(value, field, ["risk", "explanation"]);

  return {
    risk: requiredString(record.risk, `${field}.risk`),
    explanation: requiredString(record.explanation, `${field}.explanation`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function parseDependency(value: unknown, index: number): DependencyUnderstanding {
  const field = `understanding.dependencies[${index}]`;
  const record = groundedRecord(value, field, ["dependency", "explanation"]);

  return {
    dependency: requiredString(record.dependency, `${field}.dependency`),
    explanation: requiredString(record.explanation, `${field}.explanation`),
    confidence: requiredConfidence(record.confidence, `${field}.confidence`),
    evidence_refs: requiredEvidence(record.evidence_refs, `${field}.evidence_refs`),
  };
}

function groundedRecord(
  value: unknown,
  field: string,
  fields: string[],
): Record<string, unknown> {
  return exactRecord(value, field, [
    ...fields,
    "confidence",
    "evidence_refs",
  ]);
}

function exactRecord(
  value: unknown,
  field: string,
  allowedFields: string[],
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  const allowed = new Set(allowedFields);

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new BuilderValidationError(`${field} contains unknown field: ${key}.`);
    }
  }

  for (const key of allowedFields) {
    if (!(key in value)) {
      throw new BuilderValidationError(`${field}.${key} is required.`);
    }
  }

  return value;
}

function requiredArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }

  return value;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }

  return value;
}

function requiredStringArray(value: unknown, field: string): string[] {
  const values = requiredArray(value, field);

  return values.map((entry, index) =>
    requiredString(entry, `${field}[${index}]`));
}

function requiredEvidence(value: unknown, field: string): string[] {
  const evidence = requiredStringArray(value, field);

  if (evidence.length === 0) {
    throw new BuilderValidationError(
      `${field} must contain at least one evidence reference.`,
    );
  }

  return evidence;
}

function requiredConfidence(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || value < 0
    || value > 1
  ) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
