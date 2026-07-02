import type {
  AggregationResultArtifactContent,
  CountDistribution,
  SimilarityStatistics,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  TopicCandidate,
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import type {
  TopicAssignmentMethod,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  AGGREGATION_ASSIGNMENT_METHOD_VALUES,
} from "../cross-company-aggregation-builder/contract.js";
import {
  CANDIDATE_DISCOVERY_BUILDER_VERSION,
  CANDIDATE_DISCOVERY_VERSION,
  TOPIC_CANDIDATE_VERSION,
} from "./contract.js";
import type { CandidateDiscoveryBuilderInput } from "./types.js";

export function validateCandidateDiscoveryBuilderInput(
  input: CandidateDiscoveryBuilderInput,
): void {
  requireObject(input, "input");

  if (Object.keys(input).length > 0) {
    throw new BuilderValidationError(
      "Candidate Discovery input must be empty; Aggregation Result must be supplied as a dependency.",
    );
  }
}

export function resolveAggregationResultDependency(
  dependencies: Record<string, Artifact<unknown>>,
): Artifact<AggregationResultArtifactContent> {
  const dependencyKeys = Object.keys(dependencies);

  if (
    dependencyKeys.length !== 1
      || dependencyKeys[0] !== "aggregation_result"
  ) {
    throw new BuilderValidationError(
      "Candidate Discovery must consume only the Aggregation Result dependency.",
    );
  }

  const aggregationResult = dependencies.aggregation_result;

  if (aggregationResult === undefined) {
    throw new BuilderValidationError(
      "Candidate Discovery requires an Aggregation Result dependency.",
    );
  }

  if (aggregationResult.identity.artifact_type !== "aggregation_result") {
    throw new BuilderValidationError(
      "aggregation_result dependency must be an Aggregation Result Platform Artifact.",
    );
  }

  validateAggregationResultContent(aggregationResult.content);

  return aggregationResult as Artifact<AggregationResultArtifactContent>;
}

export function validateTopicCandidateArtifactContent(
  content: TopicCandidateArtifactContent,
  aggregationResult: AggregationResultArtifactContent,
): void {
  requireObject(content, "topic_candidate");
  requireObject(content.discovery_context, "discovery_context");

  if (
    content.discovery_context.candidate_discovery_version
      !== CANDIDATE_DISCOVERY_VERSION
  ) {
    throw new BuilderValidationError(
      "discovery_context.candidate_discovery_version is invalid.",
    );
  }

  if (
    content.discovery_context.aggregation_id
      !== aggregationResult.aggregation_context.aggregation_id
      || content.discovery_context.aggregation_version
        !== aggregationResult.aggregation_context.aggregation_version
      || content.discovery_context.aggregation_configuration_version
        !== aggregationResult.aggregation_context.aggregation_configuration_version
  ) {
    throw new BuilderValidationError(
      "discovery_context does not reconcile with the Aggregation Result.",
    );
  }

  requireNonNegativeInteger(
    content.discovery_context.candidate_count,
    "discovery_context.candidate_count",
  );

  if (!Array.isArray(content.candidates)) {
    throw new BuilderValidationError("candidates must be an array.");
  }

  if (content.discovery_context.candidate_count !== content.candidates.length) {
    throw new BuilderValidationError(
      "discovery_context.candidate_count does not reconcile with candidates.",
    );
  }

  if (content.candidates.length !== aggregationResult.topic_statistics.length) {
    throw new BuilderValidationError(
      "Candidate Discovery must produce one Topic Candidate for each topic_statistics entry.",
    );
  }

  const candidateIds = new Set<string>();
  let previousSortKey = "";

  content.candidates.forEach((candidate, index) => {
    validateTopicCandidate(candidate, index, aggregationResult);

    if (candidateIds.has(candidate.candidate_id)) {
      throw new BuilderValidationError(
        `candidates[${index}].candidate_id duplicates another Topic Candidate.`,
      );
    }

    candidateIds.add(candidate.candidate_id);

    const sortKey = [
      String(candidate.proposed_concept.registry_version).padStart(10, "0"),
      candidate.proposed_concept.proposed_topic_id,
    ].join(":");

    if (index > 0 && previousSortKey.localeCompare(sortKey) > 0) {
      throw new BuilderValidationError(
        "candidates must be deterministically ordered by registry_version and proposed_topic_id.",
      );
    }

    previousSortKey = sortKey;
  });
}

function validateAggregationResultContent(
  content: unknown,
): asserts content is AggregationResultArtifactContent {
  requireObject(content, "aggregation_result.content");
  requireObject(content.aggregation_context, "aggregation_context");
  requireNonEmptyString(
    content.aggregation_context.aggregation_id,
    "aggregation_context.aggregation_id",
  );
  requireNonEmptyString(
    content.aggregation_context.aggregation_version,
    "aggregation_context.aggregation_version",
  );
  requireNonEmptyString(
    content.aggregation_context.aggregation_configuration_version,
    "aggregation_context.aggregation_configuration_version",
  );

  if (!Array.isArray(content.topic_statistics)) {
    throw new BuilderValidationError("topic_statistics must be an array.");
  }

  const keys = new Set<string>();

  content.topic_statistics.forEach((topic, index) => {
    const field = `topic_statistics[${index}]`;
    requireNonEmptyString(topic.topic_id, `${field}.topic_id`);
    requirePositiveInteger(topic.registry_version, `${field}.registry_version`);
    requireNonNegativeInteger(topic.candidate_count, `${field}.candidate_count`);
    requireNonNegativeInteger(topic.accepted_count, `${field}.accepted_count`);
    requireNonNegativeInteger(topic.rejected_count, `${field}.rejected_count`);
    requireNonNegativeInteger(
      topic.final_assignment_count,
      `${field}.final_assignment_count`,
    );
    requireNonNegativeInteger(topic.company_count, `${field}.company_count`);
    requireNonNegativeInteger(
      topic.reporting_period_count,
      `${field}.reporting_period_count`,
    );
    requireNonNegativeInteger(topic.filing_count, `${field}.filing_count`);
    requireNonNegativeInteger(topic.theme_count, `${field}.theme_count`);
    validateMethodCounts(
      topic.assignment_method_counts,
      `${field}.assignment_method_counts`,
    );
    validateSimilarityStatistics(topic.similarity, `${field}.similarity`);

    if (topic.candidate_count !== topic.accepted_count + topic.rejected_count) {
      throw new BuilderValidationError(
        `${field}.candidate_count must equal accepted_count + rejected_count.`,
      );
    }

    const key = `${topic.registry_version}:${topic.topic_id}`;

    if (keys.has(key)) {
      throw new BuilderValidationError(
        "topic_statistics contains a duplicate topic_id and registry_version pair.",
      );
    }

    keys.add(key);
  });
}

function validateTopicCandidate(
  candidate: TopicCandidate,
  index: number,
  aggregationResult: AggregationResultArtifactContent,
): void {
  const field = `candidates[${index}]`;
  requireObject(candidate, field);
  requireNonEmptyString(candidate.candidate_id, `${field}.candidate_id`);

  if (candidate.candidate_type !== "topic_candidate") {
    throw new BuilderValidationError(`${field}.candidate_type is invalid.`);
  }

  if (candidate.candidate_version !== TOPIC_CANDIDATE_VERSION) {
    throw new BuilderValidationError(`${field}.candidate_version is invalid.`);
  }

  requireObject(candidate.proposed_concept, `${field}.proposed_concept`);
  requireNonEmptyString(
    candidate.proposed_concept.proposed_topic_id,
    `${field}.proposed_concept.proposed_topic_id`,
  );
  requirePositiveInteger(
    candidate.proposed_concept.registry_version,
    `${field}.proposed_concept.registry_version`,
  );
  validateEvidenceSummary(candidate);
  validateSupportingAggregation(candidate, field, aggregationResult);

  if (
    candidate.candidate_metadata.builder_version
      !== CANDIDATE_DISCOVERY_BUILDER_VERSION
      || candidate.candidate_metadata.candidate_discovery_version
        !== CANDIDATE_DISCOVERY_VERSION
  ) {
    throw new BuilderValidationError(
      `${field}.candidate_metadata is invalid.`,
    );
  }

  const matchingTopic = aggregationResult.topic_statistics.find(
    (topic) =>
      topic.topic_id === candidate.proposed_concept.proposed_topic_id
        && topic.registry_version === candidate.proposed_concept.registry_version,
  );

  if (matchingTopic === undefined) {
    throw new BuilderValidationError(
      `${field} does not reconcile with Aggregation Result topic_statistics.`,
    );
  }
}

function validateEvidenceSummary(candidate: TopicCandidate): void {
  const { evidence_summary: summary } = candidate;
  requireObject(summary, "evidence_summary");
  requireNonNegativeInteger(summary.candidate_count, "evidence_summary.candidate_count");
  requireNonNegativeInteger(summary.accepted_count, "evidence_summary.accepted_count");
  requireNonNegativeInteger(summary.rejected_count, "evidence_summary.rejected_count");
  requireNonNegativeInteger(
    summary.final_assignment_count,
    "evidence_summary.final_assignment_count",
  );
  requireNonNegativeInteger(summary.company_count, "evidence_summary.company_count");
  requireNonNegativeInteger(
    summary.reporting_period_count,
    "evidence_summary.reporting_period_count",
  );
  requireNonNegativeInteger(summary.filing_count, "evidence_summary.filing_count");
  requireNonNegativeInteger(summary.theme_count, "evidence_summary.theme_count");

  if (summary.candidate_count !== summary.accepted_count + summary.rejected_count) {
    throw new BuilderValidationError(
      "evidence_summary.candidate_count must equal accepted_count + rejected_count.",
    );
  }

  validateMethodCounts(
    summary.assignment_method_counts,
    "evidence_summary.assignment_method_counts",
  );
  validateSimilarityStatistics(summary.similarity, "evidence_summary.similarity");
}

function validateSupportingAggregation(
  candidate: TopicCandidate,
  field: string,
  aggregationResult: AggregationResultArtifactContent,
): void {
  const { supporting_aggregation: supportingAggregation } = candidate;
  requireObject(supportingAggregation, `${field}.supporting_aggregation`);

  if (
    supportingAggregation.aggregation_id
      !== aggregationResult.aggregation_context.aggregation_id
      || supportingAggregation.aggregation_version
        !== aggregationResult.aggregation_context.aggregation_version
      || supportingAggregation.aggregation_configuration_version
        !== aggregationResult.aggregation_context.aggregation_configuration_version
  ) {
    throw new BuilderValidationError(
      `${field}.supporting_aggregation does not reconcile with the Aggregation Result.`,
    );
  }

  if (
    supportingAggregation.registry_versions.length !== 1
      || supportingAggregation.registry_versions[0]
        !== candidate.proposed_concept.registry_version
  ) {
    throw new BuilderValidationError(
      `${field}.supporting_aggregation.registry_versions is invalid.`,
    );
  }
}

function validateMethodCounts(
  counts: CountDistribution<TopicAssignmentMethod>,
  field: string,
): void {
  requireObject(counts, field);

  for (const method of AGGREGATION_ASSIGNMENT_METHOD_VALUES) {
    requireNonNegativeInteger(counts[method], `${field}.${method}`);
  }
}

function validateSimilarityStatistics(
  statistics: SimilarityStatistics,
  field: string,
): void {
  requireObject(statistics, field);
  requireNonNegativeInteger(statistics.count, `${field}.count`);

  for (const statistic of ["average", "minimum", "maximum", "p50", "p90"] as const) {
    const value = statistics[statistic];

    if (value !== null) {
      requireScore(value, `${field}.${statistic}`);
    }
  }

  if (!Array.isArray(statistics.histogram)) {
    throw new BuilderValidationError(`${field}.histogram must be an array.`);
  }

  statistics.histogram.forEach((bucket, index) => {
    const bucketField = `${field}.histogram[${index}]`;
    requireScore(bucket.range_start, `${bucketField}.range_start`);
    requireScore(bucket.range_end, `${bucketField}.range_end`);
    requireNonNegativeInteger(bucket.count, `${bucketField}.count`);
  });
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
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

function requireScore(value: unknown, field: string): void {
  if (
    typeof value !== "number"
      || !Number.isFinite(value)
      || value < 0
      || value > 1
  ) {
    throw new BuilderValidationError(`${field} must be between 0 and 1.`);
  }
}
