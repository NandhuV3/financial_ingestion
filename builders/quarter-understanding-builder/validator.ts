import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { TRUST_DIMENSIONS, type TrustDimension } from "../trust-signals-builder/contract.js";
import type { TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import { buildQuarterUnderstandingConfidence } from "./confidence.js";
import {
  DEPTH_LEVELS,
  IMPORTANCE_LEVELS,
  QUARTER_UNDERSTANDING_BUILDER_VERSION,
  QUARTER_UNDERSTANDING_CALIBRATION_CONTRACT_VERSION,
  UNDERSTANDING_CATEGORIES,
  UNDERSTANDING_DIRECTIONS,
} from "./contract.js";
import { buildQuarterUnderstandingDepthIndicator } from "./enrichment.js";
import { buildQuarterUnderstandingOutputHash } from "./replayability.js";
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
  companyId: string,
  periodId: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(`Missing required Quarter Understanding Builder dependency: ${dependencyName}`);
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  validateDependencyIdentity(artifact, dependencyName, companyId, periodId);

  return artifact as Artifact<T>;
}

export function optionalDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
  companyId: string,
  periodId: string,
): Artifact<T> | null {
  if (artifact === undefined) {
    return null;
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  validateDependencyIdentity(artifact, dependencyName, companyId, periodId);

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
  trustSignals: TrustSignalsArtifactContent | null = null,
): void {
  requireText(content.company_id, "quarter_understanding.company_id");
  requireText(content.period_id, "quarter_understanding.period_id");

  if (!Array.isArray(content.understandings)) {
    throw new BuilderValidationError("quarter_understanding.understandings must be an array.");
  }

  if (!Array.isArray(content.proposed_concepts)) {
    throw new BuilderValidationError("quarter_understanding.proposed_concepts must be an array.");
  }

  for (const [index, proposedConcept] of content.proposed_concepts.entries()) {
    validateProposedConcept(proposedConcept, index);
  }

  validateEnrichmentStatus(content);
  validateDepthIndicator(content);
  validateDepthConsistency(content);
  validateLimitations(content, trustSignals);
  validateConfidence(content);

  for (const [index, understanding] of content.understandings.entries()) {
    validateUnderstanding(understanding, index, content, conceptRegistry);
  }

  validateEvaluationHooks(content);
  validateReplayabilityMetadata(content);
}

function validateProposedConcept(
  proposedConcept: QuarterUnderstandingArtifactContent["proposed_concepts"][number],
  index: number,
): void {
  requireText(proposedConcept.proposed_concept_id, `proposed_concepts[${index}].proposed_concept_id`);
  requireText(proposedConcept.title, `proposed_concepts[${index}].title`);
  requireText(proposedConcept.description, `proposed_concepts[${index}].description`);
  requireText(proposedConcept.rationale, `proposed_concepts[${index}].rationale`);
  validateStringArray(proposedConcept.evidence_refs, `proposed_concepts[${index}].evidence_refs`);
  validateForbiddenLanguage(proposedConcept.title, `proposed_concepts[${index}].title`);
  validateForbiddenLanguage(proposedConcept.description, `proposed_concepts[${index}].description`);
  validateForbiddenLanguage(proposedConcept.rationale, `proposed_concepts[${index}].rationale`);
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
    requireText(status.artifact_ref, `${field}.artifact_ref`);

    if (!Number.isSafeInteger(status.artifact_version) || status.artifact_version === null || status.artifact_version <= 0) {
      throw new BuilderValidationError(`${field}.artifact_version must be a positive integer when available.`);
    }

    if (status.absent_reason !== null && status.absent_reason !== undefined) {
      throw new BuilderValidationError(`${field}.absent_reason must be absent when available.`);
    }

    return;
  }

  if (status.artifact_ref !== null && status.artifact_ref !== undefined) {
    throw new BuilderValidationError(`${field}.artifact_ref must be absent when unavailable.`);
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

function validateLimitations(
  content: QuarterUnderstandingArtifactContent,
  trustSignals: TrustSignalsArtifactContent | null,
): void {
  if (content.limitations === null || typeof content.limitations !== "object") {
    throw new BuilderValidationError("quarter_understanding.limitations must be an object.");
  }

  const gaps = content.limitations.trust_dimension_gaps;

  if (!Array.isArray(gaps)) {
    throw new BuilderValidationError("quarter_understanding.limitations.trust_dimension_gaps must be an array.");
  }

  for (const gap of gaps) {
    if (!TRUST_DIMENSIONS.includes(gap)) {
      throw new BuilderValidationError("quarter_understanding.limitations.trust_dimension_gaps contains invalid trust dimension.");
    }
  }

  const expected = content.enrichment_status.trust_signals.available
    ? trustSignals?.missing_dimensions ?? gaps
    : [...TRUST_DIMENSIONS];

  if (normalizeTrustDimensions(gaps) !== normalizeTrustDimensions(expected)) {
    throw new BuilderValidationError("quarter_understanding.limitations.trust_dimension_gaps does not match trust coverage.");
  }
}

function validateConfidence(content: QuarterUnderstandingArtifactContent): void {
  validateConfidenceValue(content.confidence.overall, "quarter_understanding.confidence.overall");
  validateConfidenceValue(content.confidence.grounding_score, "quarter_understanding.confidence.grounding_score");
  validateConfidenceValue(content.confidence.signal_utilization_score, "quarter_understanding.confidence.signal_utilization_score");
  validateConfidenceValue(content.confidence.evidence_coverage_score, "quarter_understanding.confidence.evidence_coverage_score");
  validateConfidenceValue(content.confidence.interpretation_quality_score, "quarter_understanding.confidence.interpretation_quality_score");

  const expected = buildQuarterUnderstandingConfidence({
    understandings: content.understandings,
    availableSignalCount:
      content.evaluation_hooks.signal_utilization.available_signal_count,
    enrichmentStatus: content.enrichment_status,
  });

  if (!sameRecord(content.confidence, expected)) {
    throw new BuilderValidationError(
      "quarter_understanding.confidence does not match builder-owned confidence calculation.",
    );
  }
}

function normalizeTrustDimensions(dimensions: TrustDimension[]): string {
  return [...dimensions].sort().join("|");
}

function validateEvaluationHooks(content: QuarterUnderstandingArtifactContent): void {
  requireText(
    content.evaluation_hooks.prompt_version,
    "quarter_understanding.evaluation_hooks.prompt_version",
  );
  requireText(
    content.evaluation_hooks.model_version,
    "quarter_understanding.evaluation_hooks.model_version",
  );

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

  if (!sameRecord(content.evaluation_hooks.depth, content.depth_indicator)) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.depth must match depth_indicator.");
  }

  if (!sameRecord(content.evaluation_hooks.enrichment_status, content.enrichment_status)) {
    throw new BuilderValidationError("quarter_understanding.evaluation_hooks.enrichment_status must match enrichment_status.");
  }

  if (countTrustUnderstandings(content) > 0 && content.depth_indicator.trust_dimension === "absent") {
    throw new BuilderValidationError("quarter_understanding trust understandings require trust dimension.");
  }

  if (countLongitudinalReferences(content) > 0 && content.depth_indicator.longitudinal_dimension === "absent") {
    throw new BuilderValidationError("quarter_understanding topic references require longitudinal dimension.");
  }
}

function validateReplayabilityMetadata(
  content: QuarterUnderstandingArtifactContent,
): void {
  const replay = content.replayability_metadata;

  if (replay === null || typeof replay !== "object") {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata must be an object.",
    );
  }

  requireText(
    replay.prompt_lineage.prompt_id,
    "quarter_understanding.replayability_metadata.prompt_lineage.prompt_id",
  );
  requireText(
    replay.prompt_lineage.prompt_version,
    "quarter_understanding.replayability_metadata.prompt_lineage.prompt_version",
  );
  requireText(
    replay.prompt_lineage.model_version,
    "quarter_understanding.replayability_metadata.prompt_lineage.model_version",
  );
  requireText(
    replay.prompt_version,
    "quarter_understanding.replayability_metadata.prompt_version",
  );
  requireText(
    replay.model_version,
    "quarter_understanding.replayability_metadata.model_version",
  );
  requireText(
    replay.input_hash,
    "quarter_understanding.replayability_metadata.input_hash",
  );
  requireText(
    replay.output_hash,
    "quarter_understanding.replayability_metadata.output_hash",
  );

  if (
    replay.prompt_lineage.prompt_version !== replay.prompt_version
    || replay.prompt_lineage.model_version !== replay.model_version
    || replay.prompt_version !== content.evaluation_hooks.prompt_version
    || replay.model_version !== content.evaluation_hooks.model_version
  ) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata prompt/model versions do not reconcile.",
    );
  }

  const expectedConceptVersion =
    content.enrichment_status.concept_registry.available
      ? String(content.enrichment_status.concept_registry.artifact_version)
      : null;

  if (replay.concept_registry_version !== expectedConceptVersion) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata concept registry version does not reconcile.",
    );
  }

  if (!sameRecord(replay.evaluation_hooks, content.evaluation_hooks)) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata evaluation hooks do not reconcile.",
    );
  }

  if (!sameRecord(replay.enrichment_status, content.enrichment_status)) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata enrichment status does not reconcile.",
    );
  }

  if (!sameRecord(replay.depth_indicators, content.depth_indicator)) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata depth indicators do not reconcile.",
    );
  }

  if (replay.builder_version !== QUARTER_UNDERSTANDING_BUILDER_VERSION) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata builder version is invalid.",
    );
  }

  if (
    replay.calibration_contract_version
    !== QUARTER_UNDERSTANDING_CALIBRATION_CONTRACT_VERSION
  ) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata calibration contract version is invalid.",
    );
  }

  const { replayability_metadata: _replayability, ...contentWithoutReplayability } =
    content;
  const expectedOutputHash =
    buildQuarterUnderstandingOutputHash(contentWithoutReplayability);

  if (replay.output_hash !== expectedOutputHash) {
    throw new BuilderValidationError(
      "quarter_understanding.replayability_metadata output hash does not reconcile.",
    );
  }
}

function validateDependencyIdentity(
  artifact: Artifact<unknown>,
  dependencyName: string,
  companyId: string,
  periodId: string,
): void {
  if (artifact.identity.company_id !== companyId) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} company does not match build target.`,
    );
  }

  if (artifact.identity.period_id !== periodId) {
    throw new BuilderDependencyError(
      `Quarter Understanding Builder dependency ${dependencyName} period does not match build target.`,
    );
  }

  if (artifact.content !== null && typeof artifact.content === "object") {
    const content = artifact.content as Record<string, unknown>;
    const contentCompany = content.company_id ?? content.company;
    const contentPeriod = content.period_id ?? content.period;

    if (contentCompany !== undefined && contentCompany !== companyId) {
      throw new BuilderDependencyError(
        `Quarter Understanding Builder dependency ${dependencyName} content company does not match build target.`,
      );
    }

    if (contentPeriod !== undefined && contentPeriod !== periodId) {
      throw new BuilderDependencyError(
        `Quarter Understanding Builder dependency ${dependencyName} content period does not match build target.`,
      );
    }
  }
}

function validateForbiddenLanguage(value: string, field: string): void {
  const forbiddenPatterns = [
    /\bshould\s+(buy|sell|hold)\b/i,
    /\b(buy|sell|hold|accumulate|reduce)\b/i,
    /\b(target price|target prices|price target|price targets)\b/i,
    /\b(expected return|expected returns)\b/i,
    /\b(fair value|intrinsic value|margin of safety|upside|downside|valuation)\b/i,
    /\bvaluation recommendation\b/i,
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

function sameRecord(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
