import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateStructuredIntelligence } from "../src/harness/evaluators/evaluate-structured-intelligence.js";
import type { HarnessScorecard } from "../src/harness/harness.types.js";
import type { StructuredIntelligencePromptInput } from "../src/structured-intelligence/types/build-structured-intelligence.prompt.types.js";
import type { StructuredIntelligence } from "../src/structured-intelligence/types/structured-intelligence.types.js";

describe("harness structured intelligence semantic quality", () => {
  it("flags AAPL-style empty products when sufficient business evidence exists", () => {
    const scorecard = evaluateStructuredIntelligence({
      artifact: artifact({
        products: [],
        customers: ["consumers", "developers"],
        revenue_drivers: ["device sales", "services subscriptions"],
      }),
      promptInput: promptInput({
        themes: [
          theme("Product Demand", "products", "iPhone demand remains important."),
          theme("Services Growth", "services", "Services subscriptions expanded."),
          theme("Consumer Adoption", "customers", "Consumers buy devices and services."),
          theme("Developer Ecosystem", "platform", "Developers build on the platform."),
          theme("Supply Chain", "operations", "Manufacturing supply remains important."),
        ],
      }),
    });

    assert.equal(dimension(scorecard, "product_coverage").score, 0);
    assert.ok(scorecard.warnings.includes("Products missing despite sufficient business evidence."));
  });

  it("flags geographic customer lists", () => {
    const scorecard = evaluateStructuredIntelligence({
      artifact: artifact({
        customers: ["China", "Europe", "Americas", "consumers"],
      }),
      promptInput: promptInput(),
    });

    assert.equal(dimension(scorecard, "customer_quality").score, 0.25);
    assert.ok(scorecard.warnings.includes("Customer list appears geographic rather than customer-segment based."));
  });

  it("scores generic business descriptions below specific descriptions", () => {
    const generic = evaluateStructuredIntelligence({
      artifact: artifact({
        business_description: "The company provides products to customers worldwide based on its latest filing.",
      }),
      promptInput: promptInput(),
    });
    const specific = evaluateStructuredIntelligence({
      artifact: artifact({
        business_description: "Apple sells consumer devices, software, and services through an integrated platform ecosystem.",
      }),
      promptInput: promptInput(),
    });

    assert.equal(dimension(generic, "business_description_specificity").score, 0);
    assert.equal(dimension(specific, "business_description_specificity").score, 1);
  });

  it("flags risk-heavy operating models", () => {
    const scorecard = evaluateStructuredIntelligence({
      artifact: artifact({
        operating_model: [
          "global supply chain operations",
          "tariff exposure",
          "litigation risk",
        ],
      }),
      promptInput: promptInput(),
    });

    assert.equal(dimension(scorecard, "operating_model_purity").score, 0.5);
    assert.ok(scorecard.warnings.includes("Operating model contains risk statements."));
  });
});

function dimension(scorecard: HarnessScorecard, name: string) {
  const match = scorecard.dimensions.find((item) => item.name === name);

  assert.ok(match, `Missing dimension: ${name}`);

  return match;
}

function artifact(overrides: Partial<StructuredIntelligence> = {}): StructuredIntelligence {
  return {
    company: "Apple",
    business_description: "Apple sells consumer devices, software, and services through an integrated platform ecosystem.",
    products: ["iPhone", "Mac", "services"],
    customers: ["consumers", "developers"],
    revenue_drivers: ["device sales", "services subscriptions"],
    competitive_positioning: ["brand trust", "platform ecosystem"],
    operating_model: ["global supply chain operations", "retail and digital distribution"],
    key_dependencies: ["component suppliers"],
    strategic_priorities: ["services growth"],
    risks: ["competition"],
    opportunities: ["services adoption"],
    confidence: {
      overall: 0.9,
      source_coverage: 1,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "structured-intelligence-v1",
      generated_at: "2026-06-11T00:00:00.000Z",
      input_hash: "hash-1",
    },
    lineage: {
      source_filings: [
        {
          id: "0000000000-00-000000",
          period: "2026-05-01",
          type: "10-Q",
        },
      ],
      derived_from: ["themes", "topics"],
      model_version: "gpt-4o-mini",
      prompt_version: "structured-intelligence-v1",
    },
    ...overrides,
  };
}

function promptInput(overrides: Partial<StructuredIntelligencePromptInput> = {}): StructuredIntelligencePromptInput {
  return {
    company: "Apple",
    filing_date: "2026-05-01",
    themes: [
      theme("Device Sales", "products", "Device sales and consumer demand are important."),
      theme("Services Growth", "services", "Services subscriptions are recurring revenue drivers."),
    ],
    topics: [
      {
        topic_id: "services_growth",
        theme: "Services Growth",
        category: "services",
        summary: "Services subscriptions are recurring revenue drivers.",
        importance: "high",
        assignment_status: "assigned",
        confidence: 0.92,
      },
    ],
    quarter_changes: {
      new_categories: 0,
      removed_categories: 0,
      importance_increases: 0,
      importance_decreases: 0,
      evidence_increases: 0,
      evidence_decreases: 0,
      changes: [],
      topic_changes: [],
    },
    topic_evolution: {
      strengthening_topics: ["Services Growth"],
      weakening_topics: [],
      stable_topics: ["Device Sales"],
      mixed_topics: [],
      topics: [
        {
          topic_id: "services_growth",
          topic_name: "Services Growth",
          trend_state: "strengthening",
          presence_state: "persistent",
          quarters_present: 3,
          presence_ratio: 1,
        },
      ],
    },
    ...overrides,
  };
}

function theme(themeName: string, category: string, summary: string) {
  return {
    theme: themeName,
    category,
    importance: "high",
    summary,
  };
}
