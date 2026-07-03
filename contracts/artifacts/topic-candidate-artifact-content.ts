import type {
  CountDistribution,
  SimilarityStatistics,
} from "./aggregation-result-artifact-content.js";
import type {
  TopicAssignmentMethod,
} from "./topic-assignment-artifact-content.js";

export type TopicCandidateDiscoveryContext = {
  candidate_discovery_version: string;
  aggregation_id: string;
  aggregation_version: string;
  aggregation_configuration_version: string;
  candidate_count: number;
};

export type TopicCandidateProposedConcept = {
  proposed_topic_id: string;
  registry_version: number;
};

export type TopicCandidateEvidenceSummary = {
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

export type TopicCandidateSupportingAggregation = {
  aggregation_id: string;
  aggregation_version: string;
  aggregation_configuration_version: string;
  registry_versions: number[];
};

export type TopicCandidateMetadata = {
  builder_version: string;
  candidate_discovery_version: string;
};

export type TopicCandidate = {
  candidate_id: string;
  candidate_type: "topic_candidate";
  candidate_version: string;
  proposed_concept: TopicCandidateProposedConcept;
  evidence_summary: TopicCandidateEvidenceSummary;
  supporting_aggregation: TopicCandidateSupportingAggregation;
  candidate_metadata: TopicCandidateMetadata;
};

export type TopicCandidateArtifactContent = {
  discovery_context: TopicCandidateDiscoveryContext;
  candidates: [TopicCandidate];
};
