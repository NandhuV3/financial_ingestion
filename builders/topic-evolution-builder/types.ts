import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { TopicAssignmentArtifactContent } from "../topic-assignment-builder/types.js";
import type {
  NarrativeDrift,
  StrengthDirection,
  TopicEvolutionState,
} from "./contract.js";

export type TopicEvolutionBuilderInput = {
  company_id: string;
  period_id: string;
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

export type TopicEvolutionEvidence = {
  periods_analyzed: string[];
  supporting_assignment_refs: string[];
  theme_summaries_by_period: ThemeSummariesByPeriod[];
};

export type TopicEvolution = {
  topic_id: string;
  first_seen_period: string;
  last_seen_period: string;
  periods_present: number;
  evolution_state: TopicEvolutionState;
  strength_direction: StrengthDirection;
  narrative_drift: NarrativeDrift;
  confidence: number;
  evidence: TopicEvolutionEvidence;
};

export type TopicEvolutionConfidence = {
  overall: number;
};

export type TopicEvolutionArtifactContent = {
  artifact_type: "topic_evolution";
  company: string;
  period: string;
  status: "complete" | "insufficient_history";
  topic_evolutions: TopicEvolution[];
  confidence: TopicEvolutionConfidence;
};

export type TopicPeriodObservation = {
  period: string;
  assignment_ids: string[];
  theme_summaries: string[];
  assignment_confidences: number[];
};
