import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTopicEvolutionReport } from "../src/topic-evolution/build-topic-evolution-report.js";
import { classifyPresenceState } from "../src/topic-evolution/classify-topic-evolution.js";
import { calculateTopicStrength, buildStrengthHistory } from "../src/topic-evolution/calculate-topic-strength.js";
import { classifyTopicTrend } from "../src/topic-evolution/classify-topic-trend.js";
import { validateTopicEvolutionInputs } from "../src/topic-evolution/validate-topic-evolution.js";
import type { TopicEvolutionFilingInput, TopicObservation } from "../src/topic-evolution/topic-evolution.types.js";
import type { TopicRegistry } from "../src/topic-layer/topic.types.js";
import type { ThemeImportance } from "../src/types/theme.types.js";

describe("topic evolution", () => {
  it("uses assigned and low-confidence topic assignments", () => {
    const report = buildReport([
      filing("2026-01-29", [
        assignedTheme("Cloud Revenue Growth", "cloud", "high", ["a", "a", "b"]),
        lowConfidenceTheme("AI Infrastructure", "artificial_intelligence"),
        unassignedTheme("Competition", "competition"),
        themeWithoutTopic("Margins"),
      ]),
      filing("2026-04-29", [
        assignedTheme("Cloud Revenue Growth", "cloud", "high", ["c", "d"]),
        lowConfidenceTheme("AI Infrastructure", "artificial_intelligence"),
      ]),
    ]);

    assert.equal(report.summary.topics_analyzed, 2);
    const byTopic = new Map(report.topics.map((topic) => [topic.topic_id, topic]));

    assert.ok(byTopic.has("cloud"));
    assert.ok(byTopic.has("artificial_intelligence"));
    assert.equal(report.diagnostics.assigned_topics_used, 4);
    assert.equal(report.diagnostics.unassigned_topics_ignored, 1);
    assert.equal(report.diagnostics.themes_without_topic_ignored, 1);
    assert.equal(byTopic.get("cloud")?.history[0]?.evidence_count, 2);
  });

  it("aggregates multiple assigned themes into one topic observation", () => {
    const report = buildReport([
      filing("2026-01-29", [
        assignedTheme("Cloud Revenue Growth", "cloud", "medium", ["a", "b"]),
        assignedTheme("Azure Demand", "cloud", "high", ["b", "c"]),
      ]),
      filing("2026-04-29", [
        assignedTheme("Cloud Revenue Growth", "cloud", "high", ["d"]),
      ]),
    ]);
    const cloud = report.topics[0];

    assert.equal(cloud.history[0].importance, "high");
    assert.equal(cloud.history[0].importance_score, 3);
    assert.equal(cloud.history[0].evidence_count, 3);
    assert.equal(cloud.history[0].theme_count, 2);
    assert.equal(cloud.history[0].topic_strength, 35);
    assert.deepEqual(cloud.strength_history, [35, 32]);
    assert.deepEqual(cloud.history[0].theme_names, ["Azure Demand", "Cloud Revenue Growth"]);
  });

  it("detects persistent and strengthening topics", () => {
    const report = buildReport([
      filing("2025-04-30", [assignedTheme("Cloud", "cloud", "medium", ["a", "b"])]),
      filing("2025-07-30", [assignedTheme("Cloud", "cloud", "medium", ["a", "b", "c", "d"])]),
      filing("2025-10-29", [assignedTheme("Cloud", "cloud", "high", ["a", "b", "c", "d", "e", "f"])]),
      filing("2026-04-29", [assignedTheme("Cloud", "cloud", "high", ["a", "b", "c", "d", "e", "f", "g", "h"])]),
    ]);

    assert.equal(report.topics[0].presence_state, "persistent");
    assert.equal(report.topics[0].trend_state, "strengthening");
    assert.equal(report.topics[0].current_status, "present");
    assert.equal(report.summary.persistent_topics, 1);
    assert.equal(report.summary.strengthening_topics, 1);
  });

  it("detects new, recurring, dormant, and disappeared presence states", () => {
    const report = buildReport([
      filing("2025-04-30", [
        assignedTheme("Supply Chain", "supply_chain"),
        assignedTheme("Margins", "margins"),
        assignedTheme("Competition", "competition"),
      ]),
      filing("2025-07-30", [
        assignedTheme("Supply Chain", "supply_chain"),
      ]),
      filing("2025-10-29", [
        assignedTheme("Competition", "competition"),
        assignedTheme("AI", "artificial_intelligence"),
      ]),
    ]);
    const byTopic = new Map(report.topics.map((topic) => [topic.topic_id, topic]));

    assert.equal(byTopic.get("artificial_intelligence")?.presence_state, "new");
    assert.equal(byTopic.get("competition")?.presence_state, "recurring");
    assert.equal(byTopic.get("margins")?.presence_state, "dormant");
    assert.equal(byTopic.get("supply_chain")?.presence_state, "disappeared");
  });

  it("calculates topic strength and strength history", () => {
    assert.equal(calculateTopicStrength({
      importance_score: 3,
      evidence_count: 4,
      theme_count: 1,
    }), 35);

    assert.deepEqual(buildStrengthHistory([
      observation("2026-01-29", true, 3, 4, 1),
      observation("2026-04-29", false, 0, 0, 0),
      observation("2026-07-29", true, 2, 3, 1),
    ]), [35, 24]);
  });

  it("classifies strength trends deterministically", () => {
    assert.equal(classifyTopicTrend([23, 24, 25, 28]).trend_state, "strengthening");
    assert.equal(classifyTopicTrend([36, 34, 32, 30]).trend_state, "weakening");
    assert.equal(classifyTopicTrend([34, 35, 35, 34]).trend_state, "stable");
    assert.equal(classifyTopicTrend([20, 42, 18, 45]).trend_state, "mixed");
    assert.equal(classifyTopicTrend([34]).trend_state, "insufficient_history");
  });

  it("handles missing files, single filing history, and chronological ordering", () => {
    const report = buildReport([
      filing("2026-04-29", [assignedTheme("Cloud", "cloud")]),
      filing("2026-01-29", [], false),
    ]);

    assert.deepEqual(report.filing_dates, ["2026-01-29", "2026-04-29"]);
    assert.equal(report.diagnostics.missing_themes_with_topics_files[0], "2026-01-29");
    assert.equal(report.diagnostics.filings_with_no_assigned_topics[0], "2026-01-29");
    assert.equal(report.topics[0].presence_state, "new");
    assert.deepEqual(report.topics[0].strength_history, [22]);

    assert.equal(classifyPresenceState([observation("2026-04-29", true, 2, 1, 1)]), "insufficient_history");
  });

  it("includes registry audit metadata", () => {
    const report = buildReport([
      filing("2026-01-29", [assignedTheme("Cloud", "cloud")]),
      filing("2026-04-29", [assignedTheme("Cloud", "cloud")]),
    ]);

    assert.equal(report.topic_registry_version, "test-registry");
    assert.equal(report.topic_registry_hash, "registry-hash");
    assert.deepEqual(report.assignment_policy.included_statuses, ["assigned", "low_confidence"]);
  });

  it("validates registry and filing inputs", () => {
    assert.throws(() =>
      validateTopicEvolutionInputs(
        [filing("2026-04-29", [assignedTheme("Cloud", "cloud")])],
        {
          version: "bad-registry",
          topics: [
            topic("cloud", "Cloud"),
            topic("cloud", "Duplicate Cloud"),
          ],
        },
      ),
    );

    assert.throws(() =>
      validateTopicEvolutionInputs(
        [filing("not-a-date", [assignedTheme("Cloud", "cloud")])],
        registry(),
      ),
    );
  });
});

function buildReport(filings: TopicEvolutionFilingInput[]) {
  return buildTopicEvolutionReport({
    filings,
    registry: registry(),
    topicRegistryHash: "registry-hash",
    generatedAt: "2026-06-05T00:00:00.000Z",
    durationMs: 12,
  });
}

function registry(): TopicRegistry {
  return {
    version: "test-registry",
    topics: [
      topic("artificial_intelligence", "Artificial Intelligence"),
      topic("cloud", "Cloud"),
      topic("competition", "Competition"),
      topic("margins", "Margins"),
      topic("supply_chain", "Supply Chain"),
    ],
  };
}

function topic(topicId: string, topicName: string) {
  return {
    topic_id: topicId,
    topic_name: topicName,
  };
}

function filing(filingDate: string, themes: TopicEvolutionFilingInput["themes"], fileExists = true): TopicEvolutionFilingInput {
  return {
    metadata: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: filingDate,
      form_type: "10-Q",
      accession_number: `accession-${filingDate}`,
    },
    themes,
    themes_with_topics_file_exists: fileExists,
  };
}

function assignedTheme(themeName: string, topicId: string, importance: ThemeImportance = "medium", evidence = ["chunk_001"]) {
  return {
    theme: themeName,
    category: topicId,
    importance,
    summary: `${themeName} summary`,
    evidence,
    topic_id: topicId,
    assignment_status: "assigned" as const,
  };
}

function lowConfidenceTheme(themeName: string, topicId: string) {
  return {
    ...assignedTheme(themeName, topicId),
    assignment_status: "low_confidence" as const,
  };
}

function unassignedTheme(themeName: string, topicId: string) {
  return {
    ...assignedTheme(themeName, topicId),
    assignment_status: "unassigned" as const,
  };
}

function themeWithoutTopic(themeName: string) {
  return {
    theme: themeName,
    category: "margins",
    importance: "medium" as const,
    summary: `${themeName} summary`,
    evidence: ["chunk_001"],
    topic_id: null,
  };
}

function observation(
  filingDate: string,
  present: boolean,
  importanceScore: number,
  evidenceCount: number,
  themeCount: number,
): TopicObservation {
  return {
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `accession-${filingDate}`,
    present,
    importance: importanceScore === 3 ? "high" : importanceScore === 2 ? "medium" : importanceScore === 1 ? "low" : null,
    importance_score: importanceScore,
    evidence_count: evidenceCount,
    theme_count: themeCount,
    topic_strength: calculateTopicStrength({
      importance_score: importanceScore,
      evidence_count: evidenceCount,
      theme_count: themeCount,
    }),
    theme_names: present ? ["Theme"] : [],
  };
}
