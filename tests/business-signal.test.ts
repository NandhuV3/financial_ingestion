import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBusinessSignals,
  type BuildBusinessSignalsInputs,
} from "../src/business-signal-intelligence/build-business-signals.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";

describe("business signal builder", () => {
  it("generates signals from Company Knowledge fields", () => {
    const artifact = buildBusinessSignals(inputs());

    assert.deepEqual(
      artifact.signals.map((signal) => signal.category),
      ["revenue", "competitive", "dependency", "operational", "product", "customer"],
    );
    assert.deepEqual(
      artifact.signals.map((signal) => signal.summary),
      [
        "Revenue driver observed: cloud subscriptions",
        "Competitive signal observed: developer ecosystem",
        "Dependency observed: data center capacity",
        "Operational signal observed: cloud infrastructure",
        "Product signal observed: cloud services",
        "Customer signal observed: enterprise customers",
      ],
    );

    for (const signal of artifact.signals) {
      assert.ok(signal.signal_id.startsWith("signal_"));
      assert.ok(signal.evidence[0]?.evidence_id.startsWith("evidence_"));
      assert.equal(signal.evidence[0]?.source, "company-knowledge");
      assert.equal(signal.direction, "neutral");
      assert.equal(signal.magnitude, "low");
      assertValidConfidence(signal.confidence);
    }

    assert.equal(artifact.signals.find((signal) => signal.category === "revenue")?.confidence, 0.8);
    assert.equal(artifact.signals.find((signal) => signal.category === "competitive")?.confidence, 0.8);
    assert.equal(artifact.signals.find((signal) => signal.category === "dependency")?.confidence, 0.75);
    assert.equal(artifact.signals.find((signal) => signal.category === "operational")?.confidence, 0.75);
    assert.equal(artifact.signals.find((signal) => signal.category === "product")?.confidence, 0.7);
    assert.equal(artifact.signals.find((signal) => signal.category === "customer")?.confidence, 0.7);
  });

  it("returns a valid empty artifact for empty inputs", () => {
    const artifact = buildBusinessSignals({});

    assert.equal(artifact.company, "");
    assert.equal(artifact.period, "");
    assert.deepEqual(artifact.signals, []);
    assert.equal(artifact.metadata.schema_version, "1.0.0");
    assert.equal(artifact.metadata.pipeline_version, "business-signal-builder-v1");
    assert.equal(artifact.metadata.signal_version, 1);
    assert.ok(artifact.metadata.generated_at);
    assert.ok(artifact.metadata.input_hash);
    assert.deepEqual(artifact.lineage.derived_from, []);
    assert.deepEqual(artifact.lineage.source_filings, []);
    assert.equal(artifact.lineage.model_version, "deterministic-v1");
    assert.equal(artifact.lineage.prompt_version, "none");
    assertNoUndefined(artifact);
  });

  it("uses reportingPeriod as artifact period and never falls back to filing date", () => {
    const withReportingPeriod = buildBusinessSignals({
      ...inputs(),
      reportingPeriod: "2026-Q1",
      filingMetadata: {
        company: "Microsoft",
        ticker: "MSFT",
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000000000-00-000000",
      },
    });
    const withoutReportingPeriod = buildBusinessSignals({
      filingMetadata: {
        company: "Microsoft",
        ticker: "MSFT",
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "0000000000-00-000000",
      },
      generatedAt: "2026-06-08T00:00:00.000Z",
    });

    assert.equal(withReportingPeriod.period, "2026-Q1");
    assert.equal(withoutReportingPeriod.period, "");
  });

  it("keeps input hashes stable for volatile timestamps and changes them for real input changes", () => {
    const first = buildBusinessSignals(inputs());
    const generatedAtChanged = buildBusinessSignals({
      ...inputs(),
      generatedAt: "2099-01-01T00:00:00.000Z",
    });
    const identical = buildBusinessSignals(inputs());
    const productChanged = buildBusinessSignals({
      ...inputs(),
      companyKnowledge: {
        ...companyKnowledge(),
        products: ["different product"],
      },
    });
    const revenueChanged = buildBusinessSignals({
      ...inputs(),
      companyKnowledge: {
        ...companyKnowledge(),
        revenue_drivers: ["different revenue driver"],
      },
    });
    const reportingPeriodChanged = buildBusinessSignals({
      ...inputs(),
      reportingPeriod: "2026-Q2",
    });

    assert.equal(first.metadata.input_hash, generatedAtChanged.metadata.input_hash);
    assert.equal(first.metadata.input_hash, identical.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, productChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, revenueChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, reportingPeriodChanged.metadata.input_hash);
  });

  it("is deterministic for repeated executions with identical inputs", () => {
    const first = buildBusinessSignals(inputs());
    const second = buildBusinessSignals(inputs());

    assert.deepEqual(first, second);
  });

  it("deduplicates duplicate signals and evidence", () => {
    const artifact = buildBusinessSignals({
      ...inputs(),
      companyKnowledge: {
        ...companyKnowledge(),
        revenue_drivers: ["cloud subscriptions", " Cloud subscriptions "],
        products: ["cloud services", "cloud services"],
        customers: ["enterprise customers", "Enterprise Customers"],
        competitive_positioning: [
          {
            signal: "developer ecosystem",
            source_type: "observed",
          },
          {
            signal: " Developer ecosystem ",
            source_type: "claimed",
          },
        ],
      },
    });

    assert.equal(countBySummary(artifact, "Revenue driver observed: cloud subscriptions"), 1);
    assert.equal(countBySummary(artifact, "Product signal observed: cloud services"), 1);
    assert.equal(countBySummary(artifact, "Customer signal observed: enterprise customers"), 1);
    assert.equal(countBySummary(artifact, "Competitive signal observed: developer ecosystem"), 1);

    for (const signal of artifact.signals) {
      assert.equal(new Set(signal.evidence.map((evidence) => evidence.evidence_id)).size, signal.evidence.length);
    }
  });

  it("preserves stable signal ordering across repeated runs", () => {
    const first = buildBusinessSignals(inputs());
    const second = buildBusinessSignals(inputs());

    assert.deepEqual(
      first.signals.map((signal) => signal.signal_id),
      second.signals.map((signal) => signal.signal_id),
    );
    assert.deepEqual(
      first.signals.map((signal) => signal.summary),
      [
        "Revenue driver observed: cloud subscriptions",
        "Competitive signal observed: developer ecosystem",
        "Dependency observed: data center capacity",
        "Operational signal observed: cloud infrastructure",
        "Product signal observed: cloud services",
        "Customer signal observed: enterprise customers",
      ],
    );
  });

  it("normalizes lineage with deduplication and stable ordering", () => {
    const artifact = buildBusinessSignals({
      ...inputs(),
      derivedFrom: [
        {
          path: "topic-evolution/current.json",
          version: 2,
          input_hash: "hash-2",
        },
        {
          path: "company-knowledge/current.json",
          version: 1,
          input_hash: "hash-1",
        },
        {
          path: "company-knowledge/current.json",
          version: 1,
          input_hash: "hash-1",
        },
      ],
      companyKnowledge: {
        ...companyKnowledge(),
        lineage: {
          ...companyKnowledge().lineage,
          source_filings: [
            {
              id: "2026",
              period: "2026-Q1",
              type: "10-Q",
            },
            {
              id: "2025",
              period: "2025-Q4",
              type: "10-K",
            },
            {
              id: "2026",
              period: "2026-Q1",
              type: "10-Q",
            },
          ],
        },
      },
    });

    assert.deepEqual(artifact.lineage.derived_from, [
      {
        path: "company-knowledge/current.json",
        version: 1,
        input_hash: "hash-1",
      },
      {
        path: "topic-evolution/current.json",
        version: 2,
        input_hash: "hash-2",
      },
    ]);
    assert.deepEqual(artifact.lineage.source_filings, [
      {
        id: "2025",
        period: "2025-Q4",
        type: "10-K",
      },
      {
        id: "2026",
        period: "2026-Q1",
        type: "10-Q",
      },
    ]);
  });

  it("keeps every signal confidence within the valid range", () => {
    const artifact = buildBusinessSignals(inputs());

    for (const signal of artifact.signals) {
      assert.equal(typeof signal.confidence, "number");
      assertValidConfidence(signal.confidence);
    }
  });

  it("preserves the expected artifact structure without undefined values", () => {
    const artifact = buildBusinessSignals(inputs());

    assert.equal(typeof artifact.company, "string");
    assert.equal(typeof artifact.period, "string");
    assert.ok(Array.isArray(artifact.signals));
    assert.ok(Array.isArray(artifact.lineage.derived_from));
    assert.ok(Array.isArray(artifact.lineage.source_filings));
    assertNoUndefined(artifact);
  });

  it("does not throw for documented missing-input failure modes", () => {
    const cases: BuildBusinessSignalsInputs[] = [
      { filingMetadata: inputs().filingMetadata, generatedAt: "2026-06-08T00:00:00.000Z" },
      { companyKnowledge: companyKnowledge(), generatedAt: "2026-06-08T00:00:00.000Z" },
      { companyKnowledge: companyKnowledge(), filingMetadata: inputs().filingMetadata, generatedAt: "2026-06-08T00:00:00.000Z" },
      { companyKnowledge: companyKnowledge(), filingMetadata: inputs().filingMetadata, derivedFrom: [], generatedAt: "2026-06-08T00:00:00.000Z" },
      {},
    ];

    for (const params of cases) {
      assert.doesNotThrow(() => buildBusinessSignals(params));
      assertNoUndefined(buildBusinessSignals(params));
    }
  });
});

function inputs(): BuildBusinessSignalsInputs {
  return {
    companyKnowledge: companyKnowledge(),
    filingMetadata: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-04-29",
      form_type: "10-Q",
      accession_number: "0000000000-00-000000",
    },
    reportingPeriod: "2026-Q1",
    derivedFrom: [
      {
        path: "company-knowledge/current.json",
        version: 1,
        input_hash: "knowledge-hash",
      },
    ],
    generatedAt: "2026-06-08T00:00:00.000Z",
  };
}

function companyKnowledge(): CompanyKnowledge {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides software and cloud services.",
    business_model: {
      value_creation: "Microsoft provides software and cloud services.",
      monetization: "cloud subscriptions",
      revenue_structure: "mixed",
    },
    products: ["cloud services"],
    customers: ["enterprise customers"],
    revenue_drivers: ["cloud subscriptions"],
    competitive_positioning: [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ],
    operating_model: ["cloud infrastructure"],
    key_dependencies: [
      {
        description: "data center capacity",
        type: "technology",
      },
    ],
    confidence: {
      overall: 0.9,
      filing_depth: 0.5,
      field_coverage: 1,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "company-knowledge-builder-v1",
      knowledge_version: 1,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "knowledge-input-hash",
    },
    lineage: {
      source_filings: [
        {
          id: "0000000000-00-000000",
          period: "2026-Q1",
          type: "10-Q",
        },
      ],
      derived_from: ["company-identity"],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}

function countBySummary(artifact: BusinessSignalArtifact, summary: string): number {
  return artifact.signals.filter((signal) => signal.summary === summary).length;
}

function assertValidConfidence(value: number) {
  assert.ok(value >= 0, `Expected confidence ${value} to be >= 0`);
  assert.ok(value <= 1, `Expected confidence ${value} to be <= 1`);
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
