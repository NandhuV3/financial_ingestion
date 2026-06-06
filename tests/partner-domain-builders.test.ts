import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCompanyProfileIntelligence } from "../src/company-profile/build-company-profile-intelligence.js";
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
  it("keeps business-language helpers free of ticker-specific narratives", () => {
    const content = readFileSync(join(process.cwd(), "src", "partner-domain", "builders", "business-language.ts"), "utf8");

    for (const forbidden of ["MSFT", "AAPL", "AMZN", "GOOGL", "META", "NVDA", "Visa operates", "Microsoft provides"]) {
      assert.equal(content.includes(forbidden), false, `Unexpected ticker-specific language in business-language.ts: ${forbidden}`);
    }
  });

  it("builds company profile intelligence deterministically from source artifacts", () => {
    const profile = buildCompanyProfileIntelligence(artifacts());

    assert.equal(profile.company, "Microsoft");
    assert.equal("business_model" in profile, false);
    assert.equal("competitive_advantages" in profile, false);
    assert.ok(profile.products.includes("cloud services"));
    assert.ok(profile.customers.includes("businesses and organizations"));
    assert.ok(profile.business_risks.some((risk) => risk.toLowerCase().includes("competition")));
    assert.ok(profile.themes.includes("Cloud Revenue Growth"));
    assert.ok(profile.topics.includes("growth"));
    assert.deepEqual(profile.source_filings, ["2026-04-29"]);
  });

  it("builds a fallback company profile intelligence artifact without company-specific code", () => {
    const profile = buildCompanyProfileIntelligence({
      filing: {
        company: "Example Systems",
        ticker: "EXMP",
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000000000-00-000000",
      },
      themes: null,
      topicAssignments: null,
      insight: null,
      narrative: null,
      quarterChange: null,
      topicEvolution: null,
    });

    assert.equal(profile.company, "Example Systems");
    assert.equal("business_model" in profile, false);
    assert.equal("competitive_advantages" in profile, false);
    assert.deepEqual(profile.products, ["products and services described in company filings"]);
    assert.deepEqual(profile.customers, ["customers described in company filings"]);
    assert.deepEqual(profile.themes, []);
    assert.deepEqual(profile.topics, []);
  });

  it("builds a company profile from CompanyProfileIntelligence", () => {
    const profile = buildCompanyProfile(artifacts());

    assert.equal(profile.ticker, "MSFT");
    assert.equal(profile.companyName, "Microsoft");
    assert.match(profile.tagline, /serves businesses, organizations, and developers/);
    assert.match(profile.whatTheyDo, /cloud and AI platforms/);
    assert.match(profile.whoTheyServe, /businesses and organizations/);
    assertNoFilingLanguage(profile);
  });

  it("builds Partner Domain output from raw profile fallback", () => {
    const source = artifacts({
      companyProfile: rawCompanyProfile("Microsoft"),
      companyIdentity: null,
    });
    const profile = buildCompanyProfile(source);
    const summary = buildPartnerSummary(source, "stable");
    const story = buildCompanyStory(source, profile);

    assert.match(profile.whatTheyDo, /Microsoft provides cloud services/);
    assert.match(summary.summary, /Microsoft provides cloud services/);
    assert.match(story.whyTheyWin, /capabilities described/);
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

  it("builds customer segments from CompanyProfileIntelligence", () => {
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

  it("renders Apple from supplied CompanyProfileIntelligence without ticker-specific code", () => {
    const source = artifacts({
      company: "Apple",
      ticker: "AAPL",
      companyProfile: {
        company: "Apple",
        products: ["consumer devices", "software products", "digital services"],
        customers: ["consumers", "creators and media partners"],
        business_risks: ["supply chain and manufacturing", "regulation and antitrust"],
        themes: ["Consumer Device Demand"],
        topics: ["consumer_devices"],
        source_filings: ["2026-04-29"],
        profile_quality: "raw",
      },
      companyIdentity: {
        company: "Apple",
        business_description: "Apple sells consumer devices, software products, and digital services used by consumers and creators.",
        primary_products: ["consumer devices", "software products", "digital services"],
        primary_customers: ["consumers", "creators and media partners"],
        revenue_drivers: ["device sales", "software services"],
        business_model_signals: ["consumer platform"],
        competitive_signals: ["platform ecosystem", "brand trust and customer loyalty"],
        operating_signals: ["global distribution network"],
        enrichment: {
          model: "test",
          generated_at: "2026-06-06T00:00:00.000Z",
          input_hash: "hash-1",
        },
      },
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
      companyProfile: {
        company: "Harbor Tools",
        products: ["software products", "payments and transaction services"],
        customers: ["merchants and sellers"],
        business_risks: ["competition"],
        themes: ["Merchant Tools"],
        topics: ["payments"],
        source_filings: ["2026-04-29"],
        profile_quality: "raw",
      },
      companyIdentity: {
        company: "Harbor Tools",
        business_description: "Harbor Tools sells software products and payments services to merchants and sellers.",
        primary_products: ["software products", "payments and transaction services"],
        primary_customers: ["merchants and sellers"],
        revenue_drivers: ["software subscriptions", "payment transaction volume"],
        business_model_signals: ["merchant software"],
        competitive_signals: ["distribution and marketplace reach"],
        operating_signals: ["payment network operations"],
        enrichment: {
          model: "test",
          generated_at: "2026-06-06T00:00:00.000Z",
          input_hash: "hash-1",
        },
      },
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
  companyProfile: PartnerSourceArtifacts["companyProfile"];
  companyIdentity: PartnerSourceArtifacts["companyIdentity"];
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
    companyProfile: overrides.companyProfile ?? {
      company,
      products: ["cloud services", "software products", "artificial intelligence capabilities"],
      customers: ["businesses and organizations", "developers and technology teams"],
      business_risks: ["competition", "AI execution and infrastructure investment"],
      themes: themes.map((theme) => theme.theme),
      topics: themes.map((theme) => theme.category),
      source_filings: ["2026-04-29"],
      profile_quality: "raw",
    },
    companyIdentity: "companyIdentity" in overrides ? overrides.companyIdentity! : {
      company,
      business_description: narrativeSummary,
      primary_products: ["cloud services", "software products", "artificial intelligence capabilities"],
      primary_customers: ["businesses and organizations", "developers and technology teams"],
      revenue_drivers: ["cloud computing consumption", "software subscriptions"],
      business_model_signals: ["recurring revenue"],
      competitive_signals: ["platform ecosystem", "technical infrastructure and operating capabilities"],
      operating_signals: ["cloud infrastructure", "developer platform ecosystem"],
      enrichment: {
        model: "test",
        generated_at: "2026-06-06T00:00:00.000Z",
        input_hash: "hash-1",
      },
    },
    themes: {
      company,
      ticker,
      filing_date: "2026-04-29",
      themes,
    },
    topicAssignments: null,
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

function rawCompanyProfile(company: string): PartnerSourceArtifacts["companyProfile"] {
  return {
    company,
    products: ["cloud services", "software products"],
    customers: ["businesses and organizations"],
    business_risks: ["competition"],
    themes: ["Cloud Revenue Growth"],
    topics: ["cloud"],
    source_filings: ["2026-04-29"],
    profile_quality: "raw",
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
