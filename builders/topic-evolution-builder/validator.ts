import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { isDeepStrictEqual } from "node:util";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import type {
  TopicAssignment,
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import {
  TOPIC_EVOLUTION_HISTORY_REASONS,
  TOPIC_EVOLUTION_HISTORY_STATES,
  TOPIC_EVOLUTION_TYPES,
} from "../../contracts/artifacts/topic-evolution-artifact-content.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import { calculateTopicEvolutionConfidence } from "./confidence.js";
import { historicalTopicAssignmentDependencyKey } from "./contract.js";
import { buildTopicEvolutions } from "./evolution.js";
import type {
  TopicEvolutionArtifactContent,
  TopicEvolutionBuilderDependencies,
  TopicEvolutionBuilderInput,
  TopicPeriodObservation,
} from "./types.js";

export function validateTopicEvolutionBuilderInput(
  input: TopicEvolutionBuilderInput,
): void {
  requireText(input.company_id, "company_id");
  requireText(input.period_id, "period_id");
  requireText(input.filing_id, "filing_id");

  if (!Array.isArray(input.historical_periods)) {
    throw new BuilderValidationError("historical_periods must be an array.");
  }

  const uniquePeriods = new Set(input.historical_periods);

  if (uniquePeriods.size !== input.historical_periods.length) {
    throw new BuilderValidationError(
      "historical_periods must contain unique periods.",
    );
  }

  const sortedPeriods = [...input.historical_periods].sort();

  if (
    input.historical_periods.some((period, index) =>
      period !== sortedPeriods[index])
  ) {
    throw new BuilderValidationError(
      "historical_periods must use chronological ordering.",
    );
  }

  for (const [index, period] of input.historical_periods.entries()) {
    requireText(period, `historical_periods[${index}]`);

    if (period >= input.period_id) {
      throw new BuilderValidationError(
        "Historical periods must precede the current target period.",
      );
    }
  }
}

export function resolveTopicEvolutionDependencies(
  dependencies: Record<string, Artifact<unknown>>,
  input: TopicEvolutionBuilderInput,
): TopicEvolutionBuilderDependencies {
  const current = requireTopicAssignmentArtifact(
    dependencies.current_topic_assignments,
    input.company_id,
    input.period_id,
    "current_topic_assignments",
  );
  const historical = input.historical_periods.map((period) =>
    requireTopicAssignmentArtifact(
      dependencies[historicalTopicAssignmentDependencyKey(period)],
      input.company_id,
      period,
      historicalTopicAssignmentDependencyKey(period),
    ));

  return {
    current_topic_assignments: current,
    historical_topic_assignments: historical,
  };
}

export function buildTopicObservations(
  artifact: Artifact<TopicAssignmentArtifactContent>,
): Map<string, TopicPeriodObservation> {
  const assignmentsByTopic = new Map<string, TopicAssignment[]>();

  for (const assignment of artifact.content.assignments) {
    const existing = assignmentsByTopic.get(assignment.topic_id) ?? [];
    existing.push(assignment);
    assignmentsByTopic.set(assignment.topic_id, existing);
  }

  return new Map(
    [...assignmentsByTopic.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([topicId, assignments]) => [
        topicId,
        {
          period: artifact.content.period_id,
          assignment_ids: assignments
            .map(({ assignment_id }) => assignment_id)
            .sort((left, right) => left.localeCompare(right)),
          theme_summaries: assignments
            .map(({ theme_summary }) => theme_summary)
            .sort((left, right) => left.localeCompare(right)),
          assignment_confidences: assignments
            .map(({ confidence }) => confidence),
        },
      ]),
  );
}

export function validateTopicEvolutionArtifactContent(
  content: TopicEvolutionArtifactContent,
  input: TopicEvolutionBuilderInput,
  dependencies: TopicEvolutionBuilderDependencies,
): void {
  if (
    content.company_id !== input.company_id
      || content.period_id !== input.period_id
      || content.filing_id !== input.filing_id
  ) {
    throw new BuilderValidationError(
      "Topic Evolution content identity must match the build target.",
    );
  }

  requireText(content.assignment_version, "assignment_version");
  validateRegistryVersions(content.registry_versions, dependencies);
  validateHistory(content, input);
  validateTopicRecords(content);

  const expectedTopics = input.historical_periods.length === 0
    ? []
    : buildTopicEvolutions(
      dependencies.historical_topic_assignments.map(({ content: item }) =>
        item.period_id),
      dependencies.current_topic_assignments.content.period_id,
      dependencies.historical_topic_assignments.map((artifact) =>
        buildTopicObservations(artifact)),
      buildTopicObservations(dependencies.current_topic_assignments),
    );

  if (!isDeepStrictEqual(content.topics, expectedTopics)) {
    throw new BuilderValidationError(
      "Topic Evolution classifications do not reconcile with Topic Assignments.",
    );
  }

  const expectedConfidence = calculateTopicEvolutionConfidence(expectedTopics);

  if (!isDeepStrictEqual(content.confidence, expectedConfidence)) {
    throw new BuilderValidationError(
      "Topic Evolution confidence does not reconcile with classifications.",
    );
  }
}

function validateHistory(
  content: TopicEvolutionArtifactContent,
  input: TopicEvolutionBuilderInput,
): void {
  if (!TOPIC_EVOLUTION_HISTORY_STATES.includes(content.history.history_state)) {
    throw new BuilderValidationError(
      "Topic Evolution history_state is invalid.",
    );
  }

  if (
    content.history.reason !== null
      && !TOPIC_EVOLUTION_HISTORY_REASONS.includes(content.history.reason)
  ) {
    throw new BuilderValidationError("Topic Evolution history reason is invalid.");
  }

  if (!content.history.requires_previous_period) {
    throw new BuilderValidationError(
      "Topic Evolution must declare requires_previous_period.",
    );
  }

  if (input.historical_periods.length === 0) {
    if (
      content.history.history_state !== "FIRST_FILING"
        || content.history.reason !== "FIRST_FILING"
        || content.history.comparison_performed
        || content.topics.length !== 0
    ) {
      throw new BuilderValidationError(
        "First-period Topic Evolution content is inconsistent.",
      );
    }

    return;
  }

  if (
    content.history.history_state !== "HISTORY_AVAILABLE"
      || content.history.reason !== null
      || !content.history.comparison_performed
  ) {
    throw new BuilderValidationError(
      "Topic Evolution history metadata must indicate available history.",
    );
  }
}

function validateTopicRecords(content: TopicEvolutionArtifactContent): void {
  const recordKeys = new Set<string>();

  for (const [index, topic] of content.topics.entries()) {
    requireText(topic.topic_id, `topics[${index}].topic_id`);

    if (!TOPIC_EVOLUTION_TYPES.includes(topic.evolution_type)) {
      throw new BuilderValidationError(
        `topics[${index}].evolution_type is invalid.`,
      );
    }

    requireText(topic.current_period, `topics[${index}].current_period`);
    validateNonNegativeInteger(
      topic.periods_observed,
      `topics[${index}].periods_observed`,
    );
    validateNonNegativeInteger(
      topic.current_assignment_count,
      `topics[${index}].current_assignment_count`,
    );
    validateNonNegativeInteger(
      topic.previous_assignment_count,
      `topics[${index}].previous_assignment_count`,
    );
    validateConfidence(topic.confidence, `topics[${index}].confidence`);

    if (!Array.isArray(topic.historical_periods_analyzed)) {
      throw new BuilderValidationError(
        `topics[${index}].historical_periods_analyzed must be an array.`,
      );
    }

    if (!Array.isArray(topic.evidence_refs)) {
      throw new BuilderValidationError(
        `topics[${index}].evidence_refs must be an array.`,
      );
    }

    if (!Array.isArray(topic.evidence_by_period)) {
      throw new BuilderValidationError(
        `topics[${index}].evidence_by_period must be an array.`,
      );
    }

    const key = `${topic.topic_id}:${topic.evolution_type}`;

    if (recordKeys.has(key)) {
      throw new BuilderValidationError(
        `Topic Evolution contains duplicate topic behavior record: ${key}.`,
      );
    }

    recordKeys.add(key);
  }

  const sorted = [...content.topics].sort((left, right) =>
    left.topic_id.localeCompare(right.topic_id)
      || left.evolution_type.localeCompare(right.evolution_type));

  if (!isDeepStrictEqual(content.topics, sorted)) {
    throw new BuilderValidationError(
      "Topic Evolution topics must use deterministic ordering.",
    );
  }
}

function validateRegistryVersions(
  registryVersions: number[],
  dependencies: TopicEvolutionBuilderDependencies,
): void {
  if (!Array.isArray(registryVersions) || registryVersions.length === 0) {
    throw new BuilderValidationError(
      "Topic Evolution registry_versions must be a non-empty array.",
    );
  }

  const expected = [
    ...new Set([
      dependencies.current_topic_assignments.content.registry_version,
      ...dependencies.historical_topic_assignments.map(({ content }) =>
        content.registry_version),
    ]),
  ].sort((left, right) => left - right);

  if (!isDeepStrictEqual(registryVersions, expected)) {
    throw new BuilderValidationError(
      "Topic Evolution registry_versions do not reconcile with Topic Assignments.",
    );
  }
}

function requireTopicAssignmentArtifact(
  artifact: Artifact<unknown> | undefined,
  companyId: string,
  periodId: string,
  dependencyName: string,
): Artifact<TopicAssignmentArtifactContent> {
  if (artifact === undefined) {
    throw new BuilderDependencyError(
      `Missing required Topic Evolution dependency: ${dependencyName}.`,
    );
  }

  if (artifact.identity.artifact_type !== "topic_assignment") {
    throw new BuilderDependencyError(
      `${dependencyName} must have artifact_type topic_assignment.`,
    );
  }

  const assignmentArtifact =
    artifact as Artifact<TopicAssignmentArtifactContent>;

  if (assignmentArtifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new BuilderDependencyError(`${dependencyName} must be active.`);
  }

  if (
    assignmentArtifact.metadata.artifact_hash
      !== calculateArtifactHash(assignmentArtifact.content)
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} artifact hash does not reconcile with content.`,
    );
  }

  if (
    assignmentArtifact.identity.company_id !== companyId
      || assignmentArtifact.content.company_id !== companyId
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} company must match the build target.`,
    );
  }

  if (
    assignmentArtifact.identity.period_id !== periodId
      || assignmentArtifact.content.period_id !== periodId
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} period must match its declared period.`,
    );
  }

  if (assignmentArtifact.content.registry_version <= 0) {
    throw new BuilderDependencyError(
      `${dependencyName} must preserve a positive Topic Registry version.`,
    );
  }

  validateAssignments(assignmentArtifact.content.assignments, dependencyName);

  return assignmentArtifact;
}

function validateAssignments(
  assignments: TopicAssignment[],
  dependencyName: string,
): void {
  const assignmentIds = new Set<string>();

  for (const [index, assignment] of assignments.entries()) {
    requireText(
      assignment.assignment_id,
      `${dependencyName}.assignments[${index}].assignment_id`,
    );
    requireText(
      assignment.topic_id,
      `${dependencyName}.assignments[${index}].topic_id`,
    );
    requireText(
      assignment.theme_summary,
      `${dependencyName}.assignments[${index}].theme_summary`,
    );
    validateConfidence(
      assignment.confidence,
      `${dependencyName}.assignments[${index}].confidence`,
    );

    if (assignmentIds.has(assignment.assignment_id)) {
      throw new BuilderDependencyError(
        `${dependencyName} contains duplicate assignment_id.`,
      );
    }

    assignmentIds.add(assignment.assignment_id);
  }
}

function validateConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderDependencyError(`${field} must be between 0 and 1.`);
  }
}

function validateNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BuilderValidationError(
      `${field} must be a non-negative integer.`,
    );
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}
