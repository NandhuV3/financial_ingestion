import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assignTopicsByConfidence, buildTopicAssignments, summarizeAssignments } from "../src/topic-assignment-v2/build-topic-assignments.js";
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

  it("fails fast when semantic-topic-matches.json is missing", async () => {
    await withTempWorkspace(async () => {
      await writeFilingThemeOutput("MSFT", "2026-04-29", themeOutput());

      await assert.rejects(
        () => buildTopicAssignments("MSFT", "2026-04-29"),
        /Missing semantic-topic-matches\.json.*Topic matching has not been executed.*generate:topic-matches/s,
      );
    });
  });

  it("handles an empty semantic-topic-matches.json without pretending matches were loaded", async () => {
    await withTempWorkspace(async () => {
      await writeFilingThemeOutput("MSFT", "2026-04-29", themeOutput());
      await writeSemanticMatchFile("MSFT", "2026-04-29", {
        ...matchFile(),
        matches: [],
      });

      const output = await buildTopicAssignments("MSFT", "2026-04-29");

      assert.deepEqual(summarizeAssignments(output.themes), {
        assigned_count: 0,
        low_confidence_count: 0,
        unassigned_count: 3,
      });
      assert.deepEqual(output.themes.map((theme) => theme.topic_id), [null, null, null]);
    });
  });

  it("writes assigned and low-confidence topics when semantic matches exist", async () => {
    await withTempWorkspace(async () => {
      await writeFilingThemeOutput("MSFT", "2026-04-29", themeOutput());
      await writeSemanticMatchFile("MSFT", "2026-04-29", matchFile());

      const output = await buildTopicAssignments("MSFT", "2026-04-29");
      const stored = JSON.parse(await readFile(topicAssignmentPath("MSFT", "2026-04-29"), "utf8")) as ThemeOutput;

      assert.deepEqual(summarizeAssignments(output.themes), {
        assigned_count: 1,
        low_confidence_count: 1,
        unassigned_count: 1,
      });
      assert.equal(stored.themes.length, 3);
    });
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

async function withTempWorkspace(callback: () => Promise<void>): Promise<void> {
  const originalCwd = process.cwd();
  const directory = await mkdtemp(join(tmpdir(), "topic-assignment-v2-"));

  try {
    process.chdir(directory);
    await callback();
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
}

async function writeFilingThemeOutput(ticker: string, filingDate: string, output: ThemeOutput): Promise<void> {
  const directory = join(process.cwd(), "data", ticker, "filings", filingDate, "intelligence");

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "themes.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

async function writeSemanticMatchFile(ticker: string, filingDate: string, output: SemanticTopicMatchFile): Promise<void> {
  const directory = join(process.cwd(), "data", ticker, "filings", filingDate, "intelligence");

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "semantic-topic-matches.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

function topicAssignmentPath(ticker: string, filingDate: string): string {
  return join(process.cwd(), "data", ticker, "filings", filingDate, "intelligence", "themes.with-topics.json");
}
