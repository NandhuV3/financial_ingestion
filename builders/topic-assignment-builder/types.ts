import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  TopicAssignment,
  TopicAssignmentCandidateTopic,
  TopicAssignmentConfidence,
  TopicAssignmentMethod,
  UnassignedTheme,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import type { ThemesArtifactContent } from "../themes/contract.js";

export type {
  TopicAssignment,
  TopicAssignmentCandidateTopic,
  TopicAssignmentConfidence,
  TopicAssignmentMethod,
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
  UnassignedTheme,
};

export type TopicAssignmentBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

export type SemanticEmbeddingProvider = {
  embed(input: {
    model: string;
    texts: string[];
  }): Promise<number[][]>;
};

export type TopicAssignmentBuilderDependencies = {
  themes: Artifact<ThemesArtifactContent>;
  topic_registry: Artifact<TopicRegistryArtifactContent>;
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

export type TopicMatchCandidate = {
  topic_id: string;
  assignment_method: "exact_match" | "semantic_match";
  similarity_score: number;
};

export type ThemeSemanticEmbedding = {
  theme_id: string;
  embedding: number[];
};

export type TopicSemanticEmbedding = {
  topic_id: string;
  embedding: number[];
};
