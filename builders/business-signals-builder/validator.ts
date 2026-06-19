import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { DEPTH_LEVELS, SIGNAL_CATEGORIES, SIGNAL_DIRECTIONS, SIGNAL_MAGNITUDES } from "./contract.js";
import type {
  BusinessSignal,
  BusinessSignalsArtifactContent,
  BusinessSignalsBuilderInput,
  EnrichmentInputStatus,
} from "./types.js";

export function validateBusinessSignalsBuilderInput(input: BusinessSignalsBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
}

export function requireDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: string,
): Artifact<T> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(`Missing required Business Signals Builder dependency: ${dependencyName}`);
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Business Signals Builder dependency ${dependencyName} must be ${artifactType}.`,
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
      `Business Signals Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }

  return artifact as Artifact<T>;
}

export function validateBusinessSignalsArtifactContent(content: BusinessSignalsArtifactContent): void {
  requireText(content.company_id, "business_signals.company_id");
  requireText(content.period_id, "business_signals.period_id");

  if (!Array.isArray(content.signals)) {
    throw new BuilderValidationError("business_signals.signals must be an array.");
  }

  validateEnrichmentStatus(content);
  validateDepthIndicator(content);
  validateCoverageSemantics(content);

  for (const [index, signal] of content.signals.entries()) {
    validateSignal(signal, index, content);
  }

  validateSignalSummary(content);
}

function validateSignal(signal: BusinessSignal, index: number, content: BusinessSignalsArtifactContent): void {
  requireText(signal.signal_id, `signals[${index}].signal_id`);
  requireText(signal.signal_type, `signals[${index}].signal_type`);
  requireText(signal.company_id, `signals[${index}].company_id`);
  requireText(signal.period_id, `signals[${index}].period_id`);
  requireText(signal.observation, `signals[${index}].observation`);
  requireText(signal.rule_ref, `signals[${index}].rule_ref`);

  if (!SIGNAL_CATEGORIES.includes(signal.category)) {
    throw new BuilderValidationError(`signals[${index}].category is invalid.`);
  }

  if (!SIGNAL_DIRECTIONS.includes(signal.direction)) {
    throw new BuilderValidationError(`signals[${index}].direction is invalid.`);
  }

  if (!SIGNAL_MAGNITUDES.includes(signal.magnitude)) {
    throw new BuilderValidationError(`signals[${index}].magnitude is invalid.`);
  }

  requireNonEmptyStringArray(signal.evidence_refs, `signals[${index}].evidence_refs`);
  requireNonEmptyStringArray(signal.company_knowledge_refs, `signals[${index}].company_knowledge_refs`);

  if (!Number.isFinite(signal.evidence_confidence)
    || signal.evidence_confidence < 0
    || signal.evidence_confidence > 1) {
    throw new BuilderValidationError(`signals[${index}].evidence_confidence must be between 0 and 1.`);
  }

  if (!Array.isArray(signal.source_artifact_refs) || signal.source_artifact_refs.length === 0) {
    throw new BuilderValidationError(`signals[${index}].source_artifact_refs must be a non-empty array.`);
  }

  if (!signal.source_artifact_refs.some((source) => source.artifact_type === "company_knowledge")) {
    throw new BuilderValidationError(`signals[${index}] must reference Company Knowledge.`);
  }

  if (signal.rule_ref.startsWith("business_signals.movement.")
    && !signal.source_artifact_refs.some((source) => source.artifact_type === "quarter_change")) {
    throw new BuilderValidationError(`signals[${index}] movement signal must reference Quarter Change.`);
  }

  if (signal.rule_ref.startsWith("business_signals.movement.")
    && !content.enrichment_status.quarter_change.available) {
    throw new BuilderValidationError(`signals[${index}] movement signal requires Quarter Change enrichment.`);
  }

  if (signal.rule_ref.startsWith("business_signals.trend.")
    && !signal.source_artifact_refs.some((source) => source.artifact_type === "topic_evolution")) {
    throw new BuilderValidationError(`signals[${index}] trend signal must reference Topic Evolution.`);
  }

  if (signal.rule_ref.startsWith("business_signals.trend.")
    && !content.enrichment_status.topic_evolution.available) {
    throw new BuilderValidationError(`signals[${index}] trend signal requires Topic Evolution enrichment.`);
  }
}

function validateEnrichmentStatus(content: BusinessSignalsArtifactContent): void {
  if (content.enrichment_status === null || typeof content.enrichment_status !== "object") {
    throw new BuilderValidationError("business_signals.enrichment_status must be an object.");
  }

  validateEnrichmentInputStatus(
    content.enrichment_status.quarter_change,
    "business_signals.enrichment_status.quarter_change",
  );
  validateEnrichmentInputStatus(
    content.enrichment_status.topic_evolution,
    "business_signals.enrichment_status.topic_evolution",
  );

  if (content.enrichment_status.transcript_signals !== undefined) {
    validateEnrichmentInputStatus(
      content.enrichment_status.transcript_signals,
      "business_signals.enrichment_status.transcript_signals",
    );
  }

  if (content.enrichment_status.market_context !== undefined) {
    validateEnrichmentInputStatus(
      content.enrichment_status.market_context,
      "business_signals.enrichment_status.market_context",
    );
  }

  if (content.enrichment_status.industry_context !== undefined) {
    validateEnrichmentInputStatus(
      content.enrichment_status.industry_context,
      "business_signals.enrichment_status.industry_context",
    );
  }
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

    if (!Number.isSafeInteger(status.artifact_version)
      || status.artifact_version === null
      || status.artifact_version <= 0) {
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

function validateDepthIndicator(content: BusinessSignalsArtifactContent): void {
  if (content.depth_indicator === null || typeof content.depth_indicator !== "object") {
    throw new BuilderValidationError("business_signals.depth_indicator must be an object.");
  }

  if (!DEPTH_LEVELS.includes(content.depth_indicator.overall)) {
    throw new BuilderValidationError("business_signals.depth_indicator.overall is invalid.");
  }
}

function validateCoverageSemantics(content: BusinessSignalsArtifactContent): void {
  const quarterChangeAvailable = content.enrichment_status.quarter_change.available;
  const topicEvolutionAvailable = content.enrichment_status.topic_evolution.available;
  const expectedDepth = quarterChangeAvailable && topicEvolutionAvailable
    ? "full"
    : quarterChangeAvailable || topicEvolutionAvailable
      ? "standard"
      : "base";

  if (content.depth_indicator.overall !== expectedDepth) {
    throw new BuilderValidationError("business_signals.depth_indicator.overall does not match enrichment coverage.");
  }
}

function validateSignalSummary(content: BusinessSignalsArtifactContent): void {
  if (content.signal_summary.total_signals !== content.signals.length) {
    throw new BuilderValidationError("signal_summary.total_signals must match emitted signals.");
  }

  for (const category of SIGNAL_CATEGORIES) {
    const actual = content.signals.filter((signal) => signal.category === category).length;

    if (content.signal_summary.by_category[category] !== actual) {
      throw new BuilderValidationError(`signal_summary.by_category.${category} must match emitted signals.`);
    }
  }

  for (const magnitude of SIGNAL_MAGNITUDES) {
    const actual = content.signals.filter((signal) => signal.magnitude === magnitude).length;

    if (content.signal_summary.by_magnitude[magnitude] !== actual) {
      throw new BuilderValidationError(`signal_summary.by_magnitude.${magnitude} must match emitted signals.`);
    }
  }
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function requireNonEmptyStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BuilderValidationError(`${field} must be a non-empty array.`);
  }

  for (const item of value) {
    requireText(item, field);
  }
}
