import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildPartnerCompanyIntelligence } from "../src/partner-domain/build-partner-intelligence.js";
import { createPartnerIntelligenceServer } from "../src/api/server.js";
import { FileCompanyKnowledgeRepository } from "../src/company-knowledge/company-knowledge.repository.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";

const forbiddenKeys = new Set(["topic_id", "importance_score", "evidence_count", "trend_state"]);

describe("partner intelligence api", () => {
  const previousWarehouseRoot = process.env.PARTNER_WAREHOUSE_ROOT;

  before(async () => {
    const warehouseRoot = await mkdtemp(join(tmpdir(), "partner-api-warehouse-"));
    const repository = new FileCompanyKnowledgeRepository(warehouseRoot);

    process.env.PARTNER_WAREHOUSE_ROOT = warehouseRoot;
    await repository.save("MSFT", msftCompanyKnowledge());
  });

  after(() => {
    if (previousWarehouseRoot === undefined) {
      delete process.env.PARTNER_WAREHOUSE_ROOT;
      return;
    }

    process.env.PARTNER_WAREHOUSE_ROOT = previousWarehouseRoot;
  });

  it("builds PartnerCompanyIntelligence without exposing internal intelligence fields", async () => {
    const result = await buildPartnerCompanyIntelligence("MSFT", "2026-04-29");

    assert.equal(result.ticker, "MSFT");
    assert.equal(result.companyName, "Microsoft");
    assert.equal(result.asOfFilingDate, "2026-04-29");
    assert.ok(result.profile.whatTheyDo.length > 0);
    assert.ok(result.summary.headline.length > 0);
    assert.ok(["improving", "stable", "weakening"].includes(result.summary.businessHealth));
    assert.ok(result.customers.length > 0);
    assert.ok(result.forensics.length > 0);
    assertNoForbiddenKeys(result);
    assertNoInternalLanguage(result);
  });

  it("serves the partner aggregate over the Fastify route", async () => {
    const server = await createPartnerIntelligenceServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/partner-intelligence/MSFT?filingDate=2026-04-29",
      });
      const body = response.json<Record<string, unknown>>();

      assert.equal(response.statusCode, 200);
      assert.equal(body.ticker, "MSFT");
      assert.ok("profile" in body);
      assert.ok("summary" in body);
      assert.ok("story" in body);
      assert.ok("customers" in body);
      assert.ok("money" in body);
      assert.ok("trust" in body);
      assert.ok("forensics" in body);
      assertNoForbiddenKeys(body);
      assertNoInternalLanguage(body);
    } finally {
      await server.close();
    }
  });

  it("allows the local frontend origin through CORS", async () => {
    const server = await createPartnerIntelligenceServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/partner-intelligence/MSFT?filingDate=2026-04-29",
        headers: {
          origin: "http://localhost:5173",
        },
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["access-control-allow-origin"], "http://localhost:5173");
    } finally {
      await server.close();
    }
  });

  it("rejects non-GET requests", async () => {
    const server = await createPartnerIntelligenceServer();

    try {
      const response = await server.inject({
        method: "POST",
        url: "/partner-intelligence/MSFT",
      });

      assert.equal(response.statusCode, 405);
    } finally {
      await server.close();
    }
  });

  it("validates route params and querystring", async () => {
    const server = await createPartnerIntelligenceServer();

    try {
      const response = await server.inject({
        method: "GET",
        url: "/partner-intelligence/MSFT?filingDate=bad-date",
      });

      assert.equal(response.statusCode, 400);
      assert.deepEqual(response.json(), { error: "Validation error" });
    } finally {
      await server.close();
    }
  });

  it("returns standardized errors for unknown tickers and missing filings", async () => {
    const server = await createPartnerIntelligenceServer();

    try {
      const unknownTicker = await server.inject({
        method: "GET",
        url: "/partner-intelligence/NOPE",
      });
      const missingFiling = await server.inject({
        method: "GET",
        url: "/partner-intelligence/MSFT?filingDate=1900-01-01",
      });

      assert.equal(unknownTicker.statusCode, 404);
      assert.deepEqual(unknownTicker.json(), { error: "Ticker not found" });
      assert.equal(missingFiling.statusCode, 404);
      assert.deepEqual(missingFiling.json(), { error: "Filing not found" });
    } finally {
      await server.close();
    }
  });
});

function assertNoForbiddenKeys(value: unknown): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenKeys);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbiddenKeys.has(key), `Partner API leaked internal field: ${key}`);
    assertNoForbiddenKeys(child);
  }
}

function assertNoInternalLanguage(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();

  for (const phrase of [
    "supporting references",
    "filing topic",
    "new categories",
    "removed categories",
    "intelligence pipeline",
    "future enrichment",
    "not yet implemented",
    "not yet populated",
    "data not populated",
  ]) {
    assert.ok(!serialized.includes(phrase), `Partner API leaked internal phrase: ${phrase}`);
  }
}

function msftCompanyKnowledge(): CompanyKnowledge {
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
