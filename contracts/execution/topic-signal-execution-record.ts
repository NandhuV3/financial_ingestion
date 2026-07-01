import type {
  TopicAssignmentMethod,
} from "../artifacts/topic-assignment-artifact-content.js";

export type TopicSignalAssignmentStatus =
  | "assigned"
  | "human_review"
  | "unassigned";

export type TopicSignalCandidateDecision = "accepted" | "rejected";

export type TopicSignalExecutionContext = {
  company_id: string;
  period_id: string;
  filing_id: string;
  execution_id: string;
};

export type TopicSignalTheme = {
  theme_id: string;
  theme_title: string;
};

export type TopicSignalEvaluationCandidate = {
  topic_id: string;
  similarity_score: number;
  assignment_method: TopicAssignmentMethod;
  decision: TopicSignalCandidateDecision;
};

export type TopicSignalEvaluation = {
  candidates: TopicSignalEvaluationCandidate[];
};

export type TopicSignalFinalAssignment = {
  topic_id: string;
  confidence: number;
  assignment_method: TopicAssignmentMethod;
};

export type TopicSignalFinalResult = {
  assignment_status: TopicSignalAssignmentStatus;
  final_assignments: TopicSignalFinalAssignment[];
};

export type TopicSignalRegistryContext = {
  registry_version: number;
};

export type TopicSignalExecutionMetadata = {
  embedding_model: string;
  generated_at: string;
};

export type TopicSignalExecutionRecord = {
  execution_context: TopicSignalExecutionContext;
  theme: TopicSignalTheme;
  evaluation: TopicSignalEvaluation;
  final_result: TopicSignalFinalResult;
  registry_context: TopicSignalRegistryContext;
  execution_metadata: TopicSignalExecutionMetadata;
};
