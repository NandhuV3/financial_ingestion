import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { QuestionEvidencePackage } from "./types.js";

const EVIDENCE_FIELDS = [
  "company_knowledge_refs",
  "quarter_understanding_refs",
  "business_signal_refs",
  "trust_signal_refs",
  "commitment_tracking_refs",
  "topic_refs",
  "prior_investor_intelligence_refs",
  "market_data_refs",
];

export function parsePromptJson(
  outputText: string,
  question: string,
  allowedFields: string[],
): Record<string, unknown> {
  let value: unknown;

  try {
    value = JSON.parse(outputText) as unknown;
  } catch (error) {
    throw new BuilderValidationError(`${question} prompt output must be valid JSON.`, error);
  }

  if (!isObject(value)) {
    throw new BuilderValidationError(`${question} prompt output must be an object.`);
  }

  validateExactFields(value, allowedFields, `${question} prompt output`);

  return value;
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

export function optionalString(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }

  return requiredString(value, field);
}

export function requiredStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new BuilderValidationError(`${field} must be an array of non-empty strings.`);
  }

  return value.map((item) => item.trim());
}

export function requiredEvidence(value: unknown, field: string): QuestionEvidencePackage {
  if (!isObject(value)) {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  validateExactFields(value, EVIDENCE_FIELDS, field);

  return {
    company_knowledge_refs: requiredStringArray(value.company_knowledge_refs, `${field}.company_knowledge_refs`),
    quarter_understanding_refs: requiredStringArray(value.quarter_understanding_refs, `${field}.quarter_understanding_refs`),
    business_signal_refs: requiredStringArray(value.business_signal_refs, `${field}.business_signal_refs`),
    trust_signal_refs: requiredStringArray(value.trust_signal_refs, `${field}.trust_signal_refs`),
    commitment_tracking_refs: requiredStringArray(value.commitment_tracking_refs, `${field}.commitment_tracking_refs`),
    topic_refs: requiredStringArray(value.topic_refs, `${field}.topic_refs`),
    prior_investor_intelligence_refs: requiredStringArray(value.prior_investor_intelligence_refs, `${field}.prior_investor_intelligence_refs`),
    market_data_refs: requiredStringArray(value.market_data_refs, `${field}.market_data_refs`),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateExactFields(value: Record<string, unknown>, allowedFields: string[], label: string): void {
  const allowed = new Set(allowedFields);
  const keys = Object.keys(value);

  for (const key of keys) {
    if (!allowed.has(key)) {
      throw new BuilderValidationError(`${label} contains disallowed field: ${key}.`);
    }
  }

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) {
      throw new BuilderValidationError(`${label} is missing required field: ${field}.`);
    }
  }
}
