import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildHealthDashboardEvidence } from "../src/health-dashboard/build-health-dashboard-evidence.js";
import { calculateBusinessHealthEvidenceHash } from "../src/health-dashboard/enrichment/build-health-dashboard-enrichment-prompt.js";
import {
  decideHealthDashboardEnrichment,
  validateHealthDashboardEnrichmentOutput,
} from "../src/health-dashboard/enrichment/enrich-health-dashboard.js";
import type { PartnerSourceArtifacts } from "../src/partner-domain/partner-source.types.js";

describe("business health dashboard enrichment", () => {
  it("builds deterministic evidence without user-facing narrative synthesis", () => {
    const evidence = buildHealthDashboardEvidence(artifacts(), "improving");

    assert.equal(evidence.company, "Microsoft");
    assert.equal(evidence.health_status, "improving");
    assert.equal(evidence.strengthening_signals[0]?.raw_label, "Investment in AI Infrastructure");
    assert.equal(evidence.watch_signals[0]?.raw_label, "Margin Pressure");
    assert.equal("explanation" in evidence, false);
  });

  it("hashes business health evidence deterministically without generated_at", () => {
    const first = buildHealthDashboardEvidence(artifacts(), "improving");
    const second = {
      ...first,
      generated_at: "2099-01-01T00:00:00.000Z",
    };

    assert.equal(calculateBusinessHealthEvidenceHash(first), calculateBusinessHealthEvidenceHash(second));
  });

  it("skips enrichment when evidence hash is unchanged", () => {
    const decision = decideHealthDashboardEnrichment({
      enrichedExists: true,
      previousInputHash: "abc",
      currentInputHash: "abc",
    });

    assert.equal(decision.shouldGenerate, false);
    assert.equal(decision.status, "skipped");
    assert.equal(decision.reason, "evidence_unchanged");
  });

  it("generates enrichment when output is missing or evidence changes", () => {
    const missing = decideHealthDashboardEnrichment({
      enrichedExists: false,
      previousInputHash: null,
      currentInputHash: "abc",
    });
    const changed = decideHealthDashboardEnrichment({
      enrichedExists: true,
      previousInputHash: "old",
      currentInputHash: "new",
    });

    assert.equal(missing.shouldGenerate, true);
    assert.equal(changed.shouldGenerate, true);
    assert.equal(changed.reason, "evidence_changed");
  });

  it("validates and trims enriched narrative output", () => {
    const output = validateHealthDashboardEnrichmentOutput({
      explanation: " Cloud demand strengthened while margin pressure should be monitored. ",
      strengthening_areas: [
        {
          title: " Cloud demand ",
          explanation: " Customers are using more cloud infrastructure. ",
        },
      ],
      watch_areas: [
        {
          title: " Cost discipline ",
          explanation: " AI infrastructure spending can pressure what remains after costs. ",
        },
      ],
    });

    assert.equal(output.explanation, "Cloud demand strengthened while margin pressure should be monitored.");
    assert.equal(output.strengthening_areas[0]?.title, "Cloud demand");
    assert.equal(output.watch_areas[0]?.explanation, "AI infrastructure spending can pressure what remains after costs.");
  });
});

function artifacts(): PartnerSourceArtifacts {
  return {
    filing: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      form_type: "10-Q",
      accession_number: "0000000000-00-000000",
    },
    companyProfile: {
      company: "Microsoft",
      products: ["cloud services"],
      customers: ["businesses"],
      business_risks: ["competition"],
      themes: ["Investment in AI Infrastructure"],
      topics: ["artificial_intelligence"],
      source_filings: ["2026-04-29"],
      profile_quality: "raw",
    },
    companyIdentity: null,
    themes: null,
    topicAssignments: null,
    insight: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      previous_filing_date: "2026-01-28",
      headline: "Microsoft business health changed.",
      executive_summary: "Cloud activity remained important.",
      key_changes: [],
      new_topics: [],
      removed_topics: [],
      risks: ["competition received more supporting references (2 -> 3)."],
      opportunities: [],
      source: {
        current_filing: {
          company: "Microsoft",
          ticker: "MSFT",
          filing_date: "2026-04-29",
          form_type: "10-Q",
          accession_number: "0000000000-00-000000",
        },
        previous_filing: null,
        quarter_change_report: "comparison/quarter-change-report.json",
        themes: "intelligence/themes.json",
      },
    },
    narrative: null,
    quarterChange: {
      company: "Microsoft",
      ticker: "MSFT",
      previous_filing: null,
      current_filing: {
        company: "Microsoft",
        ticker: "MSFT",
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000000000-00-000000",
      },
      summary: {
        new_categories: 0,
        removed_categories: 0,
        importance_increases: 1,
        importance_decreases: 0,
        evidence_increases: 0,
        evidence_decreases: 1,
      },
      changes: [
        {
          change_type: "IMPORTANCE_INCREASED",
          category: "artificial_intelligence",
          previous_importance: "medium",
          current_importance: "high",
          previous_evidence_count: 1,
          current_evidence_count: 3,
          previous_theme_names: ["Artificial Intelligence Integration"],
          current_theme_names: ["Investment in AI Infrastructure"],
        },
        {
          change_type: "EVIDENCE_DECREASED",
          category: "margins",
          previous_importance: "high",
          current_importance: "medium",
          previous_evidence_count: 4,
          current_evidence_count: 2,
          previous_theme_names: ["Margin Pressure"],
          current_theme_names: ["Margin Pressure"],
        },
      ],
      topic_changes: [],
      topic_summary: {
        persisted_topics: 0,
        evolved_topics: 0,
        intensified_topics: 0,
        weakened_topics: 0,
      },
    },
    topicEvolution: null,
    healthDashboardEnriched: null,
  };
}
