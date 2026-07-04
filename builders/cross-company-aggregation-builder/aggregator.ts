import type {
  AggregatedTopicStatistics,
  AggregationEvidenceStatistics,
  AggregationResultArtifactContent,
  CountDistribution,
  RegistryVersionCount,
  SimilarityHistogramBucket,
  SimilarityStatistics,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicAssignmentMethod,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicSignalAssignmentStatus,
  TopicSignalCandidateDecision,
  TopicSignalExecutionRecord,
} from "../../contracts/execution/topic-signal-execution-record.js";
import {
  EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
  type ExecutionRecordReference,
} from "../../contracts/framework/execution-record-reference.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  AGGREGATION_ASSIGNMENT_METHOD_VALUES,
  ASSIGNMENT_STATUS_VALUES,
  CANDIDATE_DECISION_VALUES,
  CROSS_COMPANY_AGGREGATION_VERSION,
} from "./contract.js";
import type { CrossCompanyAggregationBuilderInput } from "./types.js";

type TopicGroup = {
  topic_id: string;
  registry_version: number;
  company_ids: Set<string>;
  period_ids: Set<string>;
  filing_ids: Set<string>;
  theme_ids: Set<string>;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  final_assignment_count: number;
  assignment_method_counts: CountDistribution<TopicAssignmentMethod>;
  similarity_scores: number[];
};

type SignalReference = {
  signal_id: string;
  company_id: string;
  period_id: string;
  filing_id: string;
  theme_id: string;
  execution_id: string;
  registry_version: number;
};

export function buildAggregationResultContent(input: {
  topicSignals: TopicSignalExecutionRecord[];
  aggregationConfigurationVersion: string;
}): AggregationResultArtifactContent {
  const signalReferences = input.topicSignals
    .map(signalReference)
    .sort(compareSignalReferences);
  const signalIds = signalReferences
    .map(({ signal_id }) => signal_id)
    .sort();
  const registryVersions = sortedNumbers(
    new Set(signalReferences.map(({ registry_version }) => registry_version)),
  );
  const topicGroups = new Map<string, TopicGroup>();
  const assignmentStatusCounts = emptyStatusCounts();
  const assignmentMethodCounts = emptyMethodCounts();
  const candidateDecisionCounts = emptyDecisionCounts();
  const companyIds = new Set<string>();
  const periodIds = new Set<string>();
  const filingIds = new Set<string>();
  const themeIds = new Set<string>();
  const allSimilarityScores: number[] = [];

  for (const signal of input.topicSignals) {
    companyIds.add(signal.execution_context.company_id);
    periodIds.add(signal.execution_context.period_id);
    filingIds.add(signal.execution_context.filing_id);
    themeIds.add(signal.theme.theme_id);
    assignmentStatusCounts[signal.final_result.assignment_status] += 1;

    for (const assignment of signal.final_result.final_assignments) {
      assignmentMethodCounts[assignment.assignment_method] += 1;
    }

    for (const candidate of signal.evaluation.candidates) {
      candidateDecisionCounts[candidate.decision] += 1;
      allSimilarityScores.push(candidate.similarity_score);

      const key = topicGroupKey(candidate.topic_id, signal.registry_context.registry_version);
      const group = topicGroups.get(key) ?? createTopicGroup(
        candidate.topic_id,
        signal.registry_context.registry_version,
      );

      group.company_ids.add(signal.execution_context.company_id);
      group.period_ids.add(signal.execution_context.period_id);
      group.filing_ids.add(signal.execution_context.filing_id);
      group.theme_ids.add(signal.theme.theme_id);
      group.candidate_count += 1;
      group.assignment_method_counts[candidate.assignment_method] += 1;
      group.similarity_scores.push(candidate.similarity_score);

      if (candidate.decision === "accepted") {
        group.accepted_count += 1;
      } else {
        group.rejected_count += 1;
      }

      topicGroups.set(key, group);
    }

    for (const assignment of signal.final_result.final_assignments) {
      const key = topicGroupKey(
        assignment.topic_id,
        signal.registry_context.registry_version,
      );
      const group = topicGroups.get(key) ?? createTopicGroup(
        assignment.topic_id,
        signal.registry_context.registry_version,
      );

      group.company_ids.add(signal.execution_context.company_id);
      group.period_ids.add(signal.execution_context.period_id);
      group.filing_ids.add(signal.execution_context.filing_id);
      group.theme_ids.add(signal.theme.theme_id);
      group.final_assignment_count += 1;
      topicGroups.set(key, group);
    }
  }

  return {
    aggregation_context: {
      aggregation_id: aggregationId({
        aggregationConfigurationVersion:
          input.aggregationConfigurationVersion,
        signalIds,
      }),
      aggregation_version: CROSS_COMPANY_AGGREGATION_VERSION,
      aggregation_configuration_version: input.aggregationConfigurationVersion,
      signal_count: signalIds.length,
    },
    registry_context: {
      registry_versions: registryVersions,
      counts_by_registry_version:
        registryVersions.map<RegistryVersionCount>((registryVersion) => ({
          registry_version: registryVersion,
          signal_count: signalReferences.filter(
            ({ registry_version }) => registry_version === registryVersion,
          ).length,
        })),
    },
    evidence_statistics: buildEvidenceStatistics({
      totalSignals: signalIds.length,
      themeCount: themeIds.size,
      companyCount: companyIds.size,
      periodCount: periodIds.size,
      filingCount: filingIds.size,
      assignmentStatusCounts,
      assignmentMethodCounts,
      candidateDecisionCounts,
      allSimilarityScores,
    }),
    topic_statistics: [...topicGroups.values()]
      .map(toTopicStatistics)
      .sort((left, right) =>
        left.registry_version - right.registry_version
        || left.topic_id.localeCompare(right.topic_id)),
  };
}

export function aggregationResultArtifactId(
  input: CrossCompanyAggregationBuilderInput,
): ReservedArtifactId {
  const signalIds = input.topic_signals
    .map(topicSignalId)
    .sort();
  const id = aggregationId({
    aggregationConfigurationVersion:
      input.aggregation_configuration_version,
    signalIds,
  });

  return `aggregation-result-artifact:${stableHash({
    aggregation_id: id,
    aggregation_configuration_version:
      input.aggregation_configuration_version,
    aggregation_version: CROSS_COMPANY_AGGREGATION_VERSION,
  })}` as ReservedArtifactId;
}

export function topicSignalId(signal: TopicSignalExecutionRecord): string {
  return `topic-signal:${stableHash({
    company_id: signal.execution_context.company_id,
    embedding_model: signal.execution_metadata.embedding_model,
    execution_id: signal.execution_context.execution_id,
    filing_id: signal.execution_context.filing_id,
    generated_at: signal.execution_metadata.generated_at,
    period_id: signal.execution_context.period_id,
    registry_version: signal.registry_context.registry_version,
    theme_id: signal.theme.theme_id,
  })}`;
}

export function buildTopicSignalExecutionReferences(
  topicSignals: TopicSignalExecutionRecord[],
): ExecutionRecordReference[] {
  return topicSignals
    .map<ExecutionRecordReference>((signal) => ({
      schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
      record_type: "topic_signal",
      record_id: topicSignalId(signal),
      record_hash: stableHash(signal),
      producer: "topic-assignment-builder",
      execution_id: signal.execution_context.execution_id,
    }))
    .sort((left, right) =>
      left.record_id.localeCompare(right.record_id)
      || left.record_hash.localeCompare(right.record_hash)
      || left.execution_id.localeCompare(right.execution_id));
}

function signalReference(
  signal: TopicSignalExecutionRecord,
): SignalReference {
  return {
    signal_id: topicSignalId(signal),
    company_id: signal.execution_context.company_id,
    period_id: signal.execution_context.period_id,
    filing_id: signal.execution_context.filing_id,
    theme_id: signal.theme.theme_id,
    execution_id: signal.execution_context.execution_id,
    registry_version: signal.registry_context.registry_version,
  };
}

function aggregationId(input: {
  aggregationConfigurationVersion: string;
  signalIds: string[];
}): string {
  return `aggregation:${stableHash({
    aggregation_configuration_version:
      input.aggregationConfigurationVersion,
    aggregation_version: CROSS_COMPANY_AGGREGATION_VERSION,
    signal_ids: input.signalIds,
  })}`;
}

function buildEvidenceStatistics(input: {
  totalSignals: number;
  themeCount: number;
  companyCount: number;
  periodCount: number;
  filingCount: number;
  assignmentStatusCounts: CountDistribution<TopicSignalAssignmentStatus>;
  assignmentMethodCounts: CountDistribution<TopicAssignmentMethod>;
  candidateDecisionCounts: CountDistribution<TopicSignalCandidateDecision>;
  allSimilarityScores: number[];
}): AggregationEvidenceStatistics {
  return {
    total_signals: input.totalSignals,
    theme_count: input.themeCount,
    company_count: input.companyCount,
    reporting_period_count: input.periodCount,
    filing_count: input.filingCount,
    assignment_status_counts: input.assignmentStatusCounts,
    assignment_method_counts: input.assignmentMethodCounts,
    candidate_decision_counts: input.candidateDecisionCounts,
    similarity: similarityStatistics(input.allSimilarityScores),
  };
}

function toTopicStatistics(group: TopicGroup): AggregatedTopicStatistics {
  return {
    topic_id: group.topic_id,
    registry_version: group.registry_version,
    candidate_count: group.candidate_count,
    accepted_count: group.accepted_count,
    rejected_count: group.rejected_count,
    final_assignment_count: group.final_assignment_count,
    company_count: group.company_ids.size,
    reporting_period_count: group.period_ids.size,
    filing_count: group.filing_ids.size,
    theme_count: group.theme_ids.size,
    assignment_method_counts: group.assignment_method_counts,
    similarity: similarityStatistics(group.similarity_scores),
  };
}

function similarityStatistics(scores: number[]): SimilarityStatistics {
  if (scores.length === 0) {
    return {
      count: 0,
      average: null,
      minimum: null,
      maximum: null,
      p50: null,
      p90: null,
      histogram: emptyHistogram(),
    };
  }

  const sorted = [...scores].sort((left, right) => left - right);
  const sum = sorted.reduce((total, score) => total + score, 0);

  return {
    count: sorted.length,
    average: roundScore(sum / sorted.length),
    minimum: roundScore(sorted[0]!),
    maximum: roundScore(sorted[sorted.length - 1]!),
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    histogram: histogram(sorted),
  };
}

function percentile(sortedScores: number[], percentileValue: number): number {
  const index = Math.max(
    0,
    Math.ceil((percentileValue / 100) * sortedScores.length) - 1,
  );

  return roundScore(sortedScores[index]!);
}

function histogram(scores: number[]): SimilarityHistogramBucket[] {
  const buckets = emptyHistogram();

  for (const score of scores) {
    const index = Math.min(Math.floor(score / 0.2), buckets.length - 1);
    buckets[index]!.count += 1;
  }

  return buckets;
}

function emptyHistogram(): SimilarityHistogramBucket[] {
  return [
    { range_start: 0, range_end: 0.2, count: 0 },
    { range_start: 0.2, range_end: 0.4, count: 0 },
    { range_start: 0.4, range_end: 0.6, count: 0 },
    { range_start: 0.6, range_end: 0.8, count: 0 },
    { range_start: 0.8, range_end: 1, count: 0 },
  ];
}

function createTopicGroup(
  topicId: string,
  registryVersion: number,
): TopicGroup {
  return {
    topic_id: topicId,
    registry_version: registryVersion,
    company_ids: new Set(),
    period_ids: new Set(),
    filing_ids: new Set(),
    theme_ids: new Set(),
    candidate_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    final_assignment_count: 0,
    assignment_method_counts: emptyMethodCounts(),
    similarity_scores: [],
  };
}

function emptyStatusCounts(): CountDistribution<TopicSignalAssignmentStatus> {
  return Object.fromEntries(
    ASSIGNMENT_STATUS_VALUES.map((status) => [status, 0]),
  ) as CountDistribution<TopicSignalAssignmentStatus>;
}

function emptyDecisionCounts(): CountDistribution<TopicSignalCandidateDecision> {
  return Object.fromEntries(
    CANDIDATE_DECISION_VALUES.map((decision) => [decision, 0]),
  ) as CountDistribution<TopicSignalCandidateDecision>;
}

function emptyMethodCounts(): CountDistribution<TopicAssignmentMethod> {
  return Object.fromEntries(
    AGGREGATION_ASSIGNMENT_METHOD_VALUES.map((method) => [method, 0]),
  ) as CountDistribution<TopicAssignmentMethod>;
}

function topicGroupKey(topicId: string, registryVersion: number): string {
  return `${registryVersion}:${topicId}`;
}

function compareSignalReferences(
  left: SignalReference,
  right: SignalReference,
): number {
  return left.registry_version - right.registry_version
    || left.company_id.localeCompare(right.company_id)
    || left.period_id.localeCompare(right.period_id)
    || left.filing_id.localeCompare(right.filing_id)
    || left.theme_id.localeCompare(right.theme_id)
    || left.signal_id.localeCompare(right.signal_id);
}

function sortedNumbers(values: Set<number>): number[] {
  return [...values].sort((left, right) => left - right);
}

function roundScore(value: number): number {
  return Number(value.toFixed(4));
}
