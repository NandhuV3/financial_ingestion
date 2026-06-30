export const TOPIC_ASSIGNMENT_BUILDER_TYPE = "topic-assignment-builder";
export const TOPIC_ASSIGNMENT_BUILDER_VERSION = "topic-assignment-builder-v1";
export const TOPIC_ASSIGNMENT_SCHEMA_VERSION = "topic-assignment-artifact-v1";
export const TOPIC_ASSIGNMENT_PIPELINE_VERSION = "topic-assignment-pipeline-v1";

/**
 * Owner: Topic Assignment contract.
 * Purpose: minimum normalized semantic similarity for automatic assignment.
 * Justification: locked automatic-assignment boundary in 019.
 * Range: [0, 1].
 */
export const AUTOMATIC_ASSIGNMENT_THRESHOLD = 0.85;

/**
 * Owner: Topic Assignment contract.
 * Purpose: minimum normalized semantic similarity retained for human review.
 * Justification: locked review boundary in 019.
 * Range: [0, 1].
 */
export const HUMAN_REVIEW_THRESHOLD = 0.7;

/**
 * Owner: Topic Assignment contract.
 * Purpose: bound the number of topics emitted or proposed per theme.
 * Justification: locked maximum in 019.
 * Range: positive integer.
 */
export const MAX_ASSIGNMENTS_PER_THEME = 3;

/**
 * Owner: Topic Assignment contract.
 * Purpose: stabilize persisted similarity and confidence values.
 * Justification: deterministic replay without changing threshold semantics.
 * Range: non-negative integer decimal places.
 */
export const SIMILARITY_DECIMAL_PLACES = 4;

/**
 * Owner: Topic Assignment contract.
 * Purpose: pin the semantic embedding model used by Themes and Topic Registry.
 * Justification: model-consistent similarity and replayable classification.
 */
export const TOPIC_ASSIGNMENT_EMBEDDING_MODEL = "text-embedding-3-small";

export const ASSIGNMENT_METHODS = [
  "exact_match",
  "semantic_match",
  "human_override",
] as const;

export type AssignmentMethod = typeof ASSIGNMENT_METHODS[number];
