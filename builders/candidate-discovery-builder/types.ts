import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  AggregationResultArtifactContent,
} from "../../contracts/artifacts/aggregation-result-artifact-content.js";
import type {
  TopicCandidateArtifactContent,
} from "../../contracts/artifacts/topic-candidate-artifact-content.js";

export type CandidateDiscoveryBuilderInput = {
  topic_id: string;
  registry_version: number;
};

export type CandidateDiscoveryBuilderDependencies = {
  aggregation_result: Artifact<AggregationResultArtifactContent>;
};

export type CandidateDiscoveryBuilderOutput = TopicCandidateArtifactContent;
