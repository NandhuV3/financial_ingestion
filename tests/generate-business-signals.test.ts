import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateBusinessSignals,
} from "../src/business-signal-intelligence/generate-business-signals.js";
import type { BuildBusinessSignalsInputs } from "../src/business-signal-intelligence/build-business-signals.js";
import type { BusinessSignalRepository } from "../src/business-signal-intelligence/business-signal.repository.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";

describe("generate business signals command", () => {
  it("generates, persists, and returns Business Signals", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    const result = await generateBusinessSignals({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      repository,
      builder: () => expected,
    });

    assert.deepEqual(result, expected);
    assert.deepEqual(repository.saved, [
      {
        ticker: "MSFT",
        reportingPeriod: "2026-Q1",
        artifact: expected,
      },
    ]);
  });

  it("calls the builder with already-loaded inputs", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();
    let capturedInputs: BuildBusinessSignalsInputs | null = null;

    await generateBusinessSignals({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      filingMetadata: filingMetadata(),
      derivedFrom: derivedFrom(),
      repository,
      builder: (inputs) => {
        capturedInputs = inputs;
        return expected;
      },
    });

    assert.deepEqual(capturedInputs, {
      companyKnowledge: companyKnowledge(),
      filingMetadata: filingMetadata(),
      reportingPeriod: "2026-Q1",
      derivedFrom: derivedFrom(),
    });
  });

  it("calls repository save with ticker, reporting period, and built artifact", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateBusinessSignals({
      ticker: "msft",
      reportingPeriod: "2026-Q1",
      repository,
      builder: () => expected,
    });

    assert.equal(repository.saved.length, 1);
    assert.equal(repository.saved[0]?.ticker, "msft");
    assert.equal(repository.saved[0]?.reportingPeriod, "2026-Q1");
    assert.deepEqual(repository.saved[0]?.artifact, expected);
  });

  it("returns the same artifact that it persists", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    const result = await generateBusinessSignals({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      repository,
      builder: () => expected,
    });

    assert.deepEqual(result, expected);
    assert.deepEqual(repository.saved[0]?.artifact, result);
  });

  it("propagates builder failures with command context", async () => {
    const repository = new RepositoryDouble();

    await assert.rejects(
      () => generateBusinessSignals({
        ticker: "msft",
        reportingPeriod: " 2026-Q1 ",
        repository,
        builder: () => {
          throw new Error("builder failed");
        },
      }),
      /Failed to build Business Signals for MSFT 2026-Q1: builder failed/,
    );
  });

  it("propagates repository failures with command context", async () => {
    const repository = new RepositoryDouble();
    repository.saveError = new Error("repository unavailable");

    await assert.rejects(
      () => generateBusinessSignals({
        ticker: "msft",
        reportingPeriod: " 2026-Q1 ",
        repository,
        builder: () => artifact(),
      }),
      /Failed to persist Business Signals for MSFT 2026-Q1: repository unavailable/,
    );
  });

  it("passes the reporting period through to the builder and repository", async () => {
    const repository = new RepositoryDouble();
    let capturedInputs: BuildBusinessSignalsInputs | null = null;

    await generateBusinessSignals({
      ticker: "MSFT",
      reportingPeriod: "2026-Q2",
      repository,
      builder: (inputs) => {
        capturedInputs = inputs;
        return artifact("2026-Q2");
      },
    });

    assert.equal(capturedInputs?.reportingPeriod, "2026-Q2");
    assert.equal(repository.saved[0]?.reportingPeriod, "2026-Q2");
  });

  it("does not mutate the built artifact before persistence", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateBusinessSignals({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      repository,
      builder: () => expected,
    });

    assert.deepEqual(repository.saved[0]?.artifact, expected);
    assert.equal(repository.saved[0]?.artifact.metadata.input_hash, "signal-input-hash");
    assert.equal(repository.saved[0]?.artifact.signals[0]?.confidence, 0.8);
    assert.deepEqual(repository.saved[0]?.artifact.lineage.derived_from, derivedFrom());
  });
});

class RepositoryDouble implements BusinessSignalRepository {
  saved: Array<{
    ticker: string;
    reportingPeriod: string;
    artifact: BusinessSignalArtifact;
  }> = [];
  saveError: Error | null = null;

  async loadCurrent(): Promise<BusinessSignalArtifact | null> {
    return null;
  }

  async loadVersion(): Promise<BusinessSignalArtifact | null> {
    return null;
  }

  async save(
    ticker: string,
    reportingPeriod: string,
    artifact: BusinessSignalArtifact,
  ): Promise<void> {
    if (this.saveError) {
      throw this.saveError;
    }

    this.saved.push({ ticker, reportingPeriod, artifact });
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async listVersions(): Promise<number[]> {
    return [];
  }
}

function derivedFrom() {
  return [
    {
      path: "company-knowledge/current.json",
      version: 1,
      input_hash: "knowledge-hash",
    },
  ];
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
    key_dependencies: [],
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
      derived_from: ["structured-intelligence", "filing-metadata"],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}

function artifact(period = "2026-Q1"): BusinessSignalArtifact {
  return {
    company: "Microsoft",
    period,
    signals: [
      {
        signal_id: "signal_revenue",
        category: "revenue",
        summary: "Revenue driver observed: cloud subscriptions",
        direction: "neutral",
        magnitude: "low",
        confidence: 0.8,
        evidence: [
          {
            evidence_id: "evidence_revenue",
            source: "company-knowledge",
            description: "cloud subscriptions",
          },
        ],
      },
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "business-signal-builder-v1",
      signal_version: 1,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "signal-input-hash",
    },
    lineage: {
      derived_from: derivedFrom(),
      source_filings: [
        {
          id: "0000000000-00-000000",
          period,
          type: "10-Q",
        },
      ],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}
