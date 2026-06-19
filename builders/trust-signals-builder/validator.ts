import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderDependencyError, BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  TRUST_SIGNALS_CALIBRATION,
  TRUST_SIGNALS_CALIBRATION_VERSION,
} from "./calibration-contract.js";
import {
  DEPTH_LEVELS,
  PILLAR_ARTIFACT_TYPES,
  SIGNAL_DIRECTIONS,
  SIGNAL_LIFECYCLE_STATUSES,
  SIGNAL_SEVERITIES,
  TRUST_DIMENSIONS,
  TRUST_SIGNALS_RULE_VERSION,
  TRUST_SIGNALS_SCHEMA_VERSION,
  TRUST_SIGNAL_TYPES,
  type TrustDimension,
  type TrustPillarArtifactType,
} from "./contract.js";
import { availablePillarCount, buildMissingDimensions } from "./enrichment.js";
import { ruleByRef } from "./rules.js";
import type {
  EnrichmentInputStatus,
  TrustSignal,
  TrustSignalsArtifactContent,
  TrustSignalsBuilderInput,
} from "./types.js";

export function validateTrustSignalsBuilderInput(input: TrustSignalsBuilderInput): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.generated_at, "generated_at");
}

export function optionalPillarDependency<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
  artifactType: TrustPillarArtifactType,
  companyId: string,
  periodId: string,
): Artifact<T> | null {
  if (artifact === undefined) {
    return null;
  }

  if (artifact.identity.artifact_type !== artifactType) {
    throw new BuilderDependencyError(
      `Trust Signals Builder dependency ${dependencyName} must be ${artifactType}.`,
    );
  }
  if (artifact.identity.company_id !== companyId) {
    throw new BuilderDependencyError(
      `Trust Signals Builder dependency ${dependencyName} company must match the build target.`,
    );
  }
  if (artifact.identity.period_id !== periodId) {
    throw new BuilderDependencyError(
      `Trust Signals Builder dependency ${dependencyName} period must match the build target.`,
    );
  }

  validatePillarContentIdentity(
    artifact as Artifact<unknown>,
    artifactType,
    companyId,
    periodId,
    dependencyName,
  );

  return artifact as Artifact<T>;
}

export function validateAtLeastOnePillar(dependencies: Record<string, Artifact<unknown> | undefined>): void {
  const hasPillar = PILLAR_ARTIFACT_TYPES.some((artifactType) =>
    Object.values(dependencies).some((artifact) => artifact?.identity.artifact_type === artifactType));

  if (!hasPillar) {
    throw new BuilderDependencyError("Trust Signals Builder requires at least one trust pillar artifact.");
  }
}

export function validateTrustSignalsArtifactContent(content: TrustSignalsArtifactContent): void {
  if (content.artifact_type !== "trust_signals") {
    throw new BuilderValidationError("trust_signals.artifact_type is invalid.");
  }
  requireText(content.company, "trust_signals.company");
  requireText(content.period, "trust_signals.period");

  if (!Array.isArray(content.trust_signals)) {
    throw new BuilderValidationError("trust_signals.trust_signals must be an array.");
  }

  validateEnrichmentStatus(content);
  validateDepthIndicator(content);
  validateMissingDimensions(content);
  validateCoverageSemantics(content);

  for (const [index, signal] of content.trust_signals.entries()) {
    validateSignal(signal, index, content);
  }

  validateSummary(content);
  validateConfidence(content);
  validateEvaluationHooks(content);
  validateReplayability(content);
}

function validateSignal(signal: TrustSignal, index: number, content: TrustSignalsArtifactContent): void {
  requireText(signal.signal_id, `trust_signals[${index}].signal_id`);
  requireText(signal.company_id, `trust_signals[${index}].company_id`);
  requireText(signal.period_id, `trust_signals[${index}].period_id`);
  requireText(signal.observation, `trust_signals[${index}].observation`);
  requireText(signal.rule_ref, `trust_signals[${index}].rule_ref`);
  if (signal.company_id !== content.company || signal.period_id !== content.period) {
    throw new BuilderValidationError(
      `trust_signals[${index}] company and period must match artifact content.`,
    );
  }

  if (!TRUST_SIGNAL_TYPES.includes(signal.signal_type)) {
    throw new BuilderValidationError(`trust_signals[${index}].signal_type is invalid.`);
  }

  if (!TRUST_DIMENSIONS.includes(signal.dimension)) {
    throw new BuilderValidationError(`trust_signals[${index}].dimension is invalid.`);
  }

  if (!SIGNAL_SEVERITIES.includes(signal.severity)) {
    throw new BuilderValidationError(`trust_signals[${index}].severity is invalid.`);
  }

  if (!SIGNAL_DIRECTIONS.includes(signal.direction)) {
    throw new BuilderValidationError(`trust_signals[${index}].direction is invalid.`);
  }

  if (!PILLAR_ARTIFACT_TYPES.includes(signal.source_artifact)) {
    throw new BuilderValidationError(`trust_signals[${index}].source_artifact is invalid.`);
  }

  requireNonEmptyStringArray(signal.evidence_refs, `trust_signals[${index}].evidence_refs`);
  requireNonEmptyStringArray(signal.source_record_refs, `trust_signals[${index}].source_record_refs`);
  validateSourceArtifactRefs(signal, index);
  validateLifecycle(signal, index);
  validateConfidenceValue(signal.confidence, `trust_signals[${index}].confidence`);
  validateRuleOwnership(signal, index);
  validateDimensionAvailability(signal, index, content);
  validateForbiddenLanguage(signal.observation, `trust_signals[${index}].observation`);
}

function validateSourceArtifactRefs(signal: TrustSignal, index: number): void {
  if (!Array.isArray(signal.source_artifact_refs) || signal.source_artifact_refs.length === 0) {
    throw new BuilderValidationError(`trust_signals[${index}].source_artifact_refs must be a non-empty array.`);
  }

  if (!signal.source_artifact_refs.some((source) => source.artifact_type === signal.source_artifact)) {
    throw new BuilderValidationError(`trust_signals[${index}] must reference its source artifact.`);
  }

  for (const [sourceIndex, source] of signal.source_artifact_refs.entries()) {
    requireText(source.artifact_id, `trust_signals[${index}].source_artifact_refs[${sourceIndex}].artifact_id`);

    if (!PILLAR_ARTIFACT_TYPES.includes(source.artifact_type)) {
      throw new BuilderValidationError(`trust_signals[${index}].source_artifact_refs[${sourceIndex}].artifact_type is invalid.`);
    }

    if (!Number.isSafeInteger(source.artifact_version) || source.artifact_version <= 0) {
      throw new BuilderValidationError(`trust_signals[${index}].source_artifact_refs[${sourceIndex}].artifact_version must be a positive integer.`);
    }
  }
}

function validateLifecycle(signal: TrustSignal, index: number): void {
  if (signal.lifecycle === null || typeof signal.lifecycle !== "object") {
    throw new BuilderValidationError(`trust_signals[${index}].lifecycle must be an object.`);
  }

  if (!SIGNAL_LIFECYCLE_STATUSES.includes(signal.lifecycle.status)) {
    throw new BuilderValidationError(`trust_signals[${index}].lifecycle.status is invalid.`);
  }

  requireText(signal.lifecycle.first_seen_period, `trust_signals[${index}].lifecycle.first_seen_period`);
  requireText(signal.lifecycle.last_seen_period, `trust_signals[${index}].lifecycle.last_seen_period`);
}

function validateRuleOwnership(signal: TrustSignal, index: number): void {
  const rule = ruleByRef(signal.rule_ref);

  if (rule === null) {
    throw new BuilderValidationError(`trust_signals[${index}].rule_ref is unknown.`);
  }

  if (rule.signal_type !== signal.signal_type
    || rule.dimension !== signal.dimension
    || rule.source_artifact !== signal.source_artifact
    || rule.severity !== signal.severity
    || rule.direction !== signal.direction) {
    throw new BuilderValidationError(`trust_signals[${index}] does not match its rule definition.`);
  }
}

function validateDimensionAvailability(
  signal: TrustSignal,
  index: number,
  content: TrustSignalsArtifactContent,
): void {
  const status = statusForSignal(signal, content);

  if (!status.available) {
    throw new BuilderValidationError(`trust_signals[${index}] cannot emit ${signal.dimension} without owning pillar.`);
  }
  if (
    !signal.source_artifact_refs.some(
      (source) =>
        source.artifact_id === status.artifact_ref
        && source.artifact_version === status.artifact_version,
    )
  ) {
    throw new BuilderValidationError(
      `trust_signals[${index}] source artifact does not match enrichment status.`,
    );
  }
}

function statusForSignal(signal: TrustSignal, content: TrustSignalsArtifactContent): EnrichmentInputStatus {
  switch (signal.source_artifact) {
    case "commitment_tracking":
      return content.enrichment_status.commitment_tracking;
    case "narrative_consistency":
      return content.enrichment_status.narrative_consistency;
    case "accounting_stability":
      return content.enrichment_status.accounting_stability;
    case "capital_allocation_tracking":
      return content.enrichment_status.capital_allocation_tracking;
  }
}

function validateEnrichmentStatus(content: TrustSignalsArtifactContent): void {
  if (content.enrichment_status === null || typeof content.enrichment_status !== "object") {
    throw new BuilderValidationError("trust_signals.enrichment_status must be an object.");
  }

  validateEnrichmentInputStatus(content.enrichment_status.commitment_tracking, "trust_signals.enrichment_status.commitment_tracking");
  validateEnrichmentInputStatus(content.enrichment_status.narrative_consistency, "trust_signals.enrichment_status.narrative_consistency");
  validateEnrichmentInputStatus(content.enrichment_status.accounting_stability, "trust_signals.enrichment_status.accounting_stability");
  validateEnrichmentInputStatus(content.enrichment_status.capital_allocation_tracking, "trust_signals.enrichment_status.capital_allocation_tracking");

  if (availablePillarCount(content.enrichment_status) === 0) {
    throw new BuilderValidationError("trust_signals requires at least one available trust pillar.");
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

function validateDepthIndicator(content: TrustSignalsArtifactContent): void {
  if (content.depth_indicator === null || typeof content.depth_indicator !== "object") {
    throw new BuilderValidationError("trust_signals.depth_indicator must be an object.");
  }

  if (!DEPTH_LEVELS.includes(content.depth_indicator.overall)) {
    throw new BuilderValidationError("trust_signals.depth_indicator.overall is invalid.");
  }

  validateDimensionDepth(content.depth_indicator.commitment_dimension, "commitment_dimension");
  validateDimensionDepth(content.depth_indicator.narrative_dimension, "narrative_dimension");
  validateDimensionDepth(content.depth_indicator.explanation_dimension, "explanation_dimension");
  validateDimensionDepth(content.depth_indicator.accounting_dimension, "accounting_dimension");
  validateDimensionDepth(content.depth_indicator.capital_allocation_dimension, "capital_allocation_dimension");
}

function validateDimensionDepth(value: unknown, field: string): void {
  if (value !== "present" && value !== "absent") {
    throw new BuilderValidationError(`trust_signals.depth_indicator.${field} is invalid.`);
  }
}

function validateCoverageSemantics(content: TrustSignalsArtifactContent): void {
  const availableCount = availablePillarCount(content.enrichment_status);
  const expectedDepth = availableCount === TRUST_SIGNALS_CALIBRATION.SUPPORTED_PILLAR_COUNT
    ? "full"
    : availableCount >= TRUST_SIGNALS_CALIBRATION.STANDARD_DEPTH_MIN_PILLAR_COUNT ? "standard" : "base";

  if (content.depth_indicator.overall !== expectedDepth) {
    throw new BuilderValidationError("trust_signals.depth_indicator.overall does not match pillar coverage.");
  }

  validateDepthMatchesStatus(content.depth_indicator.commitment_dimension, content.enrichment_status.commitment_tracking, "commitment_dimension");
  validateDepthMatchesStatus(content.depth_indicator.narrative_dimension, content.enrichment_status.narrative_consistency, "narrative_dimension");
  validateDepthMatchesStatus(content.depth_indicator.explanation_dimension, content.enrichment_status.narrative_consistency, "explanation_dimension");
  validateDepthMatchesStatus(content.depth_indicator.accounting_dimension, content.enrichment_status.accounting_stability, "accounting_dimension");
  validateDepthMatchesStatus(content.depth_indicator.capital_allocation_dimension, content.enrichment_status.capital_allocation_tracking, "capital_allocation_dimension");
}

function validateDepthMatchesStatus(value: "present" | "absent", status: EnrichmentInputStatus, field: string): void {
  const expected = status.available ? "present" : "absent";

  if (value !== expected) {
    throw new BuilderValidationError(`trust_signals.depth_indicator.${field} does not match enrichment status.`);
  }
}

function validateMissingDimensions(content: TrustSignalsArtifactContent): void {
  if (!Array.isArray(content.missing_dimensions)) {
    throw new BuilderValidationError("trust_signals.missing_dimensions must be an array.");
  }

  for (const dimension of content.missing_dimensions) {
    if (!TRUST_DIMENSIONS.includes(dimension)) {
      throw new BuilderValidationError("trust_signals.missing_dimensions contains invalid dimension.");
    }
  }

  const expected = buildMissingDimensions(content.enrichment_status);

  if (normalizeDimensions(content.missing_dimensions) !== normalizeDimensions(expected)) {
    throw new BuilderValidationError("trust_signals.missing_dimensions does not match missing pillar dimensions.");
  }
}

function validateSummary(content: TrustSignalsArtifactContent): void {
  if (content.summary.total_signals !== content.trust_signals.length) {
    throw new BuilderValidationError("trust_signals.summary.total_signals must match emitted signals.");
  }

  if (content.summary.positive_signals !== countDirection(content, "positive")) {
    throw new BuilderValidationError("trust_signals.summary.positive_signals must match emitted signals.");
  }

  if (content.summary.negative_signals !== countDirection(content, "negative")) {
    throw new BuilderValidationError("trust_signals.summary.negative_signals must match emitted signals.");
  }

  if (content.summary.neutral_signals !== countDirection(content, "neutral")) {
    throw new BuilderValidationError("trust_signals.summary.neutral_signals must match emitted signals.");
  }

  if (content.summary.high_severity_signals !== content.trust_signals.filter((signal) => signal.severity === "high").length) {
    throw new BuilderValidationError("trust_signals.summary.high_severity_signals must match emitted signals.");
  }
}

function validateConfidence(content: TrustSignalsArtifactContent): void {
  validateConfidenceValue(content.confidence.overall, "trust_signals.confidence.overall");
  validateConfidenceValue(content.confidence.source_data_confidence, "trust_signals.confidence.source_data_confidence");
  validateConfidenceValue(content.confidence.rule_evaluation_confidence, "trust_signals.confidence.rule_evaluation_confidence");
  validateConfidenceValue(content.confidence.evidence_completeness_score, "trust_signals.confidence.evidence_completeness_score");
}

function validateEvaluationHooks(content: TrustSignalsArtifactContent): void {
  if (content.evaluation_hooks.available_pillar_count !== availablePillarCount(content.enrichment_status)) {
    throw new BuilderValidationError("trust_signals.evaluation_hooks.available_pillar_count must match enrichment status.");
  }

  if (content.evaluation_hooks.emitted_signal_count !== content.trust_signals.length) {
    throw new BuilderValidationError("trust_signals.evaluation_hooks.emitted_signal_count must match emitted signals.");
  }

  if (content.evaluation_hooks.missing_dimension_count !== content.missing_dimensions.length) {
    throw new BuilderValidationError("trust_signals.evaluation_hooks.missing_dimension_count must match missing dimensions.");
  }

  if (!Number.isSafeInteger(content.evaluation_hooks.rule_count) || content.evaluation_hooks.rule_count <= 0) {
    throw new BuilderValidationError("trust_signals.evaluation_hooks.rule_count must be a positive integer.");
  }
}

function validateReplayability(content: TrustSignalsArtifactContent): void {
  const replay = content.replayability_metadata;
  if (
    replay.schema_version !== TRUST_SIGNALS_SCHEMA_VERSION
    || replay.calibration_version !== TRUST_SIGNALS_CALIBRATION_VERSION
    || replay.rule_version !== TRUST_SIGNALS_RULE_VERSION
  ) {
    throw new BuilderValidationError(
      "trust_signals.replayability_metadata versions are invalid.",
    );
  }
  requireText(
    replay.generated_at,
    "trust_signals.replayability_metadata.generated_at",
  );
  if (
    replay.source_artifact_references.length
      !== replay.source_artifact_versions.length
    || replay.source_artifact_versions.some(
      (version) => !Number.isSafeInteger(version) || version <= 0,
    )
  ) {
    throw new BuilderValidationError(
      "Trust Signals replayability source references and versions must align.",
    );
  }

  requireStringArray(
    replay.source_artifact_references,
    "trust_signals.replayability_metadata.source_artifact_references",
  );
  requireStringArray(
    replay.source_record_references,
    "trust_signals.replayability_metadata.source_record_references",
  );
  requireStringArray(
    replay.evidence_references,
    "trust_signals.replayability_metadata.evidence_references",
  );

  const sourcePairs = Object.values(content.enrichment_status)
    .filter((status) => status.available)
    .map((status) => ({
      ref: status.artifact_ref!,
      version: status.artifact_version!,
    }))
    .sort(
    (left, right) =>
      left.ref.localeCompare(right.ref) || left.version - right.version,
  );
  assertStringArraysEqual(
    replay.source_artifact_references,
    sourcePairs.map(({ ref }) => ref),
    "Replayability source artifact references",
  );
  if (
    replay.source_artifact_versions.some(
      (version, index) => version !== sourcePairs[index]?.version,
    )
  ) {
    throw new BuilderValidationError(
      "Replayability source artifact versions do not reconcile.",
    );
  }
  assertStringArraysEqual(
    replay.source_record_references,
    sortedUnique(
      content.trust_signals.flatMap((signal) => signal.source_record_refs),
    ),
    "Replayability source record references",
  );
  assertStringArraysEqual(
    replay.evidence_references,
    sortedUnique(
      content.trust_signals.flatMap((signal) => signal.evidence_refs),
    ),
    "Replayability evidence references",
  );
  if (
    JSON.stringify(replay.enrichment_status)
      !== JSON.stringify(content.enrichment_status)
    || JSON.stringify(replay.depth_indicators)
      !== JSON.stringify(content.depth_indicator)
    || JSON.stringify(replay.evaluation_hooks)
      !== JSON.stringify(content.evaluation_hooks)
  ) {
    throw new BuilderValidationError(
      "Trust Signals replayability metadata does not reconcile.",
    );
  }
}

function validateForbiddenLanguage(value: string, field: string): void {
  const forbiddenPatterns = [
    /\bmanagement (appears|is|seems|looks) (un)?reliable\b/i,
    /\b(can|cannot) management be trusted\b/i,
    /\btrust verdict\b/i,
    /\bcredibility (assessment|rating|score)\b/i,
    /\b(buy|sell|hold|accumulate|reduce)\b/i,
    /\b(target price|fair value|intrinsic value|margin of safety|upside|downside|valuation)\b/i,
    /\binvestor conclusion\b/i,
  ];

  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    throw new BuilderValidationError(`${field} contains forbidden interpretive or investor-facing language.`);
  }
}

function validateConfidenceValue(value: unknown, field: string): void {
  if (!Number.isFinite(value) || typeof value !== "number" || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function countDirection(content: TrustSignalsArtifactContent, direction: string): number {
  return content.trust_signals.filter((signal) => signal.direction === direction).length;
}

function normalizeDimensions(dimensions: TrustDimension[]): string {
  return [...dimensions].sort().join("|");
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

function requireStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new BuilderValidationError(`${field} must be an array.`);
  }
  for (const item of value) {
    requireText(item, field);
  }
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function assertStringArraysEqual(
  actual: string[],
  expected: string[],
  field: string,
): void {
  if (
    actual.length !== expected.length
    || actual.some((value, index) => value !== expected[index])
  ) {
    throw new BuilderValidationError(`${field} do not reconcile.`);
  }
}

function validatePillarContentIdentity(
  artifact: Artifact<unknown>,
  artifactType: TrustPillarArtifactType,
  companyId: string,
  periodId: string,
  dependencyName: string,
): void {
  const content = artifact.content as Record<string, unknown>;
  const contentCompany = artifactType === "capital_allocation_tracking"
    ? content.company_id
    : content.company;
  const contentPeriod = artifactType === "capital_allocation_tracking"
    ? content.period_id
    : content.period;

  if (contentCompany !== companyId || contentPeriod !== periodId) {
    throw new BuilderDependencyError(
      `Trust Signals Builder dependency ${dependencyName} content identity must match the build target.`,
    );
  }
}
