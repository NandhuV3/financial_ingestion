import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assignTopicsToThemeOutput } from "../src/topic-layer/assign-topics.js";
import { buildTopicCandidates } from "../src/topic-layer/generate-topic-report.js";
import { findTopicForTheme } from "../src/topic-layer/topic-registry.js";
import type { TopicRegistry } from "../src/topic-layer/topic.types.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("topic layer", () => {
  it("loads matching topics from registry definitions", () => {
    const topic = findTopicForTheme({
      category: "investments",
      theme: "Investment in AI Infrastructure",
      registry: registry(),
    });

    assert.equal(topic?.topic_id, "ai");
  });

  it("assigns topic IDs without overwriting original theme metadata", () => {
    const output = assignTopicsToThemeOutput(themeOutput([
      theme("Investment in AI Infrastructure", "investments"),
      theme("Foreign Exchange Rate Risks", "liquidity"),
    ]), registry());

    assert.equal(output.themes[0].topic_id, "ai");
    assert.equal(output.themes[0].theme, "Investment in AI Infrastructure");
    assert.equal(output.themes[0].category, "investments");
    assert.equal(output.themes[1].topic_id, "foreign_exchange");
  });

  it("generates deterministic topic candidates from recurring concepts", () => {
    const candidates = buildTopicCandidates([
      {
        filing_date: "2026-01-28",
        theme: theme("Artificial Intelligence Integration", "artificial_intelligence"),
      },
      {
        filing_date: "2026-04-29",
        theme: theme("Investment in AI Infrastructure", "investments"),
      },
      {
        filing_date: "2026-01-28",
        theme: theme("Foreign Exchange Rate Risks", "liquidity"),
      },
      {
        filing_date: "2026-04-29",
        theme: theme("Foreign Exchange Impact", "macroeconomic"),
      },
    ]);

    assert.deepEqual(
      candidates.map((candidate) => candidate.candidate_id),
      ["artificial_intelligence", "foreign_exchange"],
    );
    assert.deepEqual(candidates[0].categories, ["artificial_intelligence", "investments"]);
  });

  it("marks unknown topics when no registry definition matches", () => {
    const output = assignTopicsToThemeOutput(themeOutput([
      theme("Unmapped Theme", "unmapped_category"),
    ]), registry());

    assert.equal(output.themes[0].topic_id, null);
  });
});

function registry(): TopicRegistry {
  return {
    topics: [
      {
        topic_id: "ai",
        topic_name: "Artificial Intelligence",
        categories: ["artificial_intelligence", "investments"],
        theme_variants: [
          "Artificial Intelligence Integration",
          "Impact of AI on Product Development",
          "Investment in AI Infrastructure",
        ],
      },
      {
        topic_id: "foreign_exchange",
        topic_name: "Foreign Exchange",
        categories: ["liquidity", "macroeconomic"],
        theme_variants: ["Foreign Exchange Impact", "Foreign Exchange Rate Risks"],
      },
    ],
  };
}

function themeOutput(themes: Theme[]): ThemeOutput {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    themes,
  };
}

function theme(themeName: string, category: string): Theme {
  return {
    theme: themeName,
    category,
    importance: "medium",
    summary: `${themeName} summary`,
    evidence: ["chunk_001"],
  };
}
