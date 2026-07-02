import type {
  AggregatedTopicStatistics,
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicCandidate,
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  CANDIDATE_DISCOVERY_BUILDER_VERSION,
  CANDIDATE_DISCOVERY_VERSION,
  TOPIC_CANDIDATE_VERSION,
} from "./contract.js";

export function buildTopicCandidateContent(
  aggregationResult: AggregationResultArtifactContent,
): TopicCandidateArtifactContent {
  const candidates = [...aggregationResult.topic_statistics]
    .sort((left, right) =>
      left.registry_version - right.registry_version
      || left.topic_id.localeCompare(right.topic_id))
    .map((topicStatistics) =>
      buildTopicCandidate(aggregationResult, topicStatistics));

  return {
    discovery_context: {
      candidate_discovery_version: CANDIDATE_DISCOVERY_VERSION,
      aggregation_id: aggregationResult.aggregation_context.aggregation_id,
      aggregation_version:
        aggregationResult.aggregation_context.aggregation_version,
      aggregation_configuration_version:
        aggregationResult.aggregation_context.aggregation_configuration_version,
      candidate_count: candidates.length,
    },
    candidates,
  };
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
