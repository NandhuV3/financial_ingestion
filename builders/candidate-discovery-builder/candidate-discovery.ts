import type {
  AggregatedTopicStatistics,
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicCandidate,
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  CANDIDATE_DISCOVERY_BUILDER_VERSION,
  CANDIDATE_DISCOVERY_VERSION,
  TOPIC_CANDIDATE_VERSION,
} from "./contract.js";
import type { CandidateDiscoveryBuilderInput } from "./types.js";

export type CandidateDiscoveryTarget = {
  topic_id: string;
  registry_version: number;
};

export function listCandidateDiscoveryTargets(
  aggregationResult: AggregationResultArtifactContent,
): CandidateDiscoveryTarget[] {
  return [...aggregationResult.topic_statistics]
    .sort((left, right) =>
      left.registry_version - right.registry_version
      || left.topic_id.localeCompare(right.topic_id))
    .map((topicStatistics) => ({
      topic_id: topicStatistics.topic_id,
      registry_version: topicStatistics.registry_version,
    }));
}

export function buildTopicCandidateContent(
  aggregationResult: AggregationResultArtifactContent,
  input: CandidateDiscoveryBuilderInput,
): TopicCandidateArtifactContent {
  const topicStatistics = aggregationResult.topic_statistics.find((topic) =>
    topic.topic_id === input.topic_id
      && topic.registry_version === input.registry_version);

  if (topicStatistics === undefined) {
    throw new Error(
      "Candidate Discovery target does not exist in Aggregation Result.",
    );
  }

  const candidate = buildTopicCandidate(aggregationResult, topicStatistics);

  return {
    discovery_context: {
      candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
      aggregation_id: aggregationResult.aggregation_context.aggregation_id,
      aggregation_version:
        aggregationResult.aggregation_context.aggregation_version,
      aggregation_configuration_version:
        aggregationResult.aggregation_context.aggregation_configuration_version,
      candidate_count: 1,
    },
    candidates: [candidate],
  };
}

export function topicCandidateArtifactId(
  aggregationResult: AggregationResultArtifactContent,
  input: CandidateDiscoveryBuilderInput,
): ReservedArtifactId {
  return `topic-candidate-artifact:${stableHash({
    aggregation_id: aggregationResult.aggregation_context.aggregation_id,
    aggregation_version:
      aggregationResult.aggregation_context.aggregation_version,
    candidate_id: `topic-candidate:${stableHash({
      aggregation_id: aggregationResult.aggregation_context.aggregation_id,
      aggregation_version:
        aggregationResult.aggregation_context.aggregation_version,
      candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
      candidate_version: TOPIC_CANDIDATE_VERSION,
      proposed_topic_id: input.topic_id,
      registry_version: input.registry_version,
    })}`,
    candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
  })}` as ReservedArtifactId;
}

function buildTopicCandidate(
  aggregationResult: AggregationResultArtifactContent,
  topicStatistics: AggregatedTopicStatistics,
): TopicCandidate {
  return {
    candidate_id: candidateId(aggregationResult, topicStatistics),
    candidate_type: "topic_candidate",
    candidate_version: TOPIC_CANDIDATE_VERSION,
    proposed_concept: {
      proposed_topic_id: topicStatistics.topic_id,
      registry_version: topicStatistics.registry_version,
    },
    evidence_summary: {
      candidate_count: topicStatistics.candidate_count,
      accepted_count: topicStatistics.accepted_count,
      rejected_count: topicStatistics.rejected_count,
      final_assignment_count: topicStatistics.final_assignment_count,
      company_count: topicStatistics.company_count,
      reporting_period_count: topicStatistics.reporting_period_count,
      filing_count: topicStatistics.filing_count,
      theme_count: topicStatistics.theme_count,
      assignment_method_counts: topicStatistics.assignment_method_counts,
      similarity: topicStatistics.similarity,
    },
    supporting_aggregation: {
      aggregation_id: aggregationResult.aggregation_context.aggregation_id,
      aggregation_version:
        aggregationResult.aggregation_context.aggregation_version,
      aggregation_configuration_version:
        aggregationResult.aggregation_context.aggregation_configuration_version,
      registry_versions: [topicStatistics.registry_version],
    },
    candidate_metadata: {
      builder_version: CANDIDATE_DISCOVERY_BUILDER_VERSION,
      candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
    },
  };
}

function candidateId(
  aggregationResult: AggregationResultArtifactContent,
  topicStatistics: AggregatedTopicStatistics,
): string {
  return `topic-candidate:${stableHash({
    aggregation_id: aggregationResult.aggregation_context.aggregation_id,
    aggregation_version:
      aggregationResult.aggregation_context.aggregation_version,
    candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
    candidate_version: TOPIC_CANDIDATE_VERSION,
    proposed_topic_id: topicStatistics.topic_id,
    registry_version: topicStatistics.registry_version,
  })}`;
}
