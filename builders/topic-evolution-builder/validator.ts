import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { isDeepStrictEqual } from "node:util";
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../packages/builder-framework/src/builder-errors.js";
import type {
  TopicAssignment,
  TopicAssignmentArtifactContent,
} from "../topic-assignment-builder/types.js";
import {
  historicalTopicAssignmentDependencyKey,
  TOPIC_EVOLUTION_MINIMUM_PERIODS,
} from "./contract.js";
import { calculateTopicEvolutionConfidence } from "./confidence.js";
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
          period: artifact.content.period,
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
  if (content.artifact_type !== "topic_evolution") {
    throw new BuilderValidationError(
      "Topic Evolution artifact_type must be topic_evolution.",
    );
  }

  if (
    content.company !== input.company_id
    || content.period !== input.period_id
  ) {
    throw new BuilderValidationError(
      "Topic Evolution content identity must match the build target.",
    );
  }

  const periodCount = input.historical_periods.length + 1;

  if (periodCount < TOPIC_EVOLUTION_MINIMUM_PERIODS) {
    if (
      content.status !== "insufficient_history"
      || content.topic_evolutions.length !== 0
      || content.confidence.overall !== 0
    ) {
      throw new BuilderValidationError(
        "Insufficient-history Topic Evolution content is inconsistent.",
      );
    }

    return;
  }

  if (content.status !== "complete") {
    throw new BuilderValidationError(
      "Topic Evolution status must be complete when history is sufficient.",
    );
  }

  const prior =
    dependencies.historical_topic_assignments[
      dependencies.historical_topic_assignments.length - 1
    ];

  if (prior === undefined) {
    throw new BuilderValidationError(
      "Topic Evolution requires an immediately preceding assignment artifact.",
    );
  }

  const expected = buildTopicEvolutions(
    prior.content.period,
    dependencies.current_topic_assignments.content.period,
    buildTopicObservations(prior),
    buildTopicObservations(dependencies.current_topic_assignments),
  );

  if (!sameEvolutionContent(content.topic_evolutions, expected)) {
    throw new BuilderValidationError(
      "Topic Evolution classifications do not reconcile with Topic Assignments.",
    );
  }

  const expectedConfidence = calculateTopicEvolutionConfidence(expected);

  if (content.confidence.overall !== expectedConfidence.overall) {
    throw new BuilderValidationError(
      "Topic Evolution confidence does not reconcile with classifications.",
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

  if (assignmentArtifact.content.artifact_type !== "topic_assignment") {
    throw new BuilderDependencyError(
      `${dependencyName} content artifact_type must be topic_assignment.`,
    );
  }

  if (
    assignmentArtifact.identity.company_id !== companyId
    || assignmentArtifact.content.company !== companyId
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} company must match the build target.`,
    );
  }

  if (
    assignmentArtifact.identity.period_id !== periodId
    || assignmentArtifact.content.period !== periodId
  ) {
    throw new BuilderDependencyError(
      `${dependencyName} period must match its declared period.`,
    );
  }

  if (assignmentArtifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new BuilderDependencyError(
      `${dependencyName} must be active.`,
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

function sameEvolutionContent(
  actual: TopicEvolutionArtifactContent["topic_evolutions"],
  expected: TopicEvolutionArtifactContent["topic_evolutions"],
): boolean {
  return isDeepStrictEqual(actual, expected);
}

function validateConfidence(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BuilderDependencyError(`${field} must be between 0 and 1.`);
  }
}

function requireText(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BuilderValidationError(`${field} must be a non-empty string.`);
  }
}
