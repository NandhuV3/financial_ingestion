import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHeadline } from "../src/insights/build-headline.js";
import {
  buildExecutiveSummary,
  buildKeyChanges,
  buildNewTopics,
  buildOpportunities,
  buildRemovedTopics,
  buildRisks,
} from "../src/insights/build-key-changes.js";
import type { QuarterChangeReport } from "../src/change-engine/change.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("investor insights", () => {
  it("builds deterministic insight sections from quarter changes", () => {
    const changeReport = report();
    const themes = themeOutput([
      theme("Cloud Revenue Growth", "growth", "high"),
      theme("Investment in AI Infrastructure", "investments", "high"),
      theme("Competitive Market Landscape", "competition", "high"),
    ]);
    const keyChanges = buildKeyChanges(changeReport);
    const risks = buildRisks(changeReport, themes);
    const opportunities = buildOpportunities(changeReport, themes);

    assert.equal(
      buildHeadline(changeReport, themes),
      "Microsoft shows cloud revenue growth while managing competition pressures.",
    );
    assert.deepEqual(buildNewTopics(changeReport), ["investments"]);
    assert.deepEqual(buildRemovedTopics(changeReport), ["regulation"]);
    assert.ok(keyChanges.includes("investments emerged as a new category."));
    assert.ok(keyChanges.includes("margins importance decreased from high to medium."));
    assert.ok(risks.includes("competition received more supporting references (2 -> 3)."));
    assert.ok(opportunities.includes("Investment in AI Infrastructure remains high importance in the current filing."));
    assert.match(
      buildExecutiveSummary({ changeReport, keyChanges, risks, opportunities }),
      /Microsoft's 2026-04-29 filing shows 1 new categories and 1 removed categories/,
    );
  });
});

function report(): QuarterChangeReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    previous_filing: metadata("2026-01-28"),
    current_filing: metadata("2026-04-29"),
    summary: {
      new_categories: 1,
      removed_categories: 1,
      importance_increases: 0,
      importance_decreases: 1,
      evidence_increases: 1,
      evidence_decreases: 0,
    },
    changes: [
      {
        change_type: "NEW_CATEGORY",
        category: "investments",
        previous_importance: null,
        current_importance: "high",
        previous_evidence_count: 0,
        current_evidence_count: 4,
        previous_theme_names: [],
        current_theme_names: ["Investment in AI Infrastructure"],
      },
      {
        change_type: "REMOVED_CATEGORY",
        category: "regulation",
        previous_importance: "high",
        current_importance: null,
        previous_evidence_count: 2,
        current_evidence_count: 0,
        previous_theme_names: ["Regulatory Scrutiny"],
        current_theme_names: [],
      },
      {
        change_type: "IMPORTANCE_DECREASED",
        category: "margins",
        previous_importance: "high",
        current_importance: "medium",
        previous_evidence_count: 2,
        current_evidence_count: 2,
        previous_theme_names: ["Margin Pressure"],
        current_theme_names: ["R&D Expenses and Margins"],
      },
      {
        change_type: "EVIDENCE_INCREASED",
        category: "competition",
        previous_importance: "high",
        current_importance: "high",
        previous_evidence_count: 2,
        current_evidence_count: 3,
        previous_theme_names: ["Competitive Pressure"],
        current_theme_names: ["Competitive Market Landscape"],
      },
    ],
    topic_changes: [],
    topic_summary: {
      persisted_topics: 0,
      evolved_topics: 0,
      intensified_topics: 0,
      weakened_topics: 0,
    },
  };
}

function metadata(filingDate: string): FilingMetadata {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `test-${filingDate}`,
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

function theme(name: string, category: string, importance: "high" | "medium" | "low"): Theme {
  return {
    theme: name,
    category,
    importance,
    summary: `${name} summary`,
    evidence: ["chunk_001"],
  };
}
