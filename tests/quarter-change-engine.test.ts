import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareFilings } from "../src/change-engine/compare-filings.js";
import type { ComparisonInput } from "../src/comparison/comparison.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";
import type { Theme, ThemeOutput } from "../src/types/theme.types.js";

describe("quarter change engine", () => {
  it("detects category, importance, evidence, and summary changes", () => {
    const report = compareFilings(buildComparisonInput());

    assert.ok(findChange(report.changes, "NEW_CATEGORY", "product_quality"));
    assert.ok(findChange(report.changes, "REMOVED_CATEGORY", "regulation"));

    const importanceIncrease = findChange(report.changes, "IMPORTANCE_INCREASED", "supply_chain");
    assert.ok(importanceIncrease);
    assert.equal(importanceIncrease.previous_importance, "medium");
    assert.equal(importanceIncrease.current_importance, "high");

    const importanceDecrease = findChange(report.changes, "IMPORTANCE_DECREASED", "margins");
    assert.ok(importanceDecrease);
    assert.equal(importanceDecrease.previous_importance, "high");
    assert.equal(importanceDecrease.current_importance, "medium");

    const evidenceIncrease = findChange(report.changes, "EVIDENCE_INCREASED", "competition");
    assert.ok(evidenceIncrease);
    assert.equal(evidenceIncrease.previous_evidence_count, 1);
    assert.equal(evidenceIncrease.current_evidence_count, 3);

    const evidenceDecrease = findChange(report.changes, "EVIDENCE_DECREASED", "cybersecurity");
    assert.ok(evidenceDecrease);
    assert.equal(evidenceDecrease.previous_evidence_count, 3);
    assert.equal(evidenceDecrease.current_evidence_count, 1);

    assert.deepEqual(report.summary, {
      new_categories: 1,
      removed_categories: 1,
      importance_increases: 1,
      importance_decreases: 1,
      evidence_increases: 1,
      evidence_decreases: 1,
    });
  });
});

function buildComparisonInput(): ComparisonInput {
  const previousMetadata = metadata("2026-01-28");
  const currentMetadata = metadata("2026-04-29");
  const previousThemes = themeOutput("2026-01-28", [
    theme("Growth", "growth", "high", ["g1"]),
    theme("Competition", "competition", "high", ["c1"]),
    theme("Cybersecurity", "cybersecurity", "high", ["s1", "s2", "s3"]),
    theme("Supply Chain", "supply_chain", "medium", ["sc1"]),
    theme("Margins", "margins", "high", ["m1"]),
    theme("Regulation", "regulation", "medium", ["r1"]),
  ]);
  const currentThemes = themeOutput("2026-04-29", [
    theme("Growth", "growth", "high", ["g1"]),
    theme("Competition", "competition", "high", ["c1", "c2", "c3"]),
    theme("Cybersecurity", "cybersecurity", "high", ["s1"]),
    theme("Supply Chain", "supply_chain", "high", ["sc1"]),
    theme("Margins", "margins", "medium", ["m1"]),
    theme("Product Quality", "product_quality", "medium", ["p1"]),
  ]);

  return {
    metadata: {
      ticker: "MSFT",
      current_filing_date: "2026-04-29",
      previous_filing_date: "2026-01-28",
    },
    previousFiling: {
      metadata: previousMetadata,
      themes: previousThemes,
    },
    currentFiling: {
      metadata: currentMetadata,
      themes: currentThemes,
    },
    previousThemes,
    currentThemes,
  };
}

function findChange(
  changes: ReturnType<typeof compareFilings>["changes"],
  changeType: string,
  category: string,
) {
  return changes.find((change) => change.change_type === changeType && change.category === category);
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

function themeOutput(filingDate: string, themes: Theme[]): ThemeOutput {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    themes,
  };
}

function theme(name: string, category: string, importance: "low" | "medium" | "high", evidence: string[]): Theme {
  return {
    theme: name,
    category,
    importance,
    summary: `${name} summary`,
    evidence,
  };
}
