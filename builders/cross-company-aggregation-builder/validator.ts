import type {
  AggregationResultArtifactContent,
  CountDistribution,
  SimilarityStatistics,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicAssignmentMethod,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicSignalAssignmentStatus,
  TopicSignalCandidateDecision,
  TopicSignalExecutionRecord,
  TopicSignalFinalResult,
} from "../../contracts/execution/topic-signal-execution-record.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  AGGREGATION_ASSIGNMENT_METHOD_VALUES,
  ASSIGNMENT_STATUS_VALUES,
  CANDIDATE_DECISION_VALUES,
  CROSS_COMPANY_AGGREGATION_VERSION,
} from "./contract.js";
import type { CrossCompanyAggregationBuilderInput } from "./types.js";

export function validateCrossCompanyAggregationBuilderInput(
  input: CrossCompanyAggregationBuilderInput,
): void {
  requireObject(input, "input");
  requireNonEmptyString(
    input.aggregation_configuration_version,
    "aggregation_configuration_version",
  );

  if (!Array.isArray(input.topic_signals) || input.topic_signals.length === 0) {
    throw new BuilderValidationError(
      "Cross-Company Aggregation requires at least one Topic Signal.",
    );
  }

  const signalHashes = new Set<string>();

  input.topic_signals.forEach((signal, index) => {
    validateTopicSignal(signal, `topic_signals[${index}]`);
    const signalHash = stableHash(signal);

    if (signalHashes.has(signalHash)) {
      throw new BuilderValidationError(
        `topic_signals[${index}] duplicates a consumed Topic Signal.`,
      );
    }

    signalHashes.add(signalHash);
  });
}

export function validateAggregationResultArtifactContent(
  content: AggregationResultArtifactContent,
  input: CrossCompanyAggregationBuilderInput,
): void {
  requireObject(content, "aggregation_result");
  requireObject(content.aggregation_context, "aggregation_context");
  requireNonEmptyString(
    content.aggregation_context.aggregation_id,
    "aggregation_context.aggregation_id",
  );

  if (
    content.aggregation_context.aggregation_version
      !== CROSS_COMPANY_AGGREGATION_VERSION
  ) {
    throw new BuilderValidationError(
      "aggregation_context.aggregation_version is invalid.",
    );
  }

  if (
    content.aggregation_context.aggregation_configuration_version
      !== input.aggregation_configuration_version
  ) {
    throw new BuilderValidationError(
      "aggregation_context.aggregation_configuration_version does not reconcile with input.",
    );
  }

  requireNonNegativeInteger(
    content.aggregation_context.signal_count,
    "aggregation_context.signal_count",
  );

  if (content.aggregation_context.signal_count !== input.topic_signals.length) {
    throw new BuilderValidationError(
      "aggregation_context.signal_count does not reconcile with Topic Signals.",
    );
  }

  validateRegistryContext(content);
  validateEvidenceStatistics(content.evidence_statistics);
  validateTopicStatistics(content);
}

function validateTopicSignal(
  signal: TopicSignalExecutionRecord,
  field: string,
): void {
  requireObject(signal, field);
  requireObject(signal.execution_context, `${field}.execution_context`);
  requireNonEmptyString(
    signal.execution_context.company_id,
    `${field}.execution_context.company_id`,
  );
  requireNonEmptyString(
    signal.execution_context.period_id,
    `${field}.execution_context.period_id`,
  );
  requireNonEmptyString(
    signal.execution_context.filing_id,
    `${field}.execution_context.filing_id`,
  );
  requireNonEmptyString(
    signal.execution_context.execution_id,
    `${field}.execution_context.execution_id`,
  );
  requireObject(signal.theme, `${field}.theme`);
  requireNonEmptyString(signal.theme.theme_id, `${field}.theme.theme_id`);
  requireNonEmptyString(signal.theme.theme_title, `${field}.theme.theme_title`);
  requireObject(signal.evaluation, `${field}.evaluation`);

  if (
    !Array.isArray(signal.evaluation.candidates)
    || signal.evaluation.candidates.length === 0
  ) {
    throw new BuilderValidationError(
      `${field}.evaluation.candidates must be a non-empty array.`,
    );
  }

  const acceptedTopicIds = new Set<string>();

  signal.evaluation.candidates.forEach((candidate, candidateIndex) => {
    const candidateField = `${field}.evaluation.candidates[${candidateIndex}]`;
    requireNonEmptyString(candidate.topic_id, `${candidateField}.topic_id`);
    requireScore(candidate.similarity_score, `${candidateField}.similarity_score`);
    requireAssignmentMethod(candidate.assignment_method, `${candidateField}.assignment_method`);
    requireDecision(candidate.decision, `${candidateField}.decision`);

    if (candidate.decision === "accepted") {
      acceptedTopicIds.add(candidate.topic_id);
    }
  });

  validateFinalResult(signal.final_result, acceptedTopicIds, `${field}.final_result`);
  requireObject(signal.registry_context, `${field}.registry_context`);
  requirePositiveInteger(
    signal.registry_context.registry_version,
    `${field}.registry_context.registry_version`,
  );
  requireObject(signal.execution_metadata, `${field}.execution_metadata`);
  requireNonEmptyString(
    signal.execution_metadata.embedding_model,
    `${field}.execution_metadata.embedding_model`,
  );
  requireNonEmptyString(
    signal.execution_metadata.generated_at,
    `${field}.execution_metadata.generated_at`,
  );
}

function validateFinalResult(
  finalResult: TopicSignalFinalResult,
  acceptedTopicIds: Set<string>,
  field: string,
): void {
  requireObject(finalResult, field);
  requireAssignmentStatus(finalResult.assignment_status, `${field}.assignment_status`);

  if (!Array.isArray(finalResult.final_assignments)) {
    throw new BuilderValidationError(
      `${field}.final_assignments must be an array.`,
    );
  }

  if (
    finalResult.assignment_status === "assigned"
    && finalResult.final_assignments.length === 0
  ) {
    throw new BuilderValidationError(
      `${field}.final_assignments must not be empty when assignment_status is assigned.`,
    );
  }

  if (
    finalResult.assignment_status !== "assigned"
    && finalResult.final_assignments.length > 0
  ) {
    throw new BuilderValidationError(
      `${field}.final_assignments must be empty unless assignment_status is assigned.`,
    );
  }

  const finalTopicIds = new Set<string>();

  finalResult.final_assignments.forEach((assignment, index) => {
    const assignmentField = `${field}.final_assignments[${index}]`;
    requireNonEmptyString(assignment.topic_id, `${assignmentField}.topic_id`);
    requireScore(assignment.confidence, `${assignmentField}.confidence`);
    requireAssignmentMethod(
      assignment.assignment_method,
      `${assignmentField}.assignment_method`,
    );

    if (!acceptedTopicIds.has(assignment.topic_id)) {
      throw new BuilderValidationError(
        `${assignmentField}.topic_id must be an accepted evaluation candidate.`,
      );
    }

    if (finalTopicIds.has(assignment.topic_id)) {
      throw new BuilderValidationError(
        `${assignmentField}.topic_id duplicates a final assignment.`,
      );
    }

    finalTopicIds.add(assignment.topic_id);
  });
}

function validateRegistryContext(content: AggregationResultArtifactContent): void {
  const { registry_context } = content;

  if (!Array.isArray(registry_context.registry_versions)) {
    throw new BuilderValidationError(
      "registry_context.registry_versions must be an array.",
    );
  }

  const sortedRegistryVersions = [...registry_context.registry_versions]
    .sort((left, right) => left - right);

  if (
    stableHash(registry_context.registry_versions)
      !== stableHash(sortedRegistryVersions)
  ) {
    throw new BuilderValidationError(
      "registry_context.registry_versions must be sorted.",
    );
  }

  for (const registryVersion of registry_context.registry_versions) {
    requirePositiveInteger(
      registryVersion,
      "registry_context.registry_versions[]",
    );
  }

  if (!Array.isArray(registry_context.counts_by_registry_version)) {
    throw new BuilderValidationError(
      "registry_context.counts_by_registry_version must be an array.",
    );
  }

  for (const count of registry_context.counts_by_registry_version) {
    requirePositiveInteger(
      count.registry_version,
      "registry_context.counts_by_registry_version[].registry_version",
    );
    requireNonNegativeInteger(
      count.signal_count,
      "registry_context.counts_by_registry_version[].signal_count",
    );
  }
}

function validateEvidenceStatistics(
  statistics: AggregationResultArtifactContent["evidence_statistics"],
): void {
  requireNonNegativeInteger(statistics.total_signals, "total_signals");
  requireNonNegativeInteger(statistics.theme_count, "theme_count");
  requireNonNegativeInteger(statistics.company_count, "company_count");
  requireNonNegativeInteger(statistics.reporting_period_count, "reporting_period_count");
  requireNonNegativeInteger(statistics.filing_count, "filing_count");
  validateStatusCounts(statistics.assignment_status_counts);
  validateMethodCounts(statistics.assignment_method_counts);
  validateDecisionCounts(statistics.candidate_decision_counts);
  validateSimilarityStatistics(statistics.similarity);
}

function validateTopicStatistics(content: AggregationResultArtifactContent): void {
  if (!Array.isArray(content.topic_statistics)) {
    throw new BuilderValidationError("topic_statistics must be an array.");
  }

  const keys = new Set<string>();

  for (const topic of content.topic_statistics) {
    requireNonEmptyString(topic.topic_id, "topic_statistics[].topic_id");
    requirePositiveInteger(topic.registry_version, "topic_statistics[].registry_version");
    requireNonNegativeInteger(topic.candidate_count, "topic_statistics[].candidate_count");
    requireNonNegativeInteger(topic.accepted_count, "topic_statistics[].accepted_count");
    requireNonNegativeInteger(topic.rejected_count, "topic_statistics[].rejected_count");
    requireNonNegativeInteger(
      topic.final_assignment_count,
      "topic_statistics[].final_assignment_count",
    );
    requireNonNegativeInteger(topic.company_count, "topic_statistics[].company_count");
    requireNonNegativeInteger(
      topic.reporting_period_count,
      "topic_statistics[].reporting_period_count",
    );
    requireNonNegativeInteger(topic.filing_count, "topic_statistics[].filing_count");
    requireNonNegativeInteger(topic.theme_count, "topic_statistics[].theme_count");
    validateMethodCounts(topic.assignment_method_counts);
    validateSimilarityStatistics(topic.similarity);

    if (topic.candidate_count !== topic.accepted_count + topic.rejected_count) {
      throw new BuilderValidationError(
        "topic_statistics[].candidate_count must equal accepted_count + rejected_count.",
      );
    }

    const key = `${topic.registry_version}:${topic.topic_id}`;

    if (keys.has(key)) {
      throw new BuilderValidationError(
        "topic_statistics contains a duplicate topic_id and registry_version pair.",
      );
    }

    keys.add(key);
  }
}

function validateStatusCounts(
  counts: CountDistribution<TopicSignalAssignmentStatus>,
): void {
  for (const status of ASSIGNMENT_STATUS_VALUES) {
    requireNonNegativeInteger(counts[status], `assignment_status_counts.${status}`);
  }
}

function validateMethodCounts(
  counts: CountDistribution<TopicAssignmentMethod>,
): void {
  for (const method of AGGREGATION_ASSIGNMENT_METHOD_VALUES) {
    requireNonNegativeInteger(counts[method], `assignment_method_counts.${method}`);
  }
}

function validateDecisionCounts(
  counts: CountDistribution<TopicSignalCandidateDecision>,
): void {
  for (const decision of CANDIDATE_DECISION_VALUES) {
    requireNonNegativeInteger(counts[decision], `candidate_decision_counts.${decision}`);
  }
}

function validateSimilarityStatistics(statistics: SimilarityStatistics): void {
  requireNonNegativeInteger(statistics.count, "similarity.count");

  for (const field of ["average", "minimum", "maximum", "p50", "p90"] as const) {
    const value = statistics[field];

    if (value !== null) {
      requireScore(value, `similarity.${field}`);
    }
  }

  if (!Array.isArray(statistics.histogram)) {
    throw new BuilderValidationError("similarity.histogram must be an array.");
  }

  for (const bucket of statistics.histogram) {
    requireScore(bucket.range_start, "similarity.histogram[].range_start");
    requireScore(bucket.range_end, "similarity.histogram[].range_end");
    requireNonNegativeInteger(bucket.count, "similarity.histogram[].count");
  }
}

function requireAssignmentStatus(value: unknown, field: string): void {
  if (!ASSIGNMENT_STATUS_VALUES.includes(value as TopicSignalAssignmentStatus)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

function requireDecision(value: unknown, field: string): void {
  if (!CANDIDATE_DECISION_VALUES.includes(value as TopicSignalCandidateDecision)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

function requireAssignmentMethod(value: unknown, field: string): void {
  if (!AGGREGATION_ASSIGNMENT_METHOD_VALUES.includes(value as TopicAssignmentMethod)) {
    throw new BuilderValidationError(`${field} is invalid.`);
  }
}

function requireScore(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}

function requireObject(value: unknown, field: string): void {
  if (value === null || typeof value !== "object") {
    throw new BuilderValidationError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new BuilderValidationError(`${field} must be a positive integer.`);
  }
}

function requireNonNegativeInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new BuilderValidationError(`${field} must be a non-negative integer.`);
  }
}
