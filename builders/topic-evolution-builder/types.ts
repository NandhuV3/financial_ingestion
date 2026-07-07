import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { TopicAssignmentArtifactContent } from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicEvolutionArtifactContent,
  TopicEvolutionConfidence,
  TopicEvolutionTopicRecord,
} from "../../contracts/artifacts/topic-evolution-artifact-content.js";

export type TopicEvolutionBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
  historical_periods: string[];
};

export type TopicEvolutionBuilderDependencies = {
  current_topic_assignments: Artifact<TopicAssignmentArtifactContent>;
  historical_topic_assignments: Artifact<TopicAssignmentArtifactContent>[];
};

export type ThemeSummariesByPeriod = {
  period: string;
  theme_summaries: string[];
};

export type TopicPeriodObservation = {
  period: string;
  assignment_ids: string[];
  theme_summaries: string[];
  assignment_confidences: number[];
};

export type {
  TopicEvolutionArtifactContent,
  TopicEvolutionConfidence,
  TopicEvolutionTopicRecord,
};
