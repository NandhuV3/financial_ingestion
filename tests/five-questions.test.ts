import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileCompanyKnowledgeRepository } from "../src/company-knowledge/company-knowledge.repository.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import { buildPartnerCompanyIntelligence } from "../src/partner-domain/build-partner-intelligence.js";
import { buildBusinessHealthDashboard } from "../src/partner-domain/builders/build-owner-business-health.js";
import { buildBusinessHealth } from "../src/partner-domain/builders/build-business-health.js";
import { buildFiveQuestions } from "../src/partner-domain/builders/build-five-questions.js";
import { buildForensicsSignals } from "../src/partner-domain/builders/build-forensics-signals.js";
import type { PartnerSourceArtifacts } from "../src/partner-domain/partner-source.types.js";
import { evaluateFiveQuestions } from "../src/harness/evaluators/evaluate-five-questions.js";

describe("five questions", () => {
  const previousWarehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;

  before(async () => {
    const warehouseRoot = await mkdtemp(join(tmpdir(), "five-questions-warehouse-"));
    const repository = new FileCompanyKnowledgeRepository(warehouseRoot);

    process.env.PARTNER_WAREHOUSE_ROOT = warehouseRoot;
    await repository.save("MSFT", companyKnowledge());
  });

  after(() => {
    if (previousWarehouseRoot === undefined) {
      delete process.env.PARTNER_WAREHOUSE_ROOT;
      return;
    }

    process.env.PARTNER_WAREHOUSE_ROOT = previousWarehouseRoot;
  });

  it("answers Q1 with a business explanation", () => {
    const questions = buildQuestions();

    assert.equal(questions.business.question, "What does this company actually sell?");
    assert.match(questions.business.answer, /cloud services/i);
    assert.match(questions.business.answer, /businesses and organizations/i);
    assert.match(questions.business.answer, /cloud computing consumption/i);
    assert.deepEqual(questions.business.evidence, [
      "business_description",
      "products",
      "customers",
      "revenue_drivers",
    ]);
  });

  it("answers Q2 with a growth explanation", () => {
    const questions = buildQuestions();

    assert.equal(questions.growth.question, "Where does the next rupee come from?");
    assert.match(questions.growth.answer, /next rupee/i);
    assert.match(questions.growth.answer, /cloud computing consumption/i);
    assert.match(questions.growth.answer, /AI platform adoption/i);
    assert.ok(questions.growth.evidence.includes("revenue_drivers"));
  });

  it("answers Q3 with trust and risk reasoning", () => {
    const questions = buildQuestions();

    assert.equal(questions.trust.question, "Can the story be trusted?");
    assert.match(questions.trust.answer, /competition/i);
    assert.match(questions.trust.answer, /business health/i);
    assert.ok(questions.trust.evidence.includes("risks"));
    assert.ok(questions.trust.evidence.includes("forensics"));
  });

  it("marks Q4 valuation as insufficient data", () => {
    const questions = buildQuestions();

    assert.equal(questions.valuation.question, "Is the story already too expensive?");
    assert.equal(questions.valuation.status, "insufficient_data");
    assert.equal(questions.valuation.confidence, "low");
    assert.match(questions.valuation.answer, /market-price data/i);
    assert.deepEqual(questions.valuation.evidence, []);
  });

  it("answers Q5 with hold rationale and change trigger", () => {
    const questions = buildQuestions();

    assert.equal(questions.holdThesis.question, "Why would I hold it and what would change that?");
    assert.match(questions.holdThesis.answer, /owner might hold/i);
    assert.match(questions.holdThesis.answer, /would weaken/i);
    assert.ok(questions.holdThesis.evidence.includes("growth_question"));
    assert.ok(questions.holdThesis.evidence.includes("trust_question"));
  });

  it("includes fiveQuestions in the Partner Domain aggregate", async () => {
    const aggregate = await buildPartnerCompanyIntelligence("MSFT", "2026-04-29");

    assert.ok(aggregate.fiveQuestions.business);
    assert.ok(aggregate.fiveQuestions.growth);
    assert.ok(aggregate.fiveQuestions.trust);
    assert.ok(aggregate.fiveQuestions.valuation);
    assert.ok(aggregate.fiveQuestions.holdThesis);
  });

  it("evaluates Five Questions harness quality", () => {
    const scorecard = evaluateFiveQuestions(buildQuestions());

    assert.equal(scorecard.artifact, "five_questions");
    assert.equal(scorecard.failures.length, 0);
    assert.equal(scorecard.dimensions.find((dimension) => dimension.name === "valuation_insufficient_data")?.score, 1);
  });
});

function buildQuestions() {
  const source = artifacts();
  const businessHealth = buildBusinessHealth(source);
  const health = buildBusinessHealthDashboard(source, businessHealth);
  const forensics = buildForensicsSignals(source);

  return buildFiveQuestions({
    artifacts: source,
    businessHealth,
    health,
    forensics,
  });
}

function artifacts(): PartnerSourceArtifacts {
  return {
    filing: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      form_type: "10-Q",
      accession_number: "0000000000-00-000000",
    },
    companyKnowledge: companyKnowledge(),
    themes: null,
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
        importance_increases: 2,
        importance_decreases: 0,
        evidence_increases: 1,
        evidence_decreases: 0,
      },
      changes: [
        {
          change_type: "IMPORTANCE_INCREASED",
          category: "cloud_growth",
          previous_importance: "medium",
          current_importance: "high",
          previous_evidence_count: 2,
          current_evidence_count: 4,
          previous_theme_names: ["Cloud demand"],
          current_theme_names: ["Cloud demand"],
        },
      ],
      topic_changes: [
        {
          topic_id: "cloud",
          change_type: "TOPIC_INTENSIFIED",
          previous_observation: null,
          current_observation: null,
          description: "Cloud intensified.",
        },
      ],
      topic_summary: {
        persisted_topics: 0,
        evolved_topics: 0,
        intensified_topics: 1,
        weakened_topics: 0,
      },
    },
    topicEvolution: {
      company: "Microsoft",
      ticker: "MSFT",
      generated_at: "2026-06-12T00:00:00.000Z",
      filing_dates: ["2026-01-28", "2026-04-29"],
      summary: {
        topics_analyzed: 1,
        topics_present_latest: 1,
        new_topics: 0,
        persistent_topics: 1,
        recurring_topics: 0,
        dormant_topics: 0,
        disappeared_topics: 0,
        strengthening_topics: 1,
        weakening_topics: 0,
        stable_topics: 0,
        mixed_topics: 0,
        unknown_trend_topics: 0,
        insufficient_history_topics: 0,
      },
      topics: [
        {
          topic_id: "cloud",
          topic_name: "Cloud",
          presence_state: "persistent",
          trend_state: "strengthening",
          current_status: "present",
          first_seen: "2026-01-28",
          last_seen: "2026-04-29",
          quarters_present: 2,
          quarters_absent: 0,
          presence_ratio: 1,
          strength_history: [20, 35],
          history: [],
        },
      ],
    },
  };
}

function companyKnowledge(): CompanyKnowledge {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides cloud services, software products, and cloud and AI platforms for businesses, organizations, and developers.",
    business_model: {
      value_creation: "Microsoft helps customers run software, cloud infrastructure, and AI workloads.",
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
  };
}
