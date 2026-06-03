import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareTopics } from "../src/change-engine/compare-topics.js";
import type { TopicAwareThemeOutput } from "../src/change-engine/topic-change.types.js";
import type { ThemeImportance } from "../src/types/theme.types.js";

describe("topic change engine", () => {
  it("detects topic persistence", () => {
    const result = compareTopics(
      themeOutput("2026-01-28", [theme("Cloud Growth", "growth", "high", ["a"], "cloud")]),
      themeOutput("2026-04-29", [theme("Cloud Growth", "growth", "high", ["a"], "cloud")]),
    );

    assert.ok(findTopicChange(result.topic_changes, "TOPIC_PERSISTED", "cloud"));
    assert.equal(result.topic_summary.persisted_topics, 1);
  });

  it("detects topic evolution when theme names change", () => {
    const result = compareTopics(
      themeOutput("2026-01-28", [
        theme("Artificial Intelligence Integration", "artificial_intelligence", "high", ["a"], "ai"),
      ]),
      themeOutput("2026-04-29", [
        theme("Investment in AI Infrastructure", "investments", "high", ["a"], "ai"),
      ]),
    );

    assert.ok(findTopicChange(result.topic_changes, "TOPIC_EVOLVED", "ai"));
    assert.equal(result.topic_summary.evolved_topics, 1);
  });

  it("detects topic intensification from importance or evidence increases", () => {
    const result = compareTopics(
      themeOutput("2026-01-28", [theme("Supply Chain Risks", "supply_chain", "medium", ["a"], "supply_chain")]),
      themeOutput("2026-04-29", [
        theme("Supply Chain Risks", "supply_chain", "high", ["a", "b"], "supply_chain"),
      ]),
    );

    const change = findTopicChange(result.topic_changes, "TOPIC_INTENSIFIED", "supply_chain");
    assert.ok(change);
    assert.equal(change.previous_importance, "medium");
    assert.equal(change.current_importance, "high");
    assert.equal(change.previous_evidence_count, 1);
    assert.equal(change.current_evidence_count, 2);
    assert.equal(result.topic_summary.intensified_topics, 1);
  });

  it("detects topic weakening from importance or evidence decreases", () => {
    const result = compareTopics(
      themeOutput("2026-01-28", [theme("Margin Pressure", "margins", "high", ["a", "b"], "margins")]),
      themeOutput("2026-04-29", [theme("Margin Pressure", "margins", "medium", ["a"], "margins")]),
    );

    const change = findTopicChange(result.topic_changes, "TOPIC_WEAKENED", "margins");
    assert.ok(change);
    assert.equal(change.previous_importance, "high");
    assert.equal(change.current_importance, "medium");
    assert.equal(change.previous_evidence_count, 2);
    assert.equal(change.current_evidence_count, 1);
    assert.equal(result.topic_summary.weakened_topics, 1);
  });

  it("does not compare topics when topic IDs are missing", () => {
    const result = compareTopics(
      themeOutput("2026-01-28", [theme("Foreign Exchange Rate Risks", "liquidity", "medium", ["a"])]),
      themeOutput("2026-04-29", [theme("Foreign Exchange Impact", "macroeconomic", "medium", ["a"])]),
    );

    assert.deepEqual(result.topic_changes, []);
    assert.deepEqual(result.topic_summary, {
      persisted_topics: 0,
      evolved_topics: 0,
      intensified_topics: 0,
      weakened_topics: 0,
    });
  });
});

function findTopicChange(
  changes: ReturnType<typeof compareTopics>["topic_changes"],
  changeType: string,
  topicId: string,
) {
  return changes.find((change) => change.change_type === changeType && change.topic_id === topicId);
}

function themeOutput(filingDate: string, themes: TopicAwareThemeOutput["themes"]): TopicAwareThemeOutput {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    themes,
  };
}

function theme(
  name: string,
  category: string,
  importance: ThemeImportance,
  evidence: string[],
  topicId?: string,
): TopicAwareThemeOutput["themes"][number] {
  return {
    theme: name,
    category,
    importance,
    summary: `${name} summary`,
    evidence,
    topic_id: topicId,
  };
}
