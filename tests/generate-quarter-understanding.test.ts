import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import {
  generateQuarterUnderstanding,
} from "../src/quarter-understanding-intelligence/generate-quarter-understanding.js";
import type { BuildQuarterUnderstandingInputs } from "../src/quarter-understanding-intelligence/build-quarter-understanding.js";
import type { QuarterUnderstandingRepository } from "../src/quarter-understanding-intelligence/quarter-understanding.repository.js";
import type {
  DerivedFromArtifact,
  QuarterUnderstandingArtifact,
} from "../src/quarter-understanding-intelligence/types/quarter-understanding.types.js";
import type { QuarterUnderstandingReasoningOutput } from "../src/quarter-understanding-intelligence/generate-quarter-understanding.js";

describe("generate quarter understanding command", () => {
  it("generates, persists, and returns Quarter Understanding", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    const result = await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reasoningOutput: reasoningOutput(),
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
    let capturedInputs: BuildQuarterUnderstandingInputs | null = null;

    await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reasoningOutput: reasoningOutput(),
      derivedFrom: derivedFrom(),
      repository,
      builder: (inputs) => {
        capturedInputs = inputs;
        return expected;
      },
    });

    assert.deepEqual(capturedInputs, {
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reportingPeriod: "2026-Q1",
      reasoningOutput: reasoningOutput(),
      derivedFrom: derivedFrom(),
    });
  });

  it("calls repository save with ticker, reporting period, and built artifact", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateQuarterUnderstanding({
      ticker: "msft",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reasoningOutput: reasoningOutput(),
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

    const result = await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reasoningOutput: reasoningOutput(),
      repository,
      builder: () => expected,
    });

    assert.deepEqual(result, expected);
    assert.deepEqual(repository.saved[0]?.artifact, result);
  });

  it("propagates builder failures with command context", async () => {
    const repository = new RepositoryDouble();

    await assert.rejects(
      () => generateQuarterUnderstanding({
        ticker: "msft",
        reportingPeriod: " 2026-Q1 ",
        companyKnowledge: companyKnowledge(),
        businessSignalArtifact: businessSignals(),
        reasoningOutput: reasoningOutput(),
        repository,
        builder: () => {
          throw new Error("builder failed");
        },
      }),
      /Failed to build Quarter Understanding for MSFT 2026-Q1: builder failed/,
    );
  });

  it("propagates repository failures with command context", async () => {
    const repository = new RepositoryDouble();
    repository.saveError = new Error("repository unavailable");

    await assert.rejects(
      () => generateQuarterUnderstanding({
        ticker: "msft",
        reportingPeriod: " 2026-Q1 ",
        companyKnowledge: companyKnowledge(),
        businessSignalArtifact: businessSignals(),
        reasoningOutput: reasoningOutput(),
        repository,
        builder: () => artifact(),
      }),
      /Failed to persist Quarter Understanding for MSFT 2026-Q1: repository unavailable/,
    );
  });

  it("passes reportingPeriod and derivedFrom to the builder", async () => {
    const repository = new RepositoryDouble();
    let capturedInputs: BuildQuarterUnderstandingInputs | null = null;

    await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q2",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals("2026-Q2"),
      reasoningOutput: reasoningOutput(),
      derivedFrom: derivedFrom(),
      repository,
      builder: (inputs) => {
        capturedInputs = inputs;
        return artifact("2026-Q2");
      },
    });

    assert.equal(capturedInputs?.reportingPeriod, "2026-Q2");
    assert.deepEqual(capturedInputs?.derivedFrom, derivedFrom());
    assert.equal(repository.saved[0]?.reportingPeriod, "2026-Q2");
  });

  it("does not mutate the built artifact before persistence", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q1",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals(),
      reasoningOutput: reasoningOutput(),
      repository,
      builder: () => expected,
    });

    assert.deepEqual(repository.saved[0]?.artifact, expected);
    assert.equal(repository.saved[0]?.artifact.metadata.input_hash, "understanding-input-hash");
    assert.deepEqual(repository.saved[0]?.artifact.understandings[0]?.business_key, expected.understandings[0]?.business_key);
    assert.deepEqual(repository.saved[0]?.artifact.understandings[0]?.confidence, expected.understandings[0]?.confidence);
    assert.deepEqual(repository.saved[0]?.artifact.lineage.derived_from, expected.lineage.derived_from);
  });

  it("supports a custom builder override", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact("2026-Q3");

    const result = await generateQuarterUnderstanding({
      ticker: "MSFT",
      reportingPeriod: "2026-Q3",
      companyKnowledge: companyKnowledge(),
      businessSignalArtifact: businessSignals("2026-Q3"),
      reasoningOutput: reasoningOutput(),
      repository,
      builder: () => expected,
    });

    assert.deepEqual(result, expected);
    assert.deepEqual(repository.saved[0]?.artifact, expected);
  });
});

class RepositoryDouble implements QuarterUnderstandingRepository {
  saved: Array<{
    ticker: string;
    reportingPeriod: string;
    artifact: QuarterUnderstandingArtifact;
  }> = [];
  saveError: Error | null = null;

  async loadCurrent(): Promise<QuarterUnderstandingArtifact | null> {
    return null;
  }

  async loadVersion(): Promise<QuarterUnderstandingArtifact | null> {
    return null;
  }

  async save(
    ticker: string,
    reportingPeriod: string,
    artifact: QuarterUnderstandingArtifact,
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

function derivedFrom(): DerivedFromArtifact[] {
  return [
    {
      path: "company-knowledge/current.json",
      version: 2,
      input_hash: "company-knowledge-hash",
    },
  ];
}

function reasoningOutput(): QuarterUnderstandingReasoningOutput {
  return {
    reasoning_schema_version: "1.0.0",
    understandings: [
      {
        category: "revenue",
        semantic_anchor_key: "cloud_demand",
        summary: "Cloud demand remains important.",
        importance: "high",
        signal_agreement: "corroborating",
        company_knowledge_alignment: "consistent",
        supporting_signal_ids: ["signal_revenue"],
      },
    ],
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
      knowledge_version: 2,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "company-knowledge-hash",
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

function businessSignals(period = "2026-Q1"): BusinessSignalArtifact {
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
      signal_version: 3,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "business-signal-hash",
    },
    lineage: {
      derived_from: [],
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

function artifact(period = "2026-Q1"): QuarterUnderstandingArtifact {
  return {
    company: "Microsoft",
    period,
    understandings: [
      {
        understanding_id: "understanding_cloud",
        semantic_anchor_key: "cloud_demand",
        business_key: {
          company: "Microsoft",
          category: "revenue",
          topic: "cloud_demand",
        },
        category: "revenue",
        summary: "Cloud demand remains important.",
        importance: "high",
        confidence: {
          score: 0.9,
          evidence_count: 1,
          source_reliability: "low",
          signal_agreement: "corroborating",
          company_knowledge_alignment: "consistent",
        },
        evidence: {
          signal_refs: [
            {
              signal_id: "signal_revenue",
              period,
              artifact_path: `business-signals/${period}/current.json`,
              input_hash: "business-signal-hash",
            },
          ],
          company_knowledge_ref: {
            artifact_path: "company-knowledge/current.json",
            version: 2,
            input_hash: "company-knowledge-hash",
          },
          evidence_context: "Revenue driver observed: cloud subscriptions",
        },
      },
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "quarter-understanding-builder-v1",
      model_version: "deterministic-builder-v1",
      prompt_version: "none",
      generated_at: "2026-06-08T00:00:00.000Z",
      understanding_version: 1,
      input_hash: "understanding-input-hash",
    },
    lineage: {
      derived_from: [
        {
          path: `business-signals/${period}/current.json`,
          version: 3,
          input_hash: "business-signal-hash",
        },
      ],
      source_filings: [
        {
          id: "0000000000-00-000000",
          period,
          type: "10-Q",
        },
      ],
    },
  };
}
