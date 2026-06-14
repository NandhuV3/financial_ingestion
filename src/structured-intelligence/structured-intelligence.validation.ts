import type {
  StructuredIntelligenceLLMOutput,
} from "./types/build-structured-intelligence.prompt.types.js";

const stringFields = [
  "business_description",
] as const;

const arrayFields = [
  "products",
  "customers",
  "revenue_drivers",
  "competitive_positioning",
  "operating_model",
  "key_dependencies",
  "strategic_priorities",
  "risks",
  "opportunities",
] as const;

type StructuredStringField = typeof stringFields[number];
type StructuredArrayField = typeof arrayFields[number];
type StructuredField = StructuredStringField | StructuredArrayField;

export type StructuredIntelligenceQualityMetrics = {
  field_coverage: number;
  empty_fields: string[];
  populated_fields: string[];
};

export function validateStructuredIntelligenceOutput(
  output: unknown,
): StructuredIntelligenceLLMOutput {
  if (!isRecord(output)) {
    throw new Error("Structured Intelligence output must be a JSON object.");
  }

  for (const field of stringFields) {
    assertRequiredField(output, field);

    if (typeof output[field] !== "string") {
      throw new Error(`Structured Intelligence field "${field}" must be a string.`);
    }
  }

  for (const field of arrayFields) {
    assertRequiredField(output, field);

    if (!Array.isArray(output[field])) {
      throw new Error(`Structured Intelligence field "${field}" must be a string array.`);
    }

    for (const value of output[field]) {
      if (typeof value !== "string") {
        throw new Error(`Structured Intelligence field "${field}" must contain only strings.`);
      }
    }
  }

  return output as StructuredIntelligenceLLMOutput;
}

export function calculateStructuredIntelligenceQualityMetrics(
  output: StructuredIntelligenceLLMOutput,
): StructuredIntelligenceQualityMetrics {
  const emptyFields: string[] = [];
  const populatedFields: string[] = [];

  for (const field of [...stringFields, ...arrayFields]) {
    if (isPopulated(output, field)) {
      populatedFields.push(field);
    } else {
      emptyFields.push(field);
    }
  }

  return {
    field_coverage: round(populatedFields.length / (populatedFields.length + emptyFields.length)),
    empty_fields: emptyFields,
    populated_fields: populatedFields,
  };
}

function assertRequiredField(
  output: Record<string, unknown>,
  field: StructuredField,
): void {
  if (!(field in output)) {
    throw new Error(`Structured Intelligence output is missing required field "${field}".`);
  }

  if (output[field] === null || output[field] === undefined) {
    throw new Error(`Structured Intelligence field "${field}" is required.`);
  }
}

function isPopulated(
  output: StructuredIntelligenceLLMOutput,
  field: StructuredField,
): boolean {
  const value = output[field];

  return Array.isArray(value)
    ? value.length > 0
    : value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
