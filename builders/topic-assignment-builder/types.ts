import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import type {
  AssignmentMethod,
  TopicRegistryEntryStatus,
} from "./contract.js";

export type TopicAssignmentBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

export type TopicRegistryEntry = {
  topic_id: string;
  topic_name: string;
  definition: string;
  aliases: string[];
  status: TopicRegistryEntryStatus;
  merged_into_topic_id?: string;
  embedding: number[];
};

export type TopicRegistryArtifactContent = {
  registry_version: string;
  registry_status: "active";
  similarity_model_version: string;
  topics: TopicRegistryEntry[];
};

export type SemanticEmbeddingProvider = {
  embed(input: {
    model: string;
    texts: string[];
  }): Promise<number[][]>;
};

export type TopicAssignment = {
  assignment_id: string;
  theme_id: string;
  topic_id: string;
  theme_title: string;
  theme_summary: string;
  assignment_method: AssignmentMethod;
  similarity_score: number;
  confidence: number;
};

export type CandidateTopic = {
  topic_id: string;
  similarity_score: number;
};

export type UnassignedTheme = {
  theme_id: string;
  theme_title: string;
  theme_summary: string;
  highest_similarity_score: number;
  candidate_topics: CandidateTopic[];
};

export type TopicAssignmentConfidence = {
  overall: number;
  exact_match_rate: number;
  semantic_match_rate: number;
  unassigned_rate: number;
};

export type TopicAssignmentArtifactContent = {
  artifact_type: "topic_assignment";
  company: string;
  filing_id: string;
  period: string;
  assignments: TopicAssignment[];
  unassigned_themes: UnassignedTheme[];
  confidence: TopicAssignmentConfidence;
};

export type TopicAssignmentBuilderDependencies = {
  themes: Artifact<ThemesArtifactContent>;
  topic_registry: Artifact<TopicRegistryArtifactContent>;
};

export type TopicMatchCandidate = {
  topic_id: string;
  assignment_method: "exact_match" | "semantic_match";
  similarity_score: number;
};

export type ThemeSemanticEmbedding = {
  theme_id: string;
  embedding: number[];
};
