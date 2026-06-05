import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildBusinessHealth } from "../src/partner-domain/builders/build-business-health.js";
import { buildCompanyProfile } from "../src/partner-domain/builders/build-company-profile.js";
import { buildCompanyStory } from "../src/partner-domain/builders/build-company-story.js";
import { buildCustomerSegments } from "../src/partner-domain/builders/build-customer-segments.js";
import { buildForensicsSignals, toPartnerRiskLanguage } from "../src/partner-domain/builders/build-forensics-signals.js";
import { buildMoneyProfile } from "../src/partner-domain/builders/build-money-profile.js";
import { buildPartnerSummary } from "../src/partner-domain/builders/build-partner-summary.js";
import { buildTrustProfile } from "../src/partner-domain/builders/build-trust-profile.js";
import type { PartnerSourceArtifacts } from "../src/partner-domain/partner-source.types.js";
import type { Theme } from "../src/types/theme.types.js";

describe("partner domain builders", () => {
  it("builds a company profile from narrative and growth themes", () => {
    const profile = buildCompanyProfile(artifacts());

    assert.equal(profile.ticker, "MSFT");
    assert.equal(profile.companyName, "Microsoft");
    assert.equal(profile.tagline, "Microsoft shows cloud revenue growth.");
    assert.equal(profile.whatTheyDo, "Cloud revenue increased as businesses adopted more services.");
    assert.match(profile.whoTheyServe, /Businesses/);
  });

  it("builds the partner summary without exposing internal artifact language", () => {
    const summary = buildPartnerSummary(artifacts(), "stable");

    assert.equal(summary.headline, "Microsoft shows cloud revenue growth.");
    assert.equal(summary.businessHealth, "stable");
    assert.equal(summary.conviction, "high");
    assert.match(summary.summary, /cloud growth/);
  });

  it("builds the story from profile, opportunity, and risk themes", () => {
    const source = artifacts();
    const profile = buildCompanyProfile(source);
    const story = buildCompanyStory(source, profile);

    assert.equal(story.whatTheyDo, profile.whatTheyDo);
    assert.equal(story.whoBuys, profile.whoTheyServe);
    assert.match(story.whyTheyWin, /Cloud revenue/);
    assert.match(story.whatCouldGoWrong, /competition/);
  });

  it("builds customer segments from business, cloud, developer, and AI language", () => {
    const segments = buildCustomerSegments(artifacts());

    assert.ok(segments.some((segment) => segment.customerType === "Businesses and organizations"));
    assert.ok(segments.some((segment) => segment.customerType === "Developers and technology teams"));
  });

  it("builds money profile using plain-language financial labels", () => {
    const money = buildMoneyProfile(artifacts(), "weakening");

    assert.equal(money.dailySales.plainLanguageName, "Daily Sales");
    assert.equal(money.whatsLeftAfterCosts.plainLanguageName, "What's Left After Costs");
    assert.equal(money.loansToExpand.plainLanguageName, "Loans To Expand");
    assert.equal(money.moneyInTheDrawer.plainLanguageName, "Money In The Drawer");
    assert.equal(money.dailySales.status, "weakening");
  });

  it("builds trust profile as partial when trust intelligence is unavailable", () => {
    const trust = buildTrustProfile(artifacts());

    assert.equal(trust.dataAvailability, "partial");
    assert.equal(trust.confidence, "low");
  });

  it("builds forensics signals and sanitizes internal intelligence language", () => {
    const signals = buildForensicsSignals(artifacts());
    const serialized = JSON.stringify(signals).toLowerCase();

    assert.ok(signals.length > 0);
    assert.ok(!serialized.includes("supporting references"));
    assert.ok(!serialized.includes("filing topic"));
    assert.equal(
      toPartnerRiskLanguage("competition received more supporting references (2 -> 3)."),
      "Competition is receiving more attention as a business risk.",
    );
  });

  it("builds improving business health from positive quarter signals", () => {
    const source = artifacts();

    source.quarterChange!.summary.importance_increases = 2;
    source.quarterChange!.summary.evidence_increases = 2;
    source.quarterChange!.summary.importance_decreases = 0;
    source.quarterChange!.summary.evidence_decreases = 0;
    source.quarterChange!.summary.removed_categories = 0;

    assert.equal(buildBusinessHealth(source), "improving");
  });

  it("builds weakening business health from negative quarter signals", () => {
    const source = artifacts();

    source.quarterChange!.summary.importance_increases = 0;
    source.quarterChange!.summary.evidence_increases = 0;
    source.quarterChange!.summary.importance_decreases = 1;
    source.quarterChange!.summary.evidence_decreases = 1;
    source.quarterChange!.summary.removed_categories = 1;

    assert.equal(buildBusinessHealth(source), "weakening");
  });

  it("builds stable business health when positive and negative signals are balanced", () => {
    const source = artifacts();

    source.quarterChange!.summary.importance_increases = 1;
    source.quarterChange!.summary.evidence_increases = 0;
    source.quarterChange!.summary.importance_decreases = 1;
    source.quarterChange!.summary.evidence_decreases = 0;
    source.quarterChange!.summary.removed_categories = 0;

    assert.equal(buildBusinessHealth(source), "stable");
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
    themes: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      themes: [
        theme("Cloud Revenue Growth", "growth", "high", "Cloud revenue increased as businesses adopted more services."),
        theme("Competitive Market Landscape", "competition", "high", "The company faces competition in cloud and AI services."),
        theme("R&D Expenses and Margins", "margins", "medium", "Costs increased as the company invested in AI infrastructure."),
      ],
    },
    insight: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      previous_filing_date: "2026-01-28",
      headline: "Microsoft shows cloud revenue growth.",
      executive_summary: "Microsoft cloud growth remains important for businesses and developer platforms.",
      key_changes: [],
      new_topics: [],
      removed_topics: [],
      risks: [
        "competition received more supporting references (2 -> 3).",
        "Competitive Market Landscape remains high importance in the current filing.",
      ],
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
    narrative: {
      headline: "Microsoft shows cloud revenue growth.",
      executive_summary: "Microsoft serves businesses, organizations, and developers with cloud and AI platforms.",
      what_changed: "Cloud growth remained prominent.",
      bull_case: "The business benefits from cloud demand and AI platform adoption.",
      bear_case: "Competition and cost pressure could weigh on results.",
      investor_takeaway: "Microsoft continues emphasizing cloud growth while managing business risks.",
    },
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
        importance_increases: 0,
        importance_decreases: 0,
        evidence_increases: 0,
        evidence_decreases: 0,
      },
      changes: [],
      topic_changes: [],
      topic_summary: {
        persisted_topics: 0,
        evolved_topics: 0,
        intensified_topics: 0,
        weakened_topics: 0,
      },
    },
    topicEvolution: {
      generated_at: "2026-06-05T00:00:00.000Z",
      summary: {
        strengthening_topics: 0,
        weakening_topics: 0,
        new_topics: 0,
        disappeared_topics: 0,
      },
    },
  };
}

function theme(
  name: string,
  category: string,
  importance: Theme["importance"],
  summary: string,
): Theme {
  return {
    theme: name,
    category,
    importance,
    summary,
    evidence: ["chunk_001"],
  };
}
