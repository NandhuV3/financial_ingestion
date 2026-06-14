import {
  SEMANTIC_MATCH_CATEGORY_BONUS,
  SEMANTIC_MATCH_TOP_K,
  SEMANTIC_MATCH_VARIANT_BONUS,
} from "../config/semantic-matching.js";
import { normalizeConfidence, scoreToDecision } from "./confidence-scoring.js";
import type {
  SemanticMatchReason,
  SemanticTopicCandidate,
  SemanticTopicMatch,
  SemanticTopicMatchFile,
  ThemeEmbeddingFile,
  TopicEmbedding,
  TopicEmbeddingRegistry,
} from "./semantic-topic.types.js";

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error("Embedding vectors must have the same non-zero length.");
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function matchThemesToTopics(
  themeEmbeddings: ThemeEmbeddingFile,
  topicEmbeddings: TopicEmbeddingRegistry,
): SemanticTopicMatch[] {
  if (topicEmbeddings.topics.length === 0) {
    return [];
  }

  return themeEmbeddings.themes.map((theme) => {
    const candidates = topicEmbeddings.topics
      .map((topic) => scoreTopicCandidate({
        topic,
        theme: theme.theme,
        category: theme.category,
        embedding: theme.embedding,
      }))
      .sort(compareCandidates)
      .slice(0, SEMANTIC_MATCH_TOP_K)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
      }));
    const selected = candidates[0];
    const confidence = selected.final_score;

    return {
      theme: theme.theme,
      category: theme.category,
      selected_topic: selected.topic_id,
      candidate_topic_id: selected.topic_id,
      confidence,
      match_reason: buildMatchReason(selected),
      candidates,
      decision: scoreToDecision(confidence),
    };
  });
}

function compareCandidates(left: SemanticTopicCandidate, right: SemanticTopicCandidate): number {
  return (
    right.final_score - left.final_score ||
    right.variant_bonus - left.variant_bonus ||
    right.category_bonus - left.category_bonus ||
    right.cosine_similarity - left.cosine_similarity ||
    left.topic_id.localeCompare(right.topic_id)
  );
}

export function scoreTopicCandidate(params: {
  topic: TopicEmbedding;
  theme: string;
  category: string;
  embedding: number[];
}): SemanticTopicCandidate {
  const cosine = normalizeConfidence(cosineSimilarity(params.embedding, params.topic.embedding));
  const categoryBonus = categoryMatches(params.category, params.topic) ? SEMANTIC_MATCH_CATEGORY_BONUS : 0;
  const variantBonus = variantMatches(params.theme, params.topic) ? SEMANTIC_MATCH_VARIANT_BONUS : 0;

  const finalScore = Math.min(1, cosine + categoryBonus + variantBonus);

  return {
    topic_id: params.topic.topic_id,
    cosine_similarity: cosine,
    category_bonus: categoryBonus,
    variant_bonus: variantBonus,
    final_score: normalizeConfidence(finalScore),
    rank: 0,
  };
}

export function buildSemanticTopicMatchFile(params: {
  themeEmbeddings: ThemeEmbeddingFile;
  topicEmbeddings: TopicEmbeddingRegistry;
  matches: SemanticTopicMatch[];
  generatedAt: string;
}): SemanticTopicMatchFile {
  return {
    company: params.themeEmbeddings.company,
    ticker: params.themeEmbeddings.ticker,
    filing_date: params.themeEmbeddings.filing_date,
    generated_at: params.generatedAt,
    embedding_model: params.topicEmbeddings.embedding_model,
    matches: params.matches,
  };
}

function categoryMatches(category: string, topic: TopicEmbedding): boolean {
  const supportedCategories = topic.supported_categories ?? topic.categories ?? [];
  const normalizedCategory = normalizeText(category);

  return supportedCategories.map(normalizeText).includes(normalizedCategory);
}

function variantMatches(theme: string, topic: TopicEmbedding): boolean {
  const normalizedTheme = normalizeText(theme);

  return (topic.theme_variants ?? []).map(normalizeText).includes(normalizedTheme);
}

function buildMatchReason(candidate: SemanticTopicCandidate): SemanticMatchReason {
  const hasCategory = candidate.category_bonus > 0;
  const hasVariant = candidate.variant_bonus > 0;

  if (hasCategory && hasVariant) {
    return "semantic_similarity + category_alignment + variant_match";
  }

  if (hasCategory) {
    return "semantic_similarity + category_alignment";
  }

  if (hasVariant) {
    return "semantic_similarity + variant_match";
  }

  return "semantic_similarity";
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
