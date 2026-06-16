import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  DEPTH_LEVELS,
  IMPORTANCE_LEVELS,
  UNDERSTANDING_CATEGORIES,
  UNDERSTANDING_DIRECTIONS,
} from "./contract.js";
import { buildQuarterUnderstandingDepthIndicator } from "./enrichment.js";
import { countLongitudinalReferences, countTrustUnderstandings } from "./summary.js";
import type {
  ConceptRegistryContent,
  EnrichmentInputStatus,
  QuarterUnderstandingArtifactContent,
  QuarterUnderstandingBuilderInput,
  Understanding,
} from "./types.js";

export function validateQuarterUnderstandingBuilderInput(input: QuarterUnderstandingBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
}

export function requireDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(`Missing required Quarter Understanding Builder dependency: ${dependencyName}`);
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function optionalDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> | null {
  if (artifact === undefined) {
    return null;
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function rejectForbiddenDependencies(dependencies: Record<string, Artifact<unknown> | undefined>): void {
  const forbidden = [
    "quarter_change",
    "commitment_tracking",
    "narrative_consistency",
    "accounting_stability",
    "capital_allocation_tracking",
    "filing",
    "current_filing",
    "raw_filing",
  ];

  for (const dependencyName of forbidden) {
    if (dependencies[dependencyName] !== undefined) {
      throw new BuilderDependencyError(`Quarter Understanding Builder must not consume ${dependencyName}.`);
    }
  }
}

export function validateQuarterUnderstandingArtifactContent(
  content: QuarterUnderstandingArtifactContent,
  conceptRegistry: ConceptRegistryContent | null = null,
): void {
  requireText(content.company_id, "quarter_understanding.company_id");
  requireText(content.period_id, "quarter_understanding.period_id");

  if (!Array.isArray(content.understandings)) {
    throw new BuilderValidationError("quarter_understanding.understandings must be an array.");
  }

  if (!Array.isArray(content.proposed_concepts)) {
    throw new BuilderValidationError("quarter_understanding.proposed_concepts must be an array.");
  }

  validateEnrichmentStatus(content);
  validateDepthIndicator(content);
  validateDepthConsistency(content);
  validateConfidence(content);

  for (const [index, understanding] of content.understandings.entries()) {
    validateUnderstanding(understanding, index, content, conceptRegistry);
  }

  validateEvaluationHooks(content);
}

function validateUnderstanding(
  understanding: Understanding,
  index: number,
  content: QuarterUnderstandingArtifactContent,
  conceptRegistry: ConceptRegistryContent | null,
): void {
  requireText(understanding.understanding_id, `understandings[${index}].understanding_id`);
  requireText(understanding.title, `understandings[${index}].title`);
  requireText(understanding.explanation, `understandings[${index}].explanation`);

  if (!UNDERSTANDING_CATEGORIES.includes(understanding.category)) {
    throw new BuilderValidationError(`understandings[${index}].category is invalid.`);
  }

  if (!IMPORTANCE_LEVELS.includes(understanding.importance)) {
    throw new BuilderValidationError(`understandings[${index}].importance is invalid.`);
  }

  if (!UNDERSTANDING_DIRECTIONS.includes(understanding.direction)) {
    throw new BuilderValidationError(`understandings[${index}].direction is invalid.`);
  }

  validateEvidencePackage(understanding, index, content);
  validateConceptUsage(understanding, index, content, conceptRegistry);
  validateForbiddenLanguage(understanding.title, `understandings[${index}].title`);
  validateForbiddenLanguage(understanding.explanation, `understandings[${index}].explanation`);
}

function validateEvidencePackage(
  understanding: Understanding,
  index: number,
  content: QuarterUnderstandingArtifactContent,
): void {
  const evidence = understanding.evidence_package;

  if (evidence === null || typeof evidence !== "object") {
    throw new BuilderValidationError(`understandings[${index}].evidence_package must be an object.`);
  }

  validateStringArray(evidence.signal_refs, `understandings[${index}].evidence_package.signal_refs`);
  validateStringArray(evidence.company_knowledge_refs, `understandings[${index}].evidence_package.company_knowledge_refs`);
  validateStringArray(evidence.trust_signal_refs, `understandings[${index}].evidence_package.trust_signal_refs`);
  validateStringArray(evidence.topic_refs, `understandings[${index}].evidence_package.topic_refs`);

  const totalEvidence = evidence.signal_refs.length
    + evidence.company_knowledge_refs.length
    + evidence.trust_signal_refs.length
    + evidence.topic_refs.length;

  if (totalEvidence === 0) {
    throw new BuilderValidationError(`understandings[${index}] must include evidence references.`);
  }

  if (content.depth_indicator.trust_dimension === "absent" && evidence.trust_signal_refs.length > 0) {
    throw new BuilderValidationError(`understandings[${index}] must not reference Trust Signals when trust dimension is absent.`);
  }

  if (content.depth_indicator.longitudinal_dimension === "absent" && evidence.topic_refs.length > 0) {
    throw new BuilderValidationError(`understandings[${index}] must not reference topics when longitudinal dimension is absent.`);
  }

  if (content.depth_indicator.trust_dimension === "absent" && understanding.category === "trust") {
    throw new BuilderValidationError(`understandings[${index}] must not emit trust understanding when trust dimension is absent.`);
  }
}

function validateConceptUsage(
  understanding: Understanding,
  index: number,
  content: QuarterUnderstandingArtifactContent,
  conceptRegistry: ConceptRegistryContent | null,
): void {
  if (content.enrichment_status.concept_registry.available) {
    requireText(understanding.concept_id, `understandings[${index}].concept_id`);

    const concept = conceptRegistry?.concepts?.find((candidate) =>
      candidate.concept_id === understanding.concept_id && candidate.status === "active");

    if (concept === undefined) {
      throw new BuilderValidationError(`understandings[${index}].concept_id must reference an active concept.`);
    }

    return;
  }

  if (understanding.concept_id !== undefined) {
    throw new BuilderValidationError(`understandings[${index}].concept_id must be absent without Concept Registry.`);
  }
}

function validateEnrichmentStatus(content: QuarterUnderstandingArtifactContent): void {
  if (content.enrichment_status === null || typeof content.enrichment_status !== "object") {
    throw new BuilderValidationError("quarter_understanding.enrichment_status must be an object.");
  }

  validateEnrichmentInputStatus(content.enrichment_status.trust_signals, "quarter_understanding.enrichment_status.trust_signals");
  validateEnrichmentInputStatus(content.enrichment_status.topic_evolution, "quarter_understanding.enrichment_status.topic_evolution");
  validateEnrichmentInputStatus(content.enrichment_status.concept_registry, "quarter_understanding.enrichment_status.concept_registry");
}

function validateEnrichmentInputStatus(status: EnrichmentInputStatus, field: string): void {
  if (status === null || typeof status !== "object") {
    throw new BuilderValidationError(`${field} must be an object.`);
  }

  if (typeof status.available !== "boolean") {
    throw new BuilderValidationError(`${field}.available must be boolean.`);
  }

  if (status.available) {
    requireText(status.artifact_path, `${field}.artifact_path`);

    if (!Number.isSafeInteger(status.artifact_version) || status.artifact_version === null || status.artifact_version <= 0) {
      throw new BuilderValidationError(`${field}.artifact_version must be a positive integer when available.`);
    }

    if (status.absent_reason !== null && status.absent_reason !== undefined) {
      throw new BuilderValidationError(`${field}.absent_reason must be absent when available.`);
    }

    return;
  }

  if (status.artifact_path !== null && status.artifact_path !== undefined) {
    throw new BuilderValidationError(`${field}.artifact_path must be absent when unavailable.`);
  }

  if (status.artifact_version !== null && status.artifact_version !== undefined) {
    throw new BuilderValidationError(`${field}.artifact_version must be absent when unavailable.`);
  }

  requireText(status.absent_reason, `${field}.absent_reason`);
}

function validateDepthIndicator(content: QuarterUnderstandingArtifactContent): void {
  if (content.depth_indicator === null || typeof content.depth_indicator !== "object") {
    throw new BuilderValidationError("quarter_understanding.depth_indicator must be an object.");
  }

  if (!DEPTH_LEVELS.includes(content.depth_indicator.overall)) {
    throw new BuilderValidationError("quarter_understanding.depth_indicator.overall is invalid.");
  }

  if (content.depth_indicator.trust_dimension !== "present" && content.depth_indicator.trust_dimension !== "absent") {
    throw new BuilderValidationError("quarter_understanding.depth_indicator.trust_dimension is invalid.");
  }

  if (content.depth_indicator.longitudinal_dimension !== "present"
    && content.depth_indicator.longitudinal_dimension !== "absent") {
    throw new BuilderValidationError("quarter_understanding.depth_indicator.longitudinal_dimension is invalid.");
  }
}

function validateDepthConsistency(content: QuarterUnderstandingArtifactContent): void {
  const expected = buildQuarterUnderstandingDepthIndicator(content.enrichment_status);

  if (content.depth_indicator.overall !== expected.overall
    || content.depth_indicator.trust_dimension !== expected.trust_dimension
    || content.depth_indicator.longitudinal_dimension !== expected.longitudinal_dimension) {
    throw new BuilderValidationError("quarter_understanding.depth_indicator does not match enrichment status.");
  }
}

function validateConfidence(content: QuarterUnderstandingArtifactContent): void {
  validateConfidenceValue(content.confidence.overall, "quarter_understanding.confidence.overall");
  validateConfidenceValue(content.confidence.grounding_score, "quarter_understanding.confidence.grounding_score");
  validateConfidenceValue(content.confidence.signal_utilization_score, "quarter_understanding.confidence.signal_utilization_score");
  validateConfidenceValue(content.confidence.evidence_coverage_score, "quarter_understanding.confidence.evidence_coverage_score");
  validateConfidenceValue(content.confidence.interpretation_quality_score, "quarter_understanding.confidence.interpretation_quality_score");
}

function validateEvaluationHooks(content: QuarterUnderstandingArtifactContent): void {
  if (content.evaluation_hooks.understanding_count !== content.understandings.length) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.understanding_count must match understandings.");
  }

  if (content.evaluation_hooks.signal_utilization.available_signal_count < content.evaluation_hooks.signal_utilization.used_signal_count) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks used signals cannot exceed available signals.");
  }

  if (content.evaluation_hooks.grounding.evidence_package_count
    !== content.understandings.filter((understanding) => evidenceCount(understanding) > 0).length) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.grounding.evidence_package_count must reconcile.");
  }

  if (content.evaluation_hooks.concept_usage.concept_registry_available
    !== content.enrichment_status.concept_registry.available) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks concept availability must match enrichment status.");
  }

  if (JSON.stringify(content.evaluation_hooks.depth) !== JSON.stringify(content.depth_indicator)) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.depth must match depth_indicator.");
  }

  if (JSON.stringify(content.evaluation_hooks.enrichment_status) !== JSON.stringify(content.enrichment_status)) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.enrichment_status must match enrichment_status.");
  }

  if (countTrustUnderstandings(content) > 0 && content.depth_indicator.trust_dimension === "absent") {
    throw new BuilderValidationError("quarter_understanding trust understandings require trust dimension.");
  }

  if (countLongitudinalReferences(content) > 0 && content.depth_indicator.longitudinal_dimension === "absent") {
    throw new BuilderValidationError("quarter_understanding topic references require longitudinal dimension.");
  }
}

function validateForbiddenLanguage(value: string, field: string): void {
  const forbiddenPatterns = [
    /\b(buy|sell|hold|accumulate|reduce)\b/i,
    /\b(target price|fair value|intrinsic value|margin of safety|upside|downside|valuation)\b/i,
    /\binvestor conclusion\b/i,
    /\brecommendation\b/i,
    /\bportfolio (allocation|decision)\b/i,
    /\bmanagement can be trusted\b/i,
    /\bmanagement cannot be trusted\b/i,
  ];

  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    throw new BuilderValidationError(`${field} contains forbidden investor, recommendation, valuation, or trust-verdict language.`);
  }
}

function evidenceCount(understanding: Understanding): number {
  return understanding.evidence_package.signal_refs.length
    + understanding.evidence_package.company_knowledge_refs.length
    + understanding.evidence_package.trust_signal_refs.length
    + understanding.evidence_package.topic_refs.length;
}

function validateConfidenceValue(value: unknown, field: string): void {
  if (!Number.isFinite(value) || typeof value !== "number" || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function validateStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }

  for (const item of value) {
    requireText(item, field);
  }
}
