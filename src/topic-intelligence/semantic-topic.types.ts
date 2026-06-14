import type { TopicDefinition } from "./topic.types.js";

export type EmbeddingVector = number[];

export type TopicEmbedding = TopicDefinition & {
  embedding: EmbeddingVector;
};

export type TopicEmbeddingRegistry = {
  generated_at: string;
  embedding_model: string;
  input_hash: string;
  topics: TopicEmbedding[];
};

export type ThemeEmbedding = {
  theme: string;
  category: string;
  summary: string;
  embedding: EmbeddingVector;
};

export type ThemeEmbeddingFile = {
  company: string;
  ticker: string;
  filing_date: string;
  generated_at: string;
  embedding_model: string;
  input_hash: string;
  themes: ThemeEmbedding[];
};

export type SemanticDecision = "auto_assign" | "low_confidence";

export type SemanticMatchReason =
  | "semantic_similarity"
  | "semantic_similarity + category_alignment"
  | "semantic_similarity + variant_match"
  | "semantic_similarity + category_alignment + variant_match";

export type SemanticTopicCandidate = {
  topic_id: string;
  cosine_similarity: number;
  category_bonus: number;
  variant_bonus: number;
  final_score: number;
  rank: number;
};

export type SemanticTopicMatch = {
  theme: string;
  category: string;
  selected_topic: string;
  candidate_topic_id: string;
  confidence: number;
  match_reason: SemanticMatchReason;
  candidates: SemanticTopicCandidate[];
  decision: SemanticDecision;
};

export type SemanticTopicMatchFile = {
  company: string;
  ticker: string;
  filing_date: string;
  generated_at: string;
  embedding_model: string;
  matches: SemanticTopicMatch[];
};
