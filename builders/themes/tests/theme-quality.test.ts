import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EvidenceCatalogEntry } from "../../../contracts/artifacts/evidence-catalog-artifact-content.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type { Theme, ThemeCategory } from "../contract.js";
import { evaluateThemeQuality } from "../theme-quality/evaluator.js";
import { validateThemeQualityMetrics } from "../theme-quality/validator.js";

describe("Theme Quality evaluation", () => {
  it("computes count, utilization, unique references, density, and distributions", () => {
    const catalog = evidenceCatalog(4, 2);
    const themes = [
      theme("Cloud growth", "Cloud revenue increased.", "financial", [
        catalog[0]!,
        catalog[1]!,
      ]),
      theme("Competition", "Competition remained intense.", "competition", [
        catalog[4]!,
      ]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.equal(metrics.theme_count, 2);
    assert.equal(metrics.unique_evidence_refs, 3);
    assert.equal(metrics.evidence_utilization, 0.5);
    assert.equal(metrics.theme_density, 0.3333);
    assert.equal(metrics.section_coverage, 1);
    assert.deepEqual(metrics.section_distribution, {
      management_discussion: 2,
      risk_factors: 1,
    });
    assert.equal(metrics.category_distribution.financial, 1);
    assert.equal(metrics.category_distribution.competition, 1);
    assert.equal(metrics.category_distribution.strategy, 0);
  });

  it("calculates deterministic Herfindahl evidence concentration", () => {
    const catalog = evidenceCatalog(2, 0);
    const themes = [
      theme("One", "First observation.", "strategy", [catalog[0]!]),
      theme("Two", "Second observation.", "financial", [catalog[0]!]),
      theme("Three", "Third observation.", "operations", [catalog[0]!]),
      theme("Four", "Fourth observation.", "management", [catalog[1]!]),
    ];

    assert.equal(
      evaluateThemeQuality({ themes, evidenceCatalog: catalog })
        .evidence_concentration,
      0.625,
    );
  });

  it("reports exact duplicates without removing them", () => {
    const catalog = evidenceCatalog(2, 0);
    const themes = [
      theme("AI Investment", "Management discussed AI spending.", "strategy", [
        catalog[0]!,
      ]),
      theme(" ai investment ", "Management  discussed AI spending.", "strategy", [
        catalog[1]!,
      ]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.equal(metrics.duplicate_count, 1);
    assert.equal(metrics.theme_count, 2);
  });

  it("reports deterministic near-overlap candidates", () => {
    const catalog = evidenceCatalog(1, 0);
    const themes = [
      theme(
        "Investment in AI",
        "Management discussed investment in AI infrastructure.",
        "strategy",
        [catalog[0]!],
      ),
      theme(
        "Increased AI Spending",
        "Management discussed increased spending on AI infrastructure.",
        "financial",
        [catalog[0]!],
      ),
    ];

    assert.equal(
      evaluateThemeQuality({ themes, evidenceCatalog: catalog }).overlap_count,
      1,
    );
  });

  it("reconciles emitted metrics and rejects tampering", () => {
    const catalog = evidenceCatalog(2, 1);
    const themes = [
      theme("Cloud growth", "Cloud revenue increased.", "financial", [
        catalog[0]!,
      ]),
    ];
    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.doesNotThrow(() =>
      validateThemeQualityMetrics({ themes, evidenceCatalog: catalog, metrics }));

    assert.throws(
      () => validateThemeQualityMetrics({
        themes,
        evidenceCatalog: catalog,
        metrics: { ...metrics, unique_evidence_refs: 99 },
      }),
      BuilderValidationError,
    );
  });

  it("measures the MSFT-style sparse utilization scenario", () => {
    const catalog = evidenceCatalog(34, 25);
    const selected = [catalog[0]!, catalog[1]!, catalog[34]!, catalog[35]!];
    const themes = [
      theme("Theme 1", "Observation one.", "financial", [selected[0]!]),
      theme("Theme 2", "Observation two.", "financial", [selected[1]!]),
      theme("Theme 3", "Observation three.", "management", [selected[2]!]),
      theme("Theme 4", "Observation four.", "financial", [selected[1]!]),
      theme("Theme 5", "Observation five.", "regulatory", [selected[3]!]),
      theme("Theme 6", "Observation six.", "strategy", [selected[1]!]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.equal(metrics.theme_count, 6);
    assert.equal(metrics.unique_evidence_refs, 4);
    assert.equal(metrics.evidence_utilization, 0.0678);
    assert.equal(metrics.theme_density, 0.1017);
    assert.equal(metrics.evidence_concentration, 0.3333);
  });

  it("observes MD&A-heavy section bias without rejecting it", () => {
    const catalog = evidenceCatalog(4, 2);
    const themes = [
      theme("One", "Observation one.", "financial", [catalog[0]!]),
      theme("Two", "Observation two.", "strategy", [catalog[1]!]),
      theme("Three", "Observation three.", "operations", [catalog[2]!]),
      theme("Four", "Observation four.", "technology", [catalog[3]!]),
      theme("Five", "Observation five.", "regulatory", [catalog[4]!]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.deepEqual(metrics.section_distribution, {
      management_discussion: 4,
      risk_factors: 1,
    });
    assert.equal(metrics.section_coverage, 1);
  });

  it("retains zero counts for unrepresented catalog sections", () => {
    const catalog = evidenceCatalog(2, 2);
    const themes = [
      theme("One", "Observation one.", "financial", [catalog[0]!]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.deepEqual(metrics.section_distribution, {
      management_discussion: 1,
      risk_factors: 0,
    });
    assert.equal(metrics.section_coverage, 0.5);
  });

  it("observes Risk-Factor-heavy section bias without rejecting it", () => {
    const catalog = evidenceCatalog(2, 4);
    const themes = [
      theme("One", "Observation one.", "strategy", [catalog[0]!]),
      theme("Two", "Observation two.", "competition", [catalog[2]!]),
      theme("Three", "Observation three.", "trust", [catalog[3]!]),
      theme("Four", "Observation four.", "regulatory", [catalog[4]!]),
      theme("Five", "Observation five.", "operations", [catalog[5]!]),
    ];

    const metrics = evaluateThemeQuality({ themes, evidenceCatalog: catalog });

    assert.deepEqual(metrics.section_distribution, {
      management_discussion: 1,
      risk_factors: 4,
    });
    assert.equal(metrics.section_coverage, 1);
  });

  it("is deterministic for cloned inputs", () => {
    const catalog = evidenceCatalog(2, 2);
    const themes = [
      theme("Cloud", "Cloud discussion.", "technology", [catalog[0]!]),
      theme("Risk", "Risk discussion.", "regulatory", [catalog[2]!]),
    ];

    assert.deepEqual(
      evaluateThemeQuality({ themes, evidenceCatalog: catalog }),
      evaluateThemeQuality({
        themes: structuredClone(themes),
        evidenceCatalog: structuredClone(catalog),
      }),
    );
  });
});

function evidenceCatalog(
  managementCount: number,
  riskCount: number,
): EvidenceCatalogEntry[] {
  return [
    ...entriesForSection("management_discussion", managementCount),
    ...entriesForSection("risk_factors", riskCount),
  ];
}

function entriesForSection(
  sectionName: string,
  count: number,
): EvidenceCatalogEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    evidence_ref: `evidence:${sectionName}:${index + 1}`,
    evidence_hash: `hash:${sectionName}:${index + 1}`,
    filing_id: "filing-1",
    section_name: sectionName,
    paragraph_index: index + 1,
    paragraph_text: `${sectionName} paragraph ${index + 1}.`,
  }));
}

function theme(
  title: string,
  summary: string,
  category: ThemeCategory,
  evidence: EvidenceCatalogEntry[],
): Theme {
  return {
    theme_id: `${title}:${summary}`,
    title,
    summary,
    category,
    evidence: evidence.map((entry) => ({
      evidence_ref: entry.evidence_ref,
      evidence_hash: entry.evidence_hash,
      section_name: entry.section_name,
      paragraph_index: entry.paragraph_index,
    })),
    evidence_count: evidence.length,
    confidence: 1,
  };
}
