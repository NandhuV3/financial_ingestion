import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  BUILDER_RECOMMENDATIONS,
  CHANGE_TYPES,
  type CompanyKnowledgeCandidateContent,
  STABILITY_CLASSES,
} from "./contract.js";
import type {
  CompanyKnowledgeArtifactContent,
  CompanyKnowledgeBuilderInput,
  StructuredIntelligenceArtifactContent,
} from "./types.js";

const validChangeTypes = new Set<string>(CHANGE_TYPES);
const validRecommendations = new Set<string>(BUILDER_RECOMMENDATIONS);
const validStabilityClasses = new Set<string>(STABILITY_CLASSES);

export function validateCompanyKnowledgeBuilderInput(input: CompanyKnowledgeBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");
}

export function validateStructuredIntelligenceDependency(content: StructuredIntelligenceArtifactContent): void {
  requireText(content.company_id, "structured_intelligence.company_id");
  requireText(content.period_id, "structured_intelligence.period_id");
  requireText(content.filing_id, "structured_intelligence.filing_id");
  requireConfidence(content.confidence.overall, "structured_intelligence.confidence.overall");

  if (!content.understanding || typeof content.understanding !== "object") {
    throw new BuilderValidationError("structured_intelligence.understanding is required.");
  }
}

export function validateCompanyKnowledgeDependency(content: CompanyKnowledgeArtifactContent): void {
  requireText(content.company_id, "company_knowledge.company_id");

  if (!content.knowledge || typeof content.knowledge !== "object") {
    throw new BuilderValidationError("company_knowledge.knowledge is required.");
  }
}

export function validateCompanyKnowledgeCandidateContent(content: CompanyKnowledgeCandidateContent): void {
  requireText(content.company_id, "content.company_id");
  requireText(content.period_id, "content.period_id");
  requireText(content.filing_id, "content.filing_id");

  if (!Array.isArray(content.candidate_changes)) {
    throw new BuilderValidationError("content.candidate_changes must be an array.");
  }

  for (const [index, change] of content.candidate_changes.entries()) {
    requireText(change.field_path, `content.candidate_changes[${index}].field_path`);

    if (!validChangeTypes.has(change.change_type)) {
      throw new BuilderValidationError(`content.candidate_changes[${index}].change_type is invalid.`);
    }

    requireConfidence(change.semantic_similarity, `content.candidate_changes[${index}].semantic_similarity`);

    if (!Number.isFinite(change.confidence_delta)) {
      throw new BuilderValidationError(`content.candidate_changes[${index}].confidence_delta must be finite.`);
    }

    if (!Number.isFinite(change.evidence_delta) || change.evidence_delta < 0) {
      throw new BuilderValidationError(`content.candidate_changes[${index}].evidence_delta must be non-negative.`);
    }

    if (!validRecommendations.has(change.builder_recommendation)) {
      throw new BuilderValidationError(`content.candidate_changes[${index}].builder_recommendation is invalid.`);
    }

    if (typeof change.review_required !== "boolean") {
      throw new BuilderValidationError(`content.candidate_changes[${index}].review_required must be boolean.`);
    }

    if (!Array.isArray(change.supporting_evidence) || change.supporting_evidence.length === 0) {
      throw new BuilderValidationError(`content.candidate_changes[${index}].supporting_evidence must contain evidence.`);
    }

    for (const [evidenceIndex, evidence] of change.supporting_evidence.entries()) {
      requireText(evidence, `content.candidate_changes[${index}].supporting_evidence[${evidenceIndex}]`);
    }
  }

  const summary = content.candidate_summary;

  requireCount(summary.total_fields_evaluated, "content.candidate_summary.total_fields_evaluated");
  requireCount(summary.unchanged_fields, "content.candidate_summary.unchanged_fields");
  requireCount(summary.changed_fields, "content.candidate_summary.changed_fields");
  requireCount(summary.major_changes, "content.candidate_summary.major_changes");
  requireCount(summary.contradictions, "content.candidate_summary.contradictions");
  requireCount(summary.review_candidates, "content.candidate_summary.review_candidates");

  if (summary.total_fields_evaluated !== content.candidate_changes.length) {
    throw new BuilderValidationError("content.candidate_summary.total_fields_evaluated must match candidate_changes length.");
  }

  const expectedSummary = {
    unchanged_fields: content.candidate_changes.filter((change) => change.change_type === "no_change").length,
    changed_fields: content.candidate_changes.filter((change) => change.change_type !== "no_change").length,
    major_changes: content.candidate_changes.filter((change) => change.change_type === "major_update").length,
    contradictions: content.candidate_changes.filter((change) => change.change_type === "contradiction").length,
    review_candidates: content.candidate_changes.filter((change) => change.review_required).length,
  };

  for (const [field, expected] of Object.entries(expectedSummary)) {
    if (summary[field as keyof typeof expectedSummary] !== expected) {
      throw new BuilderValidationError(`content.candidate_summary.${field} must match candidate_changes.`);
    }
  }

  const hooks = content.evaluation_hooks;
  const expectedRecommendationDistribution = {
    candidate_promote: content.candidate_changes.filter((change) => change.builder_recommendation === "candidate_promote").length,
    candidate_merge: content.candidate_changes.filter((change) => change.builder_recommendation === "candidate_merge").length,
    candidate_review: content.candidate_changes.filter((change) => change.builder_recommendation === "candidate_review").length,
    candidate_retain: content.candidate_changes.filter((change) => change.builder_recommendation === "candidate_retain").length,
  };

  assertHookCount(hooks.total_fields_evaluated, content.candidate_changes.length, "content.evaluation_hooks.total_fields_evaluated");
  assertHookCount(hooks.changed_fields, expectedSummary.changed_fields, "content.evaluation_hooks.changed_fields");
  assertHookCount(hooks.unchanged_fields, expectedSummary.unchanged_fields, "content.evaluation_hooks.unchanged_fields");
  assertHookCount(hooks.contradiction_count, expectedSummary.contradictions, "content.evaluation_hooks.contradiction_count");
  assertHookCount(
    hooks.evidence_accumulation_count,
    content.candidate_changes.filter((change) => change.change_type === "evidence_accumulation").length,
    "content.evaluation_hooks.evidence_accumulation_count",
  );
  assertHookCount(hooks.review_candidate_count, expectedSummary.review_candidates, "content.evaluation_hooks.review_candidate_count");

  for (const recommendation of BUILDER_RECOMMENDATIONS) {
    assertHookCount(
      hooks.recommendation_distribution[recommendation],
      expectedRecommendationDistribution[recommendation],
      `content.evaluation_hooks.recommendation_distribution.${recommendation}`,
    );
  }

  for (const stabilityClass of Object.keys(content.evaluation_hooks.stability_class_distribution)) {
    if (!validStabilityClasses.has(stabilityClass)) {
      throw new BuilderValidationError(`content.evaluation_hooks.stability_class_distribution.${stabilityClass} is invalid.`);
    }
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function requireConfidence(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireCount(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new BuilderValidationError(`${field} must be a non-negative integer.`);
  }
}

function assertHookCount(actual: unknown, expected: number, field: string): void {
  requireCount(actual, field);

  if (actual !== expected) {
    throw new BuilderValidationError(`${field} must match candidate_changes.`);
  }
}
