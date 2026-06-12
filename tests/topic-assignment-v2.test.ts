import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assignTopicsByConfidence, summarizeAssignments } from "../src/topic-assignment-v2/build-topic-assignments.js";
import type { SemanticTopicMatchFile } from "../src/topic-intelligence/semantic-topic.types.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("topic assignment v2", () => {
  it("assigns topics by confidence thresholds", () => {
    const output = assignTopicsByConfidence({
      themes: themeOutput(),
      matches: matchFile().matches,
    });
    const cloud = output.themes.find((theme) => theme.theme === "Cloud Revenue Growth");
    const ai = output.themes.find((theme) => theme.theme === "Investment in AI Infrastructure");
    const competition = output.themes.find((theme) => theme.theme === "Competitive Market Landscape");

    assert.equal(cloud?.topic_id, "cloud");
    assert.equal(cloud?.assignment_status, "assigned");
    assert.equal(cloud?.assignment_method, "automatic");
    assert.equal(cloud?.recommendation_method, "semantic");
    assert.equal(cloud?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");
    assert.equal(cloud?.confidence, 0.9046);

    assert.equal(ai?.topic_id, "artificial_intelligence");
    assert.equal(ai?.assignment_status, "low_confidence");
    assert.equal(ai?.assignment_method, "automatic");
    assert.equal(ai?.recommendation_method, "semantic");
    assert.equal(ai?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");

    assert.equal(competition?.topic_id, null);
    assert.equal(competition?.assignment_status, "unassigned");
    assert.equal(competition?.assignment_method, null);
    assert.equal(competition?.recommendation_method, "semantic");
    assert.equal(competition?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");
  });

  it("summarizes assignment statuses", () => {
    const output = assignTopicsByConfidence({
      themes: themeOutput(),
      matches: matchFile().matches,
    });

    assert.deepEqual(summarizeAssignments(output.themes), {
      assigned_count: 1,
      low_confidence_count: 1,
      unassigned_count: 1,
    });
  });

  it("marks themes without semantic matches as unassigned", () => {
    const output = assignTopicsByConfidence({
      themes: themeOutput(),
      matches: [],
    });

    assert.deepEqual(output.themes.map((theme) => theme.assignment_status), [
      "unassigned",
      "unassigned",
      "unassigned",
    ]);
    assert.deepEqual(output.themes.map((theme) => theme.topic_id), [null, null, null]);
  });
});

function themeOutput(): ThemeOutput {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    themes: [
      theme("Cloud Revenue Growth", "growth"),
      theme("Investment in AI Infrastructure", "investments"),
      theme("Competitive Market Landscape", "competition"),
    ],
  };
}

function theme(name: string, category: string): Theme {
  return {
    theme: name,
    category,
    importance: "high",
    summary: `${name} summary`,
    evidence: ["chunk_001"],
  };
}

function matchFile(): SemanticTopicMatchFile {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    generated_at: "2026-06-03T00:00:00.000Z",
    embedding_model: "text-embedding-3-small",
    matches: [
      match("Cloud Revenue Growth", "growth", "cloud", 0.9046),
      match("Investment in AI Infrastructure", "investments", "artificial_intelligence", 0.7999),
      match("Competitive Market Landscape", "competition", "competition", 0.6999),
    ],
  };
}

function match(themeName: string, category: string, topicId: string, confidence: number) {
  return {
    theme: themeName,
    category,
    selected_topic: topicId,
    candidate_topic_id: topicId,
    confidence,
    match_reason: "semantic_similarity + category_alignment + variant_match" as const,
    candidates: [
      {
        topic_id: topicId,
        cosine_similarity: confidence - 0.2,
        category_bonus: 0.1,
        variant_bonus: 0.1,
        final_score: confidence,
        rank: 1,
      },
    ],
    decision: "low_confidence" as const,
  };
}
