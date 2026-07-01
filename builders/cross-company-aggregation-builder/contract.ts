export const CROSS_COMPANY_AGGREGATION_BUILDER_TYPE =
  "cross-company-aggregation-builder";
export const CROSS_COMPANY_AGGREGATION_VERSION =
  "cross-company-aggregation-v1";
export const AGGREGATION_RESULT_SCHEMA_VERSION =
  "aggregation-result-artifact-v1";
export const AGGREGATION_RESULT_PIPELINE_VERSION =
  "platform-intelligence-pipeline-v1";
export const AGGREGATION_RESULT_ARTIFACT_TYPE = "aggregation_result";

export const ASSIGNMENT_STATUS_VALUES = [
  "assigned",
  "human_review",
  "unassigned",
] as const;

export const CANDIDATE_DECISION_VALUES = [
  "accepted",
  "rejected",
] as const;

export const AGGREGATION_ASSIGNMENT_METHOD_VALUES = [
  "exact_match",
  "semantic_match",
  "human_override",
] as const;
