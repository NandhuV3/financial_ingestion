import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyTopicApprovals, summarizeAssignments, validateTopicApprovals } from "../src/topic-assignment-v2/apply-approved-topics.js";
import { buildReviewCandidates } from "../src/topic-assignment-v2/build-review-queue.js";
import type { SemanticTopicMatchFile } from "../src/topic-intelligence/semantic-topic.types.js";
import type { TopicApproval } from "../src/topic-assignment-v2/assignment.types.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("topic assignment v2", () => {
  it("builds review candidates from semantic matches", () => {
    const candidates = buildReviewCandidates(matchFile());

    assert.equal(candidates.length, 3);
    assert.equal(candidates[0].ticker, "MSFT");
    assert.equal(candidates[0].filing_date, "2026-04-29");
    assert.equal(candidates[0].reviewed_topic_id, "cloud");
    assert.equal(candidates[0].review_status, "pending_review");
    assert.equal(candidates[0].decision, "pending_review");
    assert.equal(candidates[0].recommendation_method, "semantic");
    assert.equal(candidates[0].recommendation_reason, "semantic_similarity + category_alignment + variant_match");
  });

  it("applies approved assignments only", () => {
    const output = applyTopicApprovals({
      themes: themeOutput(),
      matches: matchFile().matches,
      approvals: [
        approval("Cloud Revenue Growth", "cloud", "approved"),
        approval("Competitive Market Landscape", "competition", "rejected"),
      ],
      ticker: "MSFT",
      filingDate: "2026-04-29",
    });
    const cloud = output.themes.find((theme) => theme.theme === "Cloud Revenue Growth");
    const competition = output.themes.find((theme) => theme.theme === "Competitive Market Landscape");
    const ai = output.themes.find((theme) => theme.theme === "Investment in AI Infrastructure");

    assert.equal(cloud?.topic_id, "cloud");
    assert.equal(cloud?.assignment_status, "approved");
    assert.equal(cloud?.assignment_method, "manual");
    assert.equal(cloud?.recommendation_method, "semantic");
    assert.equal(cloud?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");
    assert.equal(cloud?.confidence, 0.9046);

    assert.equal(competition?.topic_id, null);
    assert.equal(competition?.assignment_status, "rejected");
    assert.equal(competition?.assignment_method, null);
    assert.equal(competition?.recommendation_method, "semantic");
    assert.equal(competition?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");

    assert.equal(ai?.topic_id, null);
    assert.equal(ai?.assignment_status, "pending_review");
    assert.equal(ai?.assignment_method, null);
    assert.equal(ai?.recommendation_method, "semantic");
    assert.equal(ai?.recommendation_reason, "semantic_similarity + category_alignment + variant_match");
  });

  it("summarizes assignment statuses", () => {
    const output = applyTopicApprovals({
      themes: themeOutput(),
      matches: matchFile().matches,
      approvals: [
        approval("Cloud Revenue Growth", "cloud", "approved"),
        approval("Competitive Market Landscape", "competition", "rejected"),
      ],
      ticker: "MSFT",
      filingDate: "2026-04-29",
    });

    assert.deepEqual(summarizeAssignments(output.themes), {
      approved_count: 1,
      pending_count: 1,
      rejected_count: 1,
    });
  });

  it("validates approvals", () => {
    assert.throws(() =>
      validateTopicApprovals([
        {
          theme: "",
          topic_id: "cloud",
          decision: "approved",
          reviewed_at: "2026-06-03T00:00:00.000Z",
        },
      ]),
    );
    assert.throws(() =>
      validateTopicApprovals([
        {
          theme: "Cloud Revenue Growth",
          topic_id: "cloud",
          decision: "pending_review" as "approved",
          reviewed_at: "2026-06-03T00:00:00.000Z",
        },
      ]),
    );
  });
});

function approval(theme: string, topicId: string, decision: TopicApproval["decision"]): TopicApproval {
  return {
    theme,
    topic_id: topicId,
    decision,
    reviewed_at: "2026-06-03T00:00:00.000Z",
    ticker: "MSFT",
    filing_date: "2026-04-29",
  };
}

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
      match("Competitive Market Landscape", "competition", "competition", 0.7588),
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
    decision: "pending_review" as const,
  };
}
