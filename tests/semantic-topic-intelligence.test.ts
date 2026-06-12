import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTopicEmbeddingInput,
  calculateTopicEmbeddingInputHash,
  isTopicEmbeddingCacheValid,
  validateTopicDefinitions,
} from "../src/topic-intelligence/generate-topic-embeddings.js";
import {
  buildThemeEmbeddingInput,
  calculateThemeEmbeddingInputHash,
  isThemeEmbeddingCacheValid,
} from "../src/topic-intelligence/generate-theme-embedding.js";
import { normalizeConfidence, scoreToDecision } from "../src/topic-intelligence/confidence-scoring.js";
import { cosineSimilarity, matchThemesToTopics } from "../src/topic-intelligence/semantic-match-engine.js";
import { createLogger } from "../src/shared/logger.js";
import type {
  ThemeEmbeddingFile,
  TopicEmbeddingRegistry,
} from "../src/topic-intelligence/semantic-topic.types.js";
import type { Theme } from "../src/types/theme.types.js";

describe("semantic topic intelligence", () => {
  it("validates topic definitions and hashes topic name plus description", () => {
    const topics = validateTopicDefinitions([
      {
        topic_id: "ai",
        topic_name: "Artificial Intelligence",
        description: "AI products and AI infrastructure.",
      },
    ]);
    const hash = calculateTopicEmbeddingInputHash(topics);

    assert.equal(hash, calculateTopicEmbeddingInputHash(topics));
    assert.equal(buildTopicEmbeddingInput(topics[0]), "Artificial Intelligence\nAI products and AI infrastructure.");
    assert.throws(() => validateTopicDefinitions([{ topic_id: "", topic_name: "Missing ID" }]));
  });

  it("hashes theme embedding input from theme, category, and summary", () => {
    const theme = buildTheme();

    assert.equal(
      buildThemeEmbeddingInput(theme),
      "Theme: Investment in AI Infrastructure\nCategory: investments\nSummary: AI infrastructure investment summary",
    );
    assert.equal(calculateThemeEmbeddingInputHash([theme]), calculateThemeEmbeddingInputHash([theme]));
  });

  it("validates embedding caches deterministically", () => {
    assert.equal(isTopicEmbeddingCacheValid(topicEmbeddings(), "hash-1", "text-embedding-3-small"), true);
    assert.equal(isTopicEmbeddingCacheValid(topicEmbeddings(), "hash-2", "text-embedding-3-small"), false);
    assert.equal(isThemeEmbeddingCacheValid(themeEmbeddings(), "hash-1", "text-embedding-3-small"), true);
    assert.equal(isThemeEmbeddingCacheValid(themeEmbeddings(), "hash-1", "other-model"), false);
  });

  it("calculates cosine similarity and confidence decisions", () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.equal(normalizeConfidence(0.987654), 0.9877);
    assert.equal(scoreToDecision(0.95), "auto_assign");
    assert.equal(scoreToDecision(0.9499), "low_confidence");
  });

  it("matches themes to best candidate topics", () => {
    const matches = matchThemesToTopics(themeEmbeddings(), topicEmbeddings());

    assert.equal(matches[0].theme, "Investment in AI Infrastructure");
    assert.equal(matches[0].selected_topic, "ai");
    assert.equal(matches[0].candidate_topic_id, "ai");
    assert.equal(matches[0].confidence, 1);
    assert.equal(matches[0].decision, "auto_assign");
    assert.equal(matches[0].match_reason, "semantic_similarity + category_alignment + variant_match");
    assert.equal(matches[0].candidates[0].topic_id, "ai");
    assert.equal(matches[0].candidates[0].category_bonus, 0.1);
    assert.equal(matches[0].candidates[0].variant_bonus, 0.1);
  });

  it("returns top-3 candidates ordered by final score", () => {
    const matches = matchThemesToTopics(themeEmbeddings(), {
      ...topicEmbeddings(),
      topics: [
        ...topicEmbeddings().topics,
        {
          topic_id: "cloud",
          topic_name: "Cloud",
          description: "Cloud services.",
          embedding: [0.9, 0.1],
        },
        {
          topic_id: "competition",
          topic_name: "Competition",
          description: "Competitive pressure.",
          embedding: [0.4, 0.6],
        },
      ],
    });

    assert.equal(matches[0].candidates.length, 3);
    assert.deepEqual(
      matches[0].candidates.map((candidate) => candidate.rank),
      [1, 2, 3],
    );
    assert.ok(matches[0].candidates[0].final_score >= matches[0].candidates[1].final_score);
    assert.ok(matches[0].candidates[1].final_score >= matches[0].candidates[2].final_score);
  });

  it("prefers specific topics through category and variant scoring", () => {
    const matches = matchThemesToTopics(themeEmbeddings(), topicEmbeddingsWithBroadInvestmentTopic());

    assert.equal(matches[0].selected_topic, "ai");
    assert.equal(matches[0].candidates[0].variant_bonus, 0.1);
    assert.equal(matches[0].candidates[1].variant_bonus, 0);
  });

  it("logs structured semantic matching context", () => {
    const originalLog = console.log;
    const messages: string[] = [];

    console.log = (message?: unknown) => {
      messages.push(String(message));
    };

    try {
      createLogger("semantic-topic-match").info("Semantic topic match.", {
        ticker: "MSFT",
        filing_date: "2026-04-29",
        theme: "Cloud Revenue Growth",
        candidate_topic: "cloud",
        cosine_similarity: 0.74,
        category_bonus: 0.1,
        variant_bonus: 0.1,
        final_score: 0.94,
        duration_ms: 12,
      });
    } finally {
      console.log = originalLog;
    }

    const parsed = JSON.parse(messages[0]) as Record<string, unknown>;

    assert.equal(parsed.level, "INFO");
    assert.equal(parsed.component, "semantic-topic-match");
    assert.equal(parsed.candidate_topic, "cloud");
    assert.equal(parsed.final_score, 0.94);
    assert.equal(parsed.duration_ms, 12);
  });

  it("registry includes expanded canonical topics", async () => {
    const registry = JSON.parse(await readFile(join(process.cwd(), "data", "registry", "topics.json"), "utf8")) as {
      topics: Array<{ topic_id: string; supported_categories?: string[]; description?: string }>;
    };
    const topicIds = registry.topics.map((topic) => topic.topic_id);

    for (const topicId of [
      "artificial_intelligence",
      "cloud",
      "competition",
      "growth",
      "margins",
      "investments",
      "macroeconomic",
    ]) {
      assert.ok(topicIds.includes(topicId), `Expected registry to include ${topicId}`);
    }

    const aiTopic = registry.topics.find((topic) => topic.topic_id === "artificial_intelligence");
    assert.ok(aiTopic?.description);
    assert.ok(aiTopic.supported_categories?.includes("investments"));
  });
});

function buildTheme(): Theme {
  return {
    theme: "Investment in AI Infrastructure",
    category: "investments",
    importance: "high",
    summary: "AI infrastructure investment summary",
    evidence: ["chunk_001"],
  };
}

function topicEmbeddings(): TopicEmbeddingRegistry {
  return {
    generated_at: "2026-06-03T00:00:00.000Z",
    embedding_model: "text-embedding-3-small",
    input_hash: "hash-1",
    topics: [
      {
        topic_id: "ai",
        topic_name: "Artificial Intelligence",
        description: "AI products and AI infrastructure.",
        supported_categories: ["artificial_intelligence", "investments"],
        theme_variants: ["Investment in AI Infrastructure"],
        embedding: [1, 0],
      },
      {
        topic_id: "foreign_exchange",
        topic_name: "Foreign Exchange",
        description: "Currency and exchange-rate effects.",
        supported_categories: ["liquidity", "macroeconomic"],
        theme_variants: ["Foreign Exchange Impact", "Foreign Exchange Rate Risks"],
        embedding: [0, 1],
      },
    ],
  };
}

function topicEmbeddingsWithBroadInvestmentTopic(): TopicEmbeddingRegistry {
  return {
    generated_at: "2026-06-03T00:00:00.000Z",
    embedding_model: "text-embedding-3-small",
    input_hash: "hash-1",
    topics: [
      {
        topic_id: "investments",
        topic_name: "Investments",
        description: "Broad investment strategy.",
        supported_categories: ["investments"],
        embedding: [1, 0],
      },
      {
        topic_id: "ai",
        topic_name: "Artificial Intelligence",
        description: "AI products and AI infrastructure.",
        supported_categories: ["artificial_intelligence", "investments", "growth"],
        theme_variants: ["Investment in AI Infrastructure"],
        embedding: [0.98, 0.02],
      },
    ],
  };
}

function themeEmbeddings(): ThemeEmbeddingFile {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    generated_at: "2026-06-03T00:00:00.000Z",
    embedding_model: "text-embedding-3-small",
    input_hash: "hash-1",
    themes: [
      {
        theme: "Investment in AI Infrastructure",
        category: "investments",
        summary: "AI infrastructure investment summary",
        embedding: [1, 0],
      },
    ],
  };
}
