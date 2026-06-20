import { createHash } from "node:crypto";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { Theme } from "../themes/contract.js";
import {
  AUTOMATIC_ASSIGNMENT_THRESHOLD,
  HUMAN_REVIEW_THRESHOLD,
  MAX_ASSIGNMENTS_PER_THEME,
  SIMILARITY_DECIMAL_PLACES,
} from "./contract.js";
import type {
  CandidateTopic,
  ThemeSemanticEmbedding,
  TopicAssignment,
  TopicMatchCandidate,
  TopicRegistryEntry,
  UnassignedTheme,
} from "./types.js";

export function buildTopicAssignments(
  themes: Theme[],
  activeTopics: TopicRegistryEntry[],
  themeEmbeddings: ThemeSemanticEmbedding[],
): {
  assignments: TopicAssignment[];
  unassignedThemes: UnassignedTheme[];
} {
  const assignments: TopicAssignment[] = [];
  const unassignedThemes: UnassignedTheme[] = [];
  const orderedThemes = [...themes].sort((left, right) =>
    left.theme_id.localeCompare(right.theme_id));
  const orderedTopics = [...activeTopics].sort((left, right) =>
    left.topic_id.localeCompare(right.topic_id));
  const embeddingsByTheme = new Map(
    themeEmbeddings.map(({ theme_id, embedding }) => [theme_id, embedding]),
  );

  for (const theme of orderedThemes) {
    const themeEmbedding = embeddingsByTheme.get(theme.theme_id);

    if (themeEmbedding === undefined) {
      throw new Error(`Missing semantic embedding for theme ${theme.theme_id}.`);
    }

    const candidates = orderedTopics
      .map((topic) => matchThemeToTopic(theme, themeEmbedding, topic))
      .sort(compareCandidates);
    const automatic = candidates
      .filter(({ similarity_score }) =>
        similarity_score >= AUTOMATIC_ASSIGNMENT_THRESHOLD)
      .slice(0, MAX_ASSIGNMENTS_PER_THEME);

    if (automatic.length === 0) {
      unassignedThemes.push({
        theme_id: theme.theme_id,
        theme_text: theme.title,
        highest_similarity_score: candidates[0]?.similarity_score ?? 0,
        candidate_topics: candidates
          .filter(({ similarity_score }) =>
            similarity_score >= HUMAN_REVIEW_THRESHOLD)
          .slice(0, MAX_ASSIGNMENTS_PER_THEME)
          .map(toCandidateTopic),
      });
      continue;
    }

    assignments.push(...automatic.map((candidate) => ({
      assignment_id: createAssignmentId(theme.theme_id, candidate.topic_id),
      theme_id: theme.theme_id,
      topic_id: candidate.topic_id,
      assignment_method: candidate.assignment_method,
      similarity_score: candidate.similarity_score,
      confidence: candidate.similarity_score,
    })));
  }

  return {
    assignments: assignments.sort(compareAssignments),
    unassignedThemes: unassignedThemes.sort((left, right) =>
      left.theme_id.localeCompare(right.theme_id)),
  };
}

export function createAssignmentId(themeId: string, topicId: string): string {
  return createHash("sha256")
    .update(`${themeId}:${topicId}`, "utf8")
    .digest("hex");
}

export function normalizeTopicText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchThemeToTopic(
  theme: Theme,
  themeEmbedding: number[],
  topic: TopicRegistryEntry,
): TopicMatchCandidate {
  const normalizedTitle = normalizeTopicText(theme.title);
  const exactValues = [
    topic.topic_name,
    ...(topic.theme_variants ?? []),
  ].map(normalizeTopicText);

  if (exactValues.includes(normalizedTitle)) {
    return {
      topic_id: topic.topic_id,
      assignment_method: "exact_match",
      similarity_score: 1,
    };
  }

  return {
    topic_id: topic.topic_id,
    assignment_method: "semantic_match",
    similarity_score: cosineSimilarity(themeEmbedding, topic.embedding),
  };
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new BuilderValidationError(
      "Semantic embedding vectors must have the same non-zero length.",
    );
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index]!;
    const rightValue = right[index]!;
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue ** 2;
    rightMagnitude += rightValue ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  const normalized = dotProduct
    / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));

  return round(Math.max(0, Math.min(1, normalized)));
}

function round(value: number): number {
  const factor = 10 ** SIMILARITY_DECIMAL_PLACES;

  return Math.round(value * factor) / factor;
}

function compareCandidates(
  left: TopicMatchCandidate,
  right: TopicMatchCandidate,
): number {
  return (
    right.similarity_score - left.similarity_score
    || methodRank(left.assignment_method) - methodRank(right.assignment_method)
    || left.topic_id.localeCompare(right.topic_id)
  );
}

function methodRank(method: TopicMatchCandidate["assignment_method"]): number {
  return method === "exact_match" ? 0 : 1;
}

function compareAssignments(
  left: TopicAssignment,
  right: TopicAssignment,
): number {
  return (
    left.theme_id.localeCompare(right.theme_id)
    || left.topic_id.localeCompare(right.topic_id)
  );
}

function toCandidateTopic(candidate: TopicMatchCandidate): CandidateTopic {
  return {
    topic_id: candidate.topic_id,
    similarity_score: candidate.similarity_score,
  };
}
