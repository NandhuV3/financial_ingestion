import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeCategoryPersistence,
  buildCategoryStability,
  sortFilingThemeSnapshots,
  trackImportanceChanges,
} from "../src/analysis/msft-quarter-review.js";
import type { Theme } from "../src/types/theme.types.js";

describe("quarter review analysis", () => {
  it("sorts filing theme snapshots chronologically", () => {
    const snapshots = sortFilingThemeSnapshots([
      snapshot("2026-04-29", []),
      snapshot("2025-10-29", []),
      snapshot("2026-01-28", []),
    ]);

    assert.deepEqual(
      snapshots.map((item) => item.filing_date),
      ["2025-10-29", "2026-01-28", "2026-04-29"],
    );
  });

  it("groups themes by category across quarters", () => {
    const categories = buildCategoryStability([
      snapshot("2026-01-28", [
        theme("Cloud Growth", "growth", "high"),
        theme("Competitive Pressure", "competition", "medium"),
      ]),
      snapshot("2026-04-29", [
        theme("AI Cloud Growth", "growth", "high"),
        theme("Competitive Landscape", "competition", "high"),
      ]),
    ]);

    const competition = categories.find((category) => category.category === "competition");

    assert.ok(competition);
    assert.deepEqual(competition.quarters_present, ["2026-01-28", "2026-04-29"]);
    assert.deepEqual(competition.theme_names_used, ["Competitive Landscape", "Competitive Pressure"]);
    assert.deepEqual(competition.importance_values_used, ["medium", "high"]);
  });

  it("tracks importance changes per category", () => {
    const changes = trackImportanceChanges([
      {
        filing_date: "2026-01-28",
        theme_names: ["Supply Chain Risk"],
        importance_values: ["medium"],
        highest_importance: "medium",
      },
      {
        filing_date: "2026-04-29",
        theme_names: ["Supply Chain Constraints"],
        importance_values: ["high"],
        highest_importance: "high",
      },
    ]);

    assert.deepEqual(changes, [
      {
        from_filing_date: "2026-01-28",
        to_filing_date: "2026-04-29",
        from_importance: "medium",
        to_importance: "high",
        direction: "increased",
      },
    ]);
  });

  it("calculates category persistence", () => {
    const filingDates = ["2026-01-28", "2026-04-29", "2026-07-29"];
    const categories = buildCategoryStability([
      snapshot("2026-01-28", [
        theme("Cloud Growth", "growth", "high"),
        theme("Cyber Risk", "cybersecurity", "medium"),
      ]),
      snapshot("2026-04-29", [
        theme("Cloud Growth", "growth", "high"),
        theme("AI Investment", "investments", "medium"),
      ]),
      snapshot("2026-07-29", [
        theme("Cloud Growth", "growth", "high"),
        theme("AI Investment", "investments", "high"),
      ]),
    ]);

    const persistence = analyzeCategoryPersistence(categories, filingDates);

    assert.deepEqual(persistence.present_all_quarters, ["growth"]);
    assert.deepEqual(persistence.appearing_only_once, ["cybersecurity"]);
    assert.deepEqual(persistence.newly_introduced, ["investments"]);
    assert.deepEqual(persistence.disappearing, ["cybersecurity"]);
  });
});

function snapshot(filingDate: string, themes: Theme[]) {
  return {
    filing_date: filingDate,
    company: "Microsoft",
    ticker: "MSFT",
    themes,
  };
}

function theme(name: string, category: string, importance: "high" | "medium" | "low"): Theme {
  return {
    theme: name,
    category,
    importance,
    summary: `${name} summary`,
    evidence: ["chunk_001"],
  };
}
