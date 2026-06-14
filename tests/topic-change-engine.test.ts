import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compareTopics } from "../src/change-engine/compare-topics.js";
import { deriveQuarterTopicChangesFromEvolution } from "../src/change-engine/derive-quarter-topic-changes-from-evolution.js";
import { loadTopicEvolutionReport } from "../src/change-engine/generate-quarter-change-report.js";
import type { TopicAwareThemeOutput } from "../src/change-engine/topic-change.types.js";
import type { TopicEvolutionReport, TopicObservation } from "../src/topic-evolution/topic-evolution.types.js";
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

  it("derives persisted topic changes from Topic Evolution history", () => {
    const changes = deriveQuarterTopicChangesFromEvolution(
      evolutionReport([
        topicEvolution("cloud", [
          observation("2026-01-28", true, "high", 3, ["growth"], ["Cloud Growth"]),
          observation("2026-04-29", true, "high", 3, ["growth"], ["Cloud Growth"]),
        ]),
      ]),
      "2026-01-28",
      "2026-04-29",
    );

    assert.ok(findTopicChange(changes, "TOPIC_PERSISTED", "cloud"));
  });

  it("derives intensified and weakened topic changes from Topic Evolution history", () => {
    const changes = deriveQuarterTopicChangesFromEvolution(
      evolutionReport([
        topicEvolution("cloud", [
          observation("2026-01-28", true, "medium", 2, ["growth"], ["Cloud Growth"]),
          observation("2026-04-29", true, "high", 3, ["growth"], ["Cloud Growth"]),
        ]),
        topicEvolution("margins", [
          observation("2026-01-28", true, "high", 4, ["margins"], ["Margin Pressure"]),
          observation("2026-04-29", true, "medium", 2, ["margins"], ["Margin Pressure"]),
        ]),
      ]),
      "2026-01-28",
      "2026-04-29",
    );

    assert.ok(findTopicChange(changes, "TOPIC_INTENSIFIED", "cloud"));
    assert.ok(findTopicChange(changes, "TOPIC_WEAKENED", "margins"));
  });

  it("derives new and disappeared topic changes from Topic Evolution history", () => {
    const changes = deriveQuarterTopicChangesFromEvolution(
      evolutionReport([
        topicEvolution("artificial_intelligence", [
          observation("2026-01-28", false, null, 0, [], []),
          observation("2026-04-29", true, "high", 3, ["investments"], ["AI Infrastructure"]),
        ]),
        topicEvolution("competition", [
          observation("2026-01-28", true, "high", 3, ["competition"], ["Competition"]),
          observation("2026-04-29", false, null, 0, [], []),
        ]),
      ]),
      "2026-01-28",
      "2026-04-29",
    );

    const newTopic = findTopicChange(changes, "TOPIC_NEW", "artificial_intelligence");
    const disappearedTopic = findTopicChange(changes, "TOPIC_DISAPPEARED", "competition");

    assert.ok(newTopic);
    assert.deepEqual(newTopic.current_categories, ["investments"]);
    assert.ok(disappearedTopic);
    assert.deepEqual(disappearedTopic.previous_categories, ["competition"]);
  });

  it("throws when Topic Evolution history is missing required filing dates", () => {
    assert.throws(
      () => deriveQuarterTopicChangesFromEvolution(
        evolutionReport([
          topicEvolution("cloud", [
            observation("2026-01-28", true, "high", 3, ["growth"], ["Cloud Growth"]),
          ]),
        ]),
        "2026-01-28",
        "2026-04-29",
      ),
      /missing filing 2026-04-29 for topic cloud/,
    );
  });

  it("throws when the Topic Evolution report artifact is missing", async () => {
    await withTempWorkspace(async () => {
      await assert.rejects(
        () => loadTopicEvolutionReport("MSFT"),
        /Missing topic-evolution-report\.json.*generate:topic-evolution/s,
      );
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

function evolutionReport(topics: TopicEvolutionReport["topics"]): TopicEvolutionReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    generated_at: "2026-06-13T00:00:00.000Z",
    history_start: "2026-01-28",
    history_end: "2026-04-29",
    filings_analyzed: 2,
    filing_dates: ["2026-01-28", "2026-04-29"],
    topic_registry_version: "test",
    topic_registry_hash: "hash",
    assignment_policy: {
      included_statuses: ["assigned", "low_confidence"],
      excluded_statuses: ["unassigned", "missing"],
    },
    summary: {
      topics_analyzed: topics.length,
      topics_present_latest: topics.filter((topic) => topic.current_status === "present").length,
      new_topics: 0,
      persistent_topics: 0,
      recurring_topics: 0,
      dormant_topics: 0,
      disappeared_topics: 0,
      strengthening_topics: 0,
      weakening_topics: 0,
      stable_topics: 0,
      mixed_topics: 0,
      unknown_trend_topics: 0,
      insufficient_history_topics: 0,
    },
    topics,
    diagnostics: {
      assigned_topics_used: 0,
      unassigned_topics_ignored: 0,
      themes_without_topic_ignored: 0,
      missing_themes_with_topics_files: [],
      filings_with_no_assigned_topics: [],
      duration_ms: 1,
    },
  };
}

function topicEvolution(topicId: string, history: TopicObservation[]): TopicEvolutionReport["topics"][number] {
  const presentObservations = history.filter((item) => item.present);
  const latest = history.at(-1);

  return {
    topic_id: topicId,
    topic_name: topicId,
    presence_state: presentObservations.length === history.length ? "persistent" : "recurring",
    trend_state: "stable",
    current_status: latest?.present ? "present" : "absent",
    first_seen: presentObservations[0]?.filing_date ?? null,
    last_seen: presentObservations.at(-1)?.filing_date ?? null,
    quarters_present: presentObservations.length,
    quarters_absent: history.length - presentObservations.length,
    presence_ratio: history.length === 0 ? 0 : presentObservations.length / history.length,
    strength_history: presentObservations.map((item) => item.topic_strength),
    history,
  };
}

function observation(
  filingDate: string,
  present: boolean,
  importance: ThemeImportance | null,
  evidenceCount: number,
  categories: string[],
  themeNames: string[],
): TopicObservation {
  return {
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `accession-${filingDate}`,
    present,
    importance,
    importance_score: importance ? { low: 1, medium: 2, high: 3 }[importance] : 0,
    evidence_count: evidenceCount,
    theme_count: themeNames.length,
    topic_strength: present ? 20 + evidenceCount : 0,
    theme_names: themeNames,
    categories,
    assignment_statuses: present ? ["assigned"] : [],
    confidence_scores: present ? [0.9] : [],
  };
}

async function withTempWorkspace(callback: () => Promise<void>): Promise<void> {
  const originalCwd = process.cwd();
  const directory = await mkdtemp(join(tmpdir(), "topic-change-engine-"));

  try {
    process.chdir(directory);
    await callback();
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
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
