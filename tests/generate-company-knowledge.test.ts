import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateCompanyKnowledge,
} from "../src/company-knowledge/generate-company-knowledge.js";
import type { BuildCompanyKnowledgeInputs } from "../src/company-knowledge/build-company-knowledge.js";
import type { CompanyKnowledgeRepository } from "../src/company-knowledge/company-knowledge.repository.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import type { StructuredIntelligence } from "../src/structured-intelligence/types/structured-intelligence.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";

describe("generate company knowledge command", () => {
  it("calls the builder with already-loaded inputs", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();
    let capturedInputs: BuildCompanyKnowledgeInputs | null = null;

    await generateCompanyKnowledge({
      ticker: "MSFT",
      structuredIntelligence: structuredIntelligence(),
      filingMetadata: filingMetadata(),
      repository,
      builder: (inputs) => {
        capturedInputs = inputs;
        return expected;
      },
    });

    assert.deepEqual(capturedInputs, {
      structuredIntelligence: structuredIntelligence(),
      filingMetadata: filingMetadata(),
    });
  });

  it("calls repository save with the ticker and built artifact", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateCompanyKnowledge({
      ticker: "msft",
      structuredIntelligence: structuredIntelligence(),
      filingMetadata: filingMetadata(),
      repository,
      builder: () => expected,
    });

    assert.equal(repository.saved.length, 1);
    assert.equal(repository.saved[0]?.ticker, "msft");
    assert.deepEqual(repository.saved[0]?.artifact, expected);
  });

  it("returns the same artifact that it persists", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    const result = await generateCompanyKnowledge({
      ticker: "MSFT",
      structuredIntelligence: structuredIntelligence(),
      filingMetadata: filingMetadata(),
      repository,
      builder: () => expected,
    });

    assert.deepEqual(result, expected);
    assert.deepEqual(repository.saved[0]?.artifact, result);
  });

  it("propagates repository failures with command context", async () => {
    const repository = new RepositoryDouble();
    repository.saveError = new Error("repository unavailable");

    await assert.rejects(
      () => generateCompanyKnowledge({
        ticker: "msft",
        structuredIntelligence: structuredIntelligence(),
        filingMetadata: filingMetadata(),
        repository,
        builder: () => artifact(),
      }),
      /Failed to persist Company Knowledge for MSFT: repository unavailable/,
    );
  });

  it("propagates builder failures with command context", async () => {
    const repository = new RepositoryDouble();

    await assert.rejects(
      () => generateCompanyKnowledge({
        ticker: "msft",
        structuredIntelligence: structuredIntelligence(),
        filingMetadata: filingMetadata(),
        repository,
        builder: () => {
          throw new Error("builder failed");
        },
      }),
      /Failed to build Company Knowledge for MSFT: builder failed/,
    );
  });

  it("does not mutate the built artifact before persistence", async () => {
    const repository = new RepositoryDouble();
    const expected = artifact();

    await generateCompanyKnowledge({
      ticker: "MSFT",
      structuredIntelligence: structuredIntelligence(),
      filingMetadata: filingMetadata(),
      repository,
      builder: () => expected,
    });

    assert.deepEqual(repository.saved[0]?.artifact, expected);
    assert.equal(repository.saved[0]?.artifact.metadata.input_hash, "input-hash");
    assert.equal(repository.saved[0]?.artifact.confidence.overall, 0.9);
    assert.deepEqual(repository.saved[0]?.artifact.lineage.derived_from, ["structured-intelligence", "filing-metadata"]);
  });
});

class RepositoryDouble implements CompanyKnowledgeRepository {
  saved: Array<{ ticker: string; artifact: CompanyKnowledge }> = [];
  saveError: Error | null = null;

  async loadCurrent(): Promise<CompanyKnowledge | null> {
    return null;
  }

  async loadVersion(): Promise<CompanyKnowledge | null> {
    return null;
  }

  async save(ticker: string, artifact: CompanyKnowledge): Promise<void> {
    if (this.saveError) {
      throw this.saveError;
    }

    this.saved.push({ ticker, artifact });
  }

  async exists(): Promise<boolean> {
    return false;
  }

  async listVersions(): Promise<number[]> {
    return [];
  }
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

function structuredIntelligence(): StructuredIntelligence {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides software and cloud services.",
    products: ["software products"],
    customers: ["businesses"],
    revenue_drivers: ["software subscriptions"],
    competitive_positioning: ["developer ecosystem"],
    operating_model: ["cloud infrastructure"],
    key_dependencies: [],
    strategic_priorities: ["AI infrastructure"],
    risks: ["competition"],
    opportunities: ["cloud adoption"],
    confidence: {
      overall: 0.9,
      source_coverage: 0.5,
    },
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "structured-intelligence-v1",
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "structured-hash",
    },
    lineage: {
      source_filings: [],
      derived_from: [],
      model_version: "gpt-4o-mini",
      prompt_version: "structured-intelligence-v1",
    },
  };
}

function artifact(): CompanyKnowledge {
  return {
    company: "Microsoft",
    business_description: "Microsoft provides software and cloud services.",
    business_model: {
      value_creation: "Microsoft provides software and cloud services.",
      monetization: "software subscriptions",
      revenue_structure: "mixed",
    },
    products: ["software products"],
    customers: ["businesses"],
    revenue_drivers: ["software subscriptions"],
    competitive_positioning: [
      {
        signal: "developer ecosystem",
        source_type: "observed",
      },
    ],
    operating_model: ["cloud infrastructure"],
    key_dependencies: [],
    strategic_priorities: ["AI infrastructure"],
    risks: ["competition"],
    opportunities: ["cloud adoption"],
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
      input_hash: "input-hash",
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
