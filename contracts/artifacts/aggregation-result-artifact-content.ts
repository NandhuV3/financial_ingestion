import type {
  TopicAssignmentMethod,
} from "./topic-assignment-artifact-content.js";
import type {
  TopicSignalAssignmentStatus,
  TopicSignalCandidateDecision,
} from "../execution/topic-signal-execution-record.js";

export type AggregationResultContext = {
  aggregation_id: string;
  aggregation_version: string;
  aggregation_configuration_version: string;
  signal_count: number;
};

export type RegistryVersionCount = {
  registry_version: number;
  signal_count: number;
};

export type CountDistribution<T extends string> = Record<T, number>;

export type SimilarityHistogramBucket = {
  range_start: number;
  range_end: number;
  count: number;
};

export type SimilarityStatistics = {
  count: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  p50: number | null;
  p90: number | null;
  histogram: SimilarityHistogramBucket[];
};

export type AggregationEvidenceStatistics = {
  total_signals: number;
  theme_count: number;
  company_count: number;
  reporting_period_count: number;
  filing_count: number;
  assignment_status_counts: CountDistribution<TopicSignalAssignmentStatus>;
  assignment_method_counts: CountDistribution<TopicAssignmentMethod>;
  candidate_decision_counts: CountDistribution<TopicSignalCandidateDecision>;
  similarity: SimilarityStatistics;
};

export type AggregatedTopicStatistics = {
  topic_id: string;
  registry_version: number;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  final_assignment_count: number;
  company_count: number;
  reporting_period_count: number;
  filing_count: number;
  theme_count: number;
  assignment_method_counts: CountDistribution<TopicAssignmentMethod>;
  similarity: SimilarityStatistics;
};

export type AggregationResultArtifactContent = {
  aggregation_context: AggregationResultContext;
  registry_context: {
    registry_versions: number[];
    counts_by_registry_version: RegistryVersionCount[];
  };
  evidence_statistics: AggregationEvidenceStatistics;
  topic_statistics: AggregatedTopicStatistics[];
};
