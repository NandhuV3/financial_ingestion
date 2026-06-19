import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  IMPORTANCE_LEVELS,
  UNDERSTANDING_CATEGORIES,
  UNDERSTANDING_DIRECTIONS,
} from "./contract.js";
import type {
  EvidencePackage,
  ProposedConcept,
  QuarterUnderstandingPromptOutput,
  Understanding,
} from "./types.js";

export function parseQuarterUnderstandingPromptOutput(
  outputText: string,
): QuarterUnderstandingPromptOutput {
  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    throw new BuilderValidationError(
      "Quarter Understanding prompt output must be valid JSON.",
      error,
    );
  }

  const root = exactRecord(
    parsed,
    "quarter_understanding_prompt_output",
    ["understandings", "proposed_concepts"],
  );
  const understandings = requiredArray(
    root.understandings,
    "quarter_understanding_prompt_output.understandings",
  ).map(parseUnderstanding);
  const proposedConcepts = requiredArray(
    root.proposed_concepts,
    "quarter_understanding_prompt_output.proposed_concepts",
  ).map(parseProposedConcept);

  return {
    understandings,
    proposed_concepts: proposedConcepts,
  };
}

function parseUnderstanding(value: unknown, index: number): Understanding {
  const field = `understandings[${index}]`;
  const record = exactRecord(value, field, [
    "understanding_id",
    "category",
    "concept_id",
    "title",
    "explanation",
    "importance",
    "direction",
    "evidence_package",
  ], ["concept_id"]);
  const category = requiredString(record.category, `${field}.category`);
  const importance = requiredString(record.importance, `${field}.importance`);
  const direction = requiredString(record.direction, `${field}.direction`);

  if (!UNDERSTANDING_CATEGORIES.includes(category as never)) {
    throw new BuilderValidationError(`${field}.category is invalid.`);
  }

  if (!IMPORTANCE_LEVELS.includes(importance as never)) {
    throw new BuilderValidationError(`${field}.importance is invalid.`);
  }

  if (!UNDERSTANDING_DIRECTIONS.includes(direction as never)) {
    throw new BuilderValidationError(`${field}.direction is invalid.`);
  }

  const result: Understanding = {
    understanding_id: requiredString(record.understanding_id, `${field}.understanding_id`),
    category: category as Understanding["category"],
    title: requiredString(record.title, `${field}.title`),
    explanation: requiredString(record.explanation, `${field}.explanation`),
    importance: importance as Understanding["importance"],
    direction: direction as Understanding["direction"],
    evidence_package: parseEvidencePackage(record.evidence_package, `${field}.evidence_package`),
  };

  if (record.concept_id !== undefined) {
    result.concept_id = requiredString(record.concept_id, `${field}.concept_id`);
  }

  return result;
}

function parseEvidencePackage(value: unknown, field: string): EvidencePackage {
  const record = exactRecord(value, field, [
    "signal_refs",
    "company_knowledge_refs",
    "trust_signal_refs",
    "topic_refs",
  ]);

  return {
    signal_refs: requiredStringArray(record.signal_refs, `${field}.signal_refs`),
    company_knowledge_refs: requiredStringArray(
      record.company_knowledge_refs,
      `${field}.company_knowledge_refs`,
    ),
    trust_signal_refs: requiredStringArray(
      record.trust_signal_refs,
      `${field}.trust_signal_refs`,
    ),
    topic_refs: requiredStringArray(record.topic_refs, `${field}.topic_refs`),
  };
}

function parseProposedConcept(value: unknown, index: number): ProposedConcept {
  const field = `proposed_concepts[${index}]`;
  const record = exactRecord(value, field, [
    "proposed_concept_id",
    "title",
    "description",
    "evidence_refs",
    "rationale",
  ]);

  return {
    proposed_concept_id: requiredString(
      record.proposed_concept_id,
      `${field}.proposed_concept_id`,
    ),
    title: requiredString(record.title, `${field}.title`),
    description: requiredString(record.description, `${field}.description`),
    evidence_refs: requiredStringArray(record.evidence_refs, `${field}.evidence_refs`),
    rationale: requiredString(record.rationale, `${field}.rationale`),
  };
}

function exactRecord(
  value: unknown,
  field: string,
  allowedFields: string[],
  optionalFields: string[] = [],
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  const allowed = new Set(allowedFields);
  const optional = new Set(optionalFields);

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new BuilderValidationError(`${field} contains unknown field: ${key}.`);
    }
  }

  for (const key of allowed) {
    if (!optional.has(key) && !(key in value)) {
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
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }

  return value;
}

function requiredStringArray(value: unknown, field: string): string[] {
  const values = requiredArray(value, field);

  for (const [index, item] of values.entries()) {
    requiredString(item, `${field}[${index}]`);
  }

  return values as string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
