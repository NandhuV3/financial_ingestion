import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCompanyKnowledge,
  calculateCompanyKnowledgeInputHash,
  type BuildCompanyKnowledgeInputs,
} from "../src/company-knowledge/build-company-knowledge.js";
import type { StructuredIntelligence } from "../src/structured-intelligence/types/structured-intelligence.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";

describe("company knowledge builder", () => {
  it("normalizes Structured Intelligence into durable Company Knowledge", () => {
    const knowledge = buildCompanyKnowledge(inputs());

    assert.equal(knowledge.company, "Microsoft");
    assert.equal(knowledge.business_description, "Microsoft provides cloud services and software subscriptions to businesses.");
    assert.equal(knowledge.business_model.value_creation, "Microsoft provides cloud services and software subscriptions to businesses.");
    assert.equal(knowledge.business_model.monetization, "software subscriptions; cloud consumption");
    assert.equal(knowledge.business_model.revenue_structure, "mixed");
    assert.deepEqual(knowledge.products, ["cloud services", "software products"]);
    assert.deepEqual(knowledge.customers, ["businesses", "developers"]);
    assert.deepEqual(knowledge.revenue_drivers, ["software subscriptions", "cloud consumption"]);
    assert.deepEqual(knowledge.competitive_positioning, [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ]);
    assert.deepEqual(knowledge.operating_model, ["cloud infrastructure"]);
    assert.deepEqual(knowledge.key_dependencies, [
      {
        description: "data center capacity",
        type: "technology",
      },
    ]);
    assert.deepEqual(knowledge.strategic_priorities, ["AI infrastructure"]);
    assert.deepEqual(knowledge.risks, ["competition"]);
    assert.deepEqual(knowledge.opportunities, ["cloud adoption"]);
  });

  it("uses Structured Intelligence confidence and calculates field coverage", () => {
    const knowledge = buildCompanyKnowledge(inputs());

    assert.equal(knowledge.confidence.overall, 0.9);
    assert.equal(knowledge.confidence.filing_depth, 0.83);
    assert.equal(knowledge.confidence.field_coverage, 1);
    assertValidConfidence(knowledge.confidence);
  });

  it("calculates partial field coverage from Company Knowledge source fields", () => {
    const source = structuredIntelligence({
      products: [],
      customers: [],
      revenue_drivers: [],
      competitive_positioning: [],
      operating_model: [],
      key_dependencies: [],
      strategic_priorities: [],
      risks: [],
      opportunities: [],
    });
    const knowledge = buildCompanyKnowledge({
      structuredIntelligence: source,
      filingMetadata: filingMetadata(),
    });

    assert.equal(knowledge.confidence.field_coverage, 0.1);
  });

  it("builds deterministic lineage from Structured Intelligence and filing metadata", () => {
    const knowledge = buildCompanyKnowledge(inputs());

    assert.deepEqual(knowledge.lineage.source_filings, [
      {
        id: "0000000000-00-000000",
        period: "2026-04-29",
        type: "10-Q",
      },
    ]);
    assert.deepEqual(knowledge.lineage.derived_from, [
      "structured-intelligence",
      "filing-metadata",
    ]);
    assert.equal(knowledge.lineage.model_version, "deterministic-v1");
    assert.equal(knowledge.lineage.prompt_version, "none");
  });

  it("hashes normalized inputs without volatile Structured Intelligence generated timestamps", () => {
    const first = inputs();
    const second = {
      ...inputs(),
      structuredIntelligence: structuredIntelligence({
        metadata: {
          ...structuredIntelligence().metadata,
          generated_at: "2099-01-01T00:00:00.000Z",
        },
      }),
    };

    assert.equal(calculateCompanyKnowledgeInputHash(first), calculateCompanyKnowledgeInputHash(second));
  });

  it("changes hashes when Structured Intelligence changes", () => {
    const first = inputs();
    const changed = {
      ...inputs(),
      structuredIntelligence: structuredIntelligence({
        products: ["different product"],
      }),
    };

    assert.notEqual(calculateCompanyKnowledgeInputHash(first), calculateCompanyKnowledgeInputHash(changed));
  });

  it("deduplicates source filing lineage and preserves stable ordering", () => {
    const knowledge = buildCompanyKnowledge({
      ...inputs(),
      structuredIntelligence: structuredIntelligence({
        lineage: {
          ...structuredIntelligence().lineage,
          source_filings: [
            { id: "2026-04-29", period: "2026-04-29", type: "10-Q" },
            { id: "2025-10-29", period: "2025-10-29", type: "10-Q" },
            { id: "2026-04-29", period: "2026-04-29", type: "10-Q" },
          ],
        },
      }),
    });

    assert.deepEqual(knowledge.lineage.source_filings, [
      {
        id: "2025-10-29",
        period: "2025-10-29",
        type: "10-Q",
      },
      {
        id: "0000000000-00-000000",
        period: "2026-04-29",
        type: "10-Q",
      },
      {
        id: "2026-04-29",
        period: "2026-04-29",
        type: "10-Q",
      },
    ]);
  });

  it("is deterministic for repeated executions with the same generated_at", () => {
    const first = buildCompanyKnowledge(inputs());
    const second = buildCompanyKnowledge(inputs());

    assert.deepEqual(first, second);
  });

  it("is structurally deterministic across executions excluding generated_at", () => {
    const first = buildCompanyKnowledge({
      ...inputs(),
      generatedAt: "2026-06-08T00:00:00.000Z",
    });
    const second = buildCompanyKnowledge({
      ...inputs(),
      generatedAt: "2026-06-09T00:00:00.000Z",
    });

    assert.deepEqual(
      { ...first, metadata: { ...first.metadata, generated_at: "<ignored>" } },
      { ...second, metadata: { ...second.metadata, generated_at: "<ignored>" } },
    );
  });

  it("preserves the expected artifact structure without undefined values", () => {
    assertNoUndefined(buildCompanyKnowledge(inputs()));
  });
});

function inputs(): BuildCompanyKnowledgeInputs {
  return {
    structuredIntelligence: structuredIntelligence(),
    filingMetadata: filingMetadata(),
    generatedAt: "2026-06-08T00:00:00.000Z",
  };
}

function structuredIntelligence(
  overrides: Partial<StructuredIntelligence> = {},
): StructuredIntelligence {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides cloud services and software subscriptions to businesses.",
    products: ["cloud services", "software products"],
    customers: ["businesses", "developers"],
    revenue_drivers: ["software subscriptions", "cloud consumption"],
    competitive_positioning: ["developer ecosystem"],
    operating_model: ["cloud infrastructure"],
    key_dependencies: ["data center capacity"],
    strategic_priorities: ["AI infrastructure"],
    risks: ["competition"],
    opportunities: ["cloud adoption"],
    confidence: {
      overall: 0.9,
      source_coverage: 0.83,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "structured-intelligence-v1",
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "structured-intelligence-hash",
    },
    lineage: {
      source_filings: [
        {
          id: "0000000000-00-000000",
          period: "2026-04-29",
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

function filingMetadata(): FilingMetadata {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: "2026-04-29",
    form_type: "10-Q",
    accession_number: "0000000000-00-000000",
  };
}

function assertValidConfidence(confidence: { overall: number; filing_depth: number; field_coverage: number }) {
  for (const value of [confidence.overall, confidence.filing_depth, confidence.field_coverage]) {
    assert.ok(value >= 0, `Expected confidence ${value} to be >= 0`);
    assert.ok(value <= 1, `Expected confidence ${value} to be <= 1`);
  }
}

function assertNoUndefined(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoUndefined(item);
    }

    return;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assert.notEqual(item, undefined, `Unexpected undefined at ${key}`);
      assertNoUndefined(item);
    }
  }
}
