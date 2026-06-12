import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBusinessHealth } from "../src/partner-domain/builders/build-business-health.js";
import { buildBusinessHealthDashboard } from "../src/partner-domain/builders/build-owner-business-health.js";
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
  it("keeps business-language helpers free of ticker-specific narratives", () => {
    const content = readFileSync(join(process.cwd(), "src", "partner-domain", "builders", "business-language.ts"), "utf8");

    for (const forbidden of ["MSFT", "AAPL", "AMZN", "GOOGL", "META", "NVDA", "Visa operates", "Microsoft provides"]) {
      assert.equal(content.includes(forbidden), false, `Unexpected ticker-specific language in business-language.ts: ${forbidden}`);
    }
  });

  it("builds a company profile from CompanyKnowledge", () => {
    const profile = buildCompanyProfile(artifacts());

    assert.equal(profile.ticker, "MSFT");
    assert.equal(profile.companyName, "Microsoft");
    assert.match(profile.tagline, /serves businesses, organizations, and developers/);
    assert.match(profile.whatTheyDo, /cloud and AI platforms/);
    assert.match(profile.whoTheyServe, /businesses and organizations/);
    assertNoFilingLanguage(profile);
  });

  it("builds Partner Domain output from CompanyKnowledge", () => {
    const source = artifacts();
    const profile = buildCompanyProfile(source);
    const summary = buildPartnerSummary(source, "stable");
    const story = buildCompanyStory(source, profile);

    assert.match(profile.whatTheyDo, /serves businesses, organizations, and developers/);
    assert.match(summary.summary, /serves businesses, organizations, and developers/);
    assert.match(story.whyTheyWin, /platform ecosystem/);
  });

  it("builds the partner summary without exposing internal artifact language", () => {
    const summary = buildPartnerSummary(artifacts(), "stable");

    assert.match(summary.headline, /serves businesses, organizations, and developers/);
    assert.equal(summary.businessHealth, "stable");
    assert.equal(summary.conviction, "high");
    assert.match(summary.summary, /cloud and AI platforms/);
    assertNoFilingLanguage(summary);
  });

  it("builds the story from business model language instead of quarterly metrics", () => {
    const source = artifacts();
    const profile = buildCompanyProfile(source);
    const story = buildCompanyStory(source, profile);

    assert.equal(story.whatTheyDo, profile.whatTheyDo);
    assert.equal(story.whoBuys, profile.whoTheyServe);
    assert.match(story.whyTheyWin, /platform ecosystem/);
    assert.match(story.whatCouldGoWrong, /competition/);
    assertNoFilingLanguage(story);
    assert.equal(JSON.stringify(story).toLowerCase().includes("revenue increased"), false);
  });

  it("builds customer segments from CompanyKnowledge", () => {
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
    assert.match(money.dailySales.explanation, /businesses and organizations/);
    assertNoFilingLanguage(money);
  });

  it("builds trust profile without exposing implementation gaps", () => {
    const trust = buildTrustProfile(artifacts());

    assert.equal(trust.dataAvailability, "partial");
    assert.equal(trust.confidence, "medium");
    assert.match(trust.managementQuality, /judged/);
    assertNoFilingLanguage(trust);
  });

  it("builds forensics signals and sanitizes internal intelligence language", () => {
    const signals = buildForensicsSignals(artifacts());
    const serialized = JSON.stringify(signals).toLowerCase();

    assert.ok(signals.length > 0);
    assert.ok(!serialized.includes("supporting references"));
    assert.ok(!serialized.includes("filing topic"));
    assert.equal(signals.filter((signal) => signal.label === "Competition").length, 1);
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

  it("builds owner-facing business health dashboard details from domain signals", () => {
    const source = artifacts();

    source.quarterChange!.changes = [
      {
        change_type: "IMPORTANCE_INCREASED",
        category: "artificial_intelligence",
        previous_importance: "medium",
        current_importance: "high",
        previous_evidence_count: 2,
        current_evidence_count: 4,
        previous_theme_names: ["Artificial Intelligence Integration"],
        current_theme_names: ["Investment in AI Infrastructure"],
      },
      {
        change_type: "EVIDENCE_DECREASED",
        category: "margins",
        previous_importance: "high",
        current_importance: "medium",
        previous_evidence_count: 5,
        current_evidence_count: 2,
        previous_theme_names: ["Margin Pressure"],
        current_theme_names: ["Margin Pressure"],
      },
    ];

    const dashboard = buildBusinessHealthDashboard(source, "improving");

    assert.equal(dashboard.status, "improving");
    assert.ok(dashboard.explanation.includes("Investment In AI Infrastructure"));
    assert.ok(dashboard.strengtheningAreas.some((area) => area.title === "Investment In AI Infrastructure"));
    assert.ok(dashboard.watchAreas.some((area) => area.title === "Margin Pressure"));
    assert.deepEqual(dashboard.timeline.map((point) => point.label), [
      "Current Filing",
      "Previous Filing",
      "Older Filing",
    ]);
  });

  it("renders Apple from supplied CompanyKnowledge without ticker-specific code", () => {
    const source = artifacts({
      company: "Apple",
      ticker: "AAPL",
      companyKnowledge: companyKnowledge("Apple", {
        business_description: "Apple sells consumer devices, software products, and digital services used by consumers and creators.",
        products: ["consumer devices", "software products", "digital services"],
        customers: ["consumers", "creators and media partners"],
        revenue_drivers: ["device sales", "software services"],
        competitive_positioning: [
          { signal: "platform ecosystem", source_type: "observed" },
          { signal: "brand trust and customer loyalty", source_type: "observed" },
        ],
        operating_model: ["global distribution network"],
        risks: ["supply chain and manufacturing", "regulation and antitrust"],
      }),
    });

    const profile = buildCompanyProfile(source);
    const story = buildCompanyStory(source, profile);
    const customers = buildCustomerSegments(source);

    assert.equal(profile.ticker, "AAPL");
    assert.match(profile.whatTheyDo, /consumer devices/);
    assert.match(story.whyTheyWin, /platform ecosystem/);
    assert.ok(customers.some((customer) => customer.customerType === "Consumers"));
  });

  it("scales to a new company without writing ticker-specific builder code", () => {
    const source = artifacts({
      company: "Harbor Tools",
      ticker: "HBR",
      companyKnowledge: companyKnowledge("Harbor Tools", {
        business_description: "Harbor Tools sells software products and payments services to merchants and sellers.",
        products: ["software products", "payments and transaction services"],
        customers: ["merchants and sellers"],
        revenue_drivers: ["software subscriptions", "payment transaction volume"],
        competitive_positioning: [
          { signal: "distribution and marketplace reach", source_type: "observed" },
        ],
        operating_model: ["payment network operations"],
        risks: ["competition"],
      }),
    });

    const profile = buildCompanyProfile(source);
    const money = buildMoneyProfile(source, "stable");

    assert.equal(profile.ticker, "HBR");
    assert.match(profile.whoTheyServe, /merchants and sellers/);
    assert.match(money.dailySales.explanation, /merchants and sellers/);
  });
});

function artifacts(overrides: Partial<{
  company: string;
  ticker: string;
  themes: Theme[];
  narrativeSummary: string;
  insightSummary: string;
  companyKnowledge: PartnerSourceArtifacts["companyKnowledge"];
}> = {}): PartnerSourceArtifacts {
  const company = overrides.company ?? "Microsoft";
  const ticker = overrides.ticker ?? "MSFT";
  const narrativeSummary = overrides.narrativeSummary
    ?? `${company} serves businesses, organizations, and developers with cloud and AI platforms.`;
  const insightSummary = overrides.insightSummary
    ?? `${company} cloud growth remains important for businesses and developer platforms.`;
  const themes = overrides.themes ?? [
    theme("Cloud Revenue Growth", "growth", "high", "Cloud revenue increased as businesses adopted more services."),
    theme("Competitive Market Landscape", "competition", "high", "The company faces competition in cloud and AI services."),
    theme("R&D Expenses and Margins", "margins", "medium", "Costs increased as the company invested in AI infrastructure."),
  ];

  return {
    filing: {
      company,
      ticker,
      filing_date: "2026-04-29",
      form_type: "10-Q",
      accession_number: "0000000000-00-000000",
    },
    companyKnowledge: overrides.companyKnowledge ?? companyKnowledge(company, {
      business_description: narrativeSummary,
    }),
    themes: {
      company,
      ticker,
      filing_date: "2026-04-29",
      themes,
    },
    insight: {
      company,
      ticker,
      filing_date: "2026-04-29",
      previous_filing_date: "2026-01-28",
      headline: `${company} shows cloud revenue growth.`,
      executive_summary: insightSummary,
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
          company,
          ticker,
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
      headline: `${company} shows cloud revenue growth.`,
      executive_summary: narrativeSummary,
      what_changed: "Cloud growth remained prominent.",
      bull_case: "The business benefits from cloud demand and AI platform adoption.",
      bear_case: "Competition and cost pressure could weigh on results.",
      investor_takeaway: `${company} continues emphasizing cloud growth while managing business risks.`,
    },
    quarterChange: {
      company,
      ticker,
      previous_filing: null,
      current_filing: {
        company,
        ticker,
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
      company,
      ticker,
      generated_at: "2026-06-05T00:00:00.000Z",
      history_start: "2025-10-29",
      history_end: "2026-04-29",
      filings_analyzed: 3,
      filing_dates: ["2025-10-29", "2026-01-28", "2026-04-29"],
      topic_registry_version: "test",
      topic_registry_hash: "hash-1",
      assignment_policy: {
        included_statuses: ["assigned", "low_confidence"],
        excluded_statuses: ["unassigned", "missing"],
      },
      summary: {
        topics_analyzed: 2,
        topics_present_latest: 2,
        strengthening_topics: 0,
        weakening_topics: 0,
        new_topics: 0,
        persistent_topics: 1,
        recurring_topics: 1,
        dormant_topics: 0,
        disappeared_topics: 0,
        stable_topics: 1,
        mixed_topics: 0,
        unknown_trend_topics: 0,
        insufficient_history_topics: 0,
      },
      topics: [
        {
          topic_id: "cloud",
          topic_name: "Cloud",
          presence_state: "persistent",
          trend_state: "stable",
          current_status: "present",
          first_seen: "2025-10-29",
          last_seen: "2026-04-29",
          quarters_present: 3,
          quarters_absent: 0,
          presence_ratio: 1,
          strength_history: [31, 32, 33],
          history: [
            topicObservation("2025-10-29", true, "medium", 2, ["Cloud Revenue Growth"]),
            topicObservation("2026-01-28", true, "high", 2, ["Cloud Revenue Growth"]),
            topicObservation("2026-04-29", true, "high", 3, ["Cloud Revenue Growth"]),
          ],
        },
        {
          topic_id: "margins",
          topic_name: "Margins",
          presence_state: "recurring",
          trend_state: "weakening",
          current_status: "present",
          first_seen: "2025-10-29",
          last_seen: "2026-04-29",
          quarters_present: 2,
          quarters_absent: 1,
          presence_ratio: 0.67,
          strength_history: [35, 22],
          history: [
            topicObservation("2025-10-29", true, "high", 5, ["Margin Pressure"]),
            topicObservation("2026-01-28", false, null, 0, []),
            topicObservation("2026-04-29", true, "medium", 2, ["Margin Pressure"]),
          ],
        },
      ],
      diagnostics: {
        assigned_topics_used: 3,
        unassigned_topics_ignored: 0,
        themes_without_topic_ignored: 0,
        missing_themes_with_topics_files: [],
        filings_with_no_assigned_topics: [],
        duration_ms: 1,
      },
    },
  };
}

function companyKnowledge(
  company: string,
  overrides: Partial<PartnerSourceArtifacts["companyKnowledge"]> = {},
): PartnerSourceArtifacts["companyKnowledge"] {
  return {
    company,
    business_description: `${company} provides cloud services, software products, and cloud and AI platforms for businesses, organizations, and developers.`,
    business_model: {
      value_creation: `${company} helps customers run software, cloud infrastructure, and AI workloads.`,
      monetization: "cloud computing consumption; software subscriptions",
      revenue_structure: "mixed",
    },
    products: ["cloud services", "software products", "artificial intelligence capabilities"],
    customers: ["businesses and organizations", "developers and technology teams"],
    revenue_drivers: ["cloud computing consumption", "software subscriptions"],
    competitive_positioning: [
      { signal: "platform ecosystem", source_type: "observed" },
      { signal: "technical infrastructure and operating capabilities", source_type: "observed" },
    ],
    operating_model: ["cloud infrastructure", "developer platform ecosystem"],
    key_dependencies: [
      { description: "cloud infrastructure", type: "technology" },
      { description: "developer platform ecosystem", type: "platform" },
    ],
    strategic_priorities: ["AI platform adoption"],
    risks: ["competition", "AI execution and infrastructure investment"],
    opportunities: ["cloud demand"],
    confidence: {
      overall: 0.9,
      filing_depth: 1,
      field_coverage: 1,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "company-knowledge-builder-v1",
      knowledge_version: 1,
      generated_at: "2026-06-06T00:00:00.000Z",
      input_hash: "hash-1",
    },
    lineage: {
      source_filings: [
        {
          id: "0000000000-00-000000",
          period: "2026-04-29",
          type: "10-Q",
        },
      ],
      derived_from: ["structured-intelligence", "filing-metadata"],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
    ...overrides,
  };
}

function assertNoFilingLanguage(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();

  for (const phrase of [
    "investors should note",
    "shareholders should consider",
    "revenue increased",
    "earnings improved",
    "intelligence pipeline",
    "future enrichment",
    "not yet implemented",
    "not yet populated",
    "data not populated",
  ]) {
    assert.equal(serialized.includes(phrase), false, `Unexpected filing or implementation language: ${phrase}`);
  }
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

function topicObservation(
  filingDate: string,
  present: boolean,
  importance: Theme["importance"] | null,
  evidenceCount: number,
  themeNames: string[],
) {
  return {
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: null,
    present,
    importance,
    importance_score: importance === "high" ? 3 : importance === "medium" ? 2 : importance === "low" ? 1 : 0,
    evidence_count: evidenceCount,
    theme_count: themeNames.length,
    topic_strength: (importance === "high" ? 30 : importance === "medium" ? 20 : importance === "low" ? 10 : 0)
      + evidenceCount
      + themeNames.length,
    theme_names: themeNames,
  };
}
