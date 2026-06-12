import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildQuarterUnderstanding,
  type BuildQuarterUnderstandingInputs,
  type LLMReasoningOutput,
} from "../src/quarter-understanding-intelligence/build-quarter-understanding.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import type { QuarterUnderstandingArtifact } from "../src/quarter-understanding-intelligence/types/quarter-understanding.types.js";

describe("quarter understanding builder", () => {
  it("builds Quarter Understanding artifacts from company knowledge, signals, and reasoning output", () => {
    const artifact = buildQuarterUnderstanding(inputs());

    assert.equal(artifact.company, "Microsoft");
    assert.equal(artifact.period, "2026-Q1");
    assert.equal(artifact.understandings.length, 4);

    const cloud = artifact.understandings.find((understanding) =>
      understanding.semantic_anchor_key === "cloud_demand");

    assert.ok(cloud);
    assert.equal(cloud.category, "revenue");
    assert.equal(cloud.summary, "Cloud demand remains important.");
    assert.equal(cloud.importance, "high");
    assert.equal(cloud.understanding_id.startsWith("understanding_"), true);
    assert.equal(cloud.business_key?.company, "Microsoft");
    assert.equal(cloud.business_key?.category, "revenue");
    assert.equal(cloud.business_key?.topic, "cloud_demand");
  });

  it("persists business_key from company, category, and semantic anchor", () => {
    const [understanding] = buildQuarterUnderstanding(inputs()).understandings;

    assert.deepEqual(understanding?.business_key, {
      company: "Microsoft",
      category: "revenue",
      topic: "cloud_demand",
    });
  });

  it("generates deterministic understanding IDs", () => {
    const first = buildQuarterUnderstanding(inputs());
    const second = buildQuarterUnderstanding(inputs());
    const periodChanged = buildQuarterUnderstanding({
      ...inputs(),
      reportingPeriod: "2026-Q2",
    });

    assert.deepEqual(
      first.understandings.map((understanding) => understanding.understanding_id),
      second.understandings.map((understanding) => understanding.understanding_id),
    );
    assert.notDeepEqual(
      first.understandings.map((understanding) => understanding.understanding_id),
      periodChanged.understandings.map((understanding) => understanding.understanding_id),
    );
  });

  it("resolves supporting signal references and evidence context", () => {
    const cloud = buildQuarterUnderstanding(inputs()).understandings.find((understanding) =>
      understanding.semantic_anchor_key === "cloud_demand");

    assert.deepEqual(cloud?.evidence.signal_refs, [
      {
        signal_id: "signal_revenue_1",
        period: "2026-Q1",
        artifact_path: "business-signals/2026-Q1/current.json",
        input_hash: "business-signal-hash",
      },
      {
        signal_id: "signal_revenue_2",
        period: "2026-Q1",
        artifact_path: "business-signals/2026-Q1/current.json",
        input_hash: "business-signal-hash",
      },
      {
        signal_id: "signal_revenue_3",
        period: "2026-Q1",
        artifact_path: "business-signals/2026-Q1/current.json",
        input_hash: "business-signal-hash",
      },
    ]);
    assert.equal(
      cloud?.evidence.evidence_context,
      "Revenue driver observed: cloud subscriptions Revenue driver observed: cloud consumption Revenue driver observed: enterprise cloud demand",
    );
  });

  it("ignores unknown signal IDs safely", () => {
    const artifact = buildQuarterUnderstanding({
      ...inputs(),
      reasoningOutput: {
        reasoning_schema_version: "1.0.0",
        understandings: [
          {
            category: "revenue",
            semantic_anchor_key: "cloud_demand",
            summary: "Cloud demand remains important.",
            importance: "high",
            signal_agreement: "corroborating",
            company_knowledge_alignment: "consistent",
            supporting_signal_ids: ["signal_revenue_1", "missing_signal"],
          },
          {
            category: "customer",
            semantic_anchor_key: "unknown_only",
            summary: "This should be skipped.",
            importance: "medium",
            signal_agreement: "corroborating",
            company_knowledge_alignment: "consistent",
            supporting_signal_ids: ["missing_signal"],
          },
        ],
      },
    });

    assert.equal(artifact.understandings.length, 1);
    assert.deepEqual(
      artifact.understandings[0]?.evidence.signal_refs.map((signal) => signal.signal_id),
      ["signal_revenue_1"],
    );
  });

  it("assembles deterministic confidence scores", () => {
    const artifact = buildQuarterUnderstanding(inputs());

    assert.deepEqual(confidenceFor(artifact, "cloud_demand"), {
      score: 0.9,
      evidence_count: 3,
      source_reliability: "high",
      signal_agreement: "corroborating",
      company_knowledge_alignment: "consistent",
    });
    assert.deepEqual(confidenceFor(artifact, "ai_infrastructure"), {
      score: 0.75,
      evidence_count: 2,
      source_reliability: "medium",
      signal_agreement: "corroborating",
      company_knowledge_alignment: "consistent",
    });
    assert.equal(confidenceFor(artifact, "margin_pressure")?.score, 0.6);
    assert.equal(confidenceFor(artifact, "customer_concentration")?.score, 0.45);
  });

  it("generates lineage from company knowledge, business signals, and derived inputs", () => {
    const artifact = buildQuarterUnderstanding(inputs());

    assert.deepEqual(artifact.lineage.derived_from, [
      {
        path: "business-signals/2026-Q1/current.json",
        version: 3,
        input_hash: "business-signal-hash",
      },
      {
        path: "company-knowledge/current.json",
        version: 2,
        input_hash: "company-knowledge-hash",
      },
      {
        path: "upstream/business-signals/source.json",
        version: 1,
        input_hash: "upstream-signal-hash",
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

  it("adds a Business Signal artifact auto-lineage reference without caller-supplied derivedFrom", () => {
    const artifact = buildQuarterUnderstanding({
      ...inputs(),
      derivedFrom: [],
      businessSignalArtifact: {
        ...businessSignals(),
        lineage: {
          ...businessSignals().lineage,
          derived_from: [],
        },
      },
    });

    assert.deepEqual(artifact.lineage.derived_from, [
      {
        path: "business-signals/2026-Q1/current.json",
        version: 3,
        input_hash: "business-signal-hash",
      },
    ]);
    assert.equal(artifact.understandings[0]?.evidence.signal_refs[0]?.artifact_path, "business-signals/2026-Q1/current.json");
  });

  it("generates metadata with stable defaults and input hash", () => {
    const artifact = buildQuarterUnderstanding(inputs());

    assert.equal(artifact.metadata.schema_version, "1.0.0");
    assert.equal(artifact.metadata.pipeline_version, "quarter-understanding-builder-v1");
    assert.equal(artifact.metadata.model_version, "deterministic-builder-v1");
    assert.equal(artifact.metadata.prompt_version, "none");
    assert.equal(artifact.metadata.generated_at, "2026-06-08T00:00:00.000Z");
    assert.equal(artifact.metadata.understanding_version, 1);
    assert.ok(artifact.metadata.input_hash);
  });

  it("keeps input hash stable for volatile generated_at values", () => {
    const first = buildQuarterUnderstanding(inputs());
    const changedGeneratedAt = buildQuarterUnderstanding({
      ...inputs(),
      generatedAt: "2099-01-01T00:00:00.000Z",
      companyKnowledge: {
        ...companyKnowledge(),
        metadata: {
          ...companyKnowledge().metadata,
          generated_at: "2099-01-01T00:00:00.000Z",
        },
      },
      businessSignalArtifact: {
        ...businessSignals(),
        metadata: {
          ...businessSignals().metadata,
          generated_at: "2099-01-01T00:00:00.000Z",
        },
      },
    });
    const identical = buildQuarterUnderstanding(inputs());

    assert.equal(first.metadata.input_hash, changedGeneratedAt.metadata.input_hash);
    assert.equal(first.metadata.input_hash, identical.metadata.input_hash);
  });

  it("changes input hash when reasoning, signals, company knowledge, or reporting period changes", () => {
    const base = buildQuarterUnderstanding(inputs());
    const reasoningChanged = buildQuarterUnderstanding({
      ...inputs(),
      reasoningOutput: {
        ...reasoningOutput(),
        understandings: [
          {
            ...reasoningOutput().understandings[0]!,
            summary: "Changed reasoning.",
          },
        ],
      },
    });
    const signalsChanged = buildQuarterUnderstanding({
      ...inputs(),
      businessSignalArtifact: {
        ...businessSignals(),
        signals: [
          {
            ...businessSignals().signals[0]!,
            summary: "Changed signal.",
          },
        ],
      },
    });
    const knowledgeChanged = buildQuarterUnderstanding({
      ...inputs(),
      companyKnowledge: {
        ...companyKnowledge(),
        products: ["changed product"],
      },
    });
    const periodChanged = buildQuarterUnderstanding({
      ...inputs(),
      reportingPeriod: "2026-Q2",
    });

    assert.notEqual(base.metadata.input_hash, reasoningChanged.metadata.input_hash);
    assert.notEqual(base.metadata.input_hash, signalsChanged.metadata.input_hash);
    assert.notEqual(base.metadata.input_hash, knowledgeChanged.metadata.input_hash);
    assert.notEqual(base.metadata.input_hash, periodChanged.metadata.input_hash);
  });

  it("orders understandings by importance and semantic anchor", () => {
    const artifact = buildQuarterUnderstanding(inputs());

    assert.deepEqual(
      artifact.understandings.map((understanding) => `${understanding.importance}:${understanding.semantic_anchor_key}`),
      [
        "high:cloud_demand",
        "medium:ai_infrastructure",
        "medium:customer_concentration",
        "low:margin_pressure",
      ],
    );
  });

  it("is deterministic for repeated executions with identical inputs", () => {
    const first = buildQuarterUnderstanding(inputs());
    const second = buildQuarterUnderstanding(inputs());

    assert.deepEqual(first, second);
  });

  it("returns a valid empty artifact when no valid supported understandings exist", () => {
    const artifact = buildQuarterUnderstanding({
      companyKnowledge: null,
      businessSignalArtifact: null,
      reasoningOutput: null,
      reportingPeriod: "2026-Q1",
      generatedAt: "2026-06-08T00:00:00.000Z",
    });

    assert.equal(artifact.company, "");
    assert.equal(artifact.period, "2026-Q1");
    assert.deepEqual(artifact.understandings, []);
    assert.deepEqual(artifact.lineage.derived_from, []);
    assert.deepEqual(artifact.lineage.source_filings, []);
    assert.ok(artifact.metadata.input_hash);
    assertNoUndefined(artifact);
  });

  it("does not emit undefined values anywhere in the artifact", () => {
    assertNoUndefined(buildQuarterUnderstanding(inputs()));
  });
});

function inputs(): BuildQuarterUnderstandingInputs {
  return {
    companyKnowledge: companyKnowledge(),
    businessSignalArtifact: businessSignals(),
    reasoningOutput: reasoningOutput(),
    reportingPeriod: "2026-Q1",
    derivedFrom: [
      {
        path: "company-knowledge/current.json",
        version: 2,
        input_hash: "company-knowledge-hash",
      },
    ],
    generatedAt: "2026-06-08T00:00:00.000Z",
  };
}

function reasoningOutput(): LLMReasoningOutput {
  return {
    reasoning_schema_version: "1.0.0",
    understandings: [
      {
        category: "margin",
        semantic_anchor_key: "margin_pressure",
        summary: "Margins are under pressure.",
        importance: "low",
        signal_agreement: "mixed",
        company_knowledge_alignment: "consistent",
        supporting_signal_ids: ["signal_margin_1"],
      },
      {
        category: "revenue",
        semantic_anchor_key: "cloud_demand",
        summary: "Cloud demand remains important.",
        importance: "high",
        signal_agreement: "corroborating",
        company_knowledge_alignment: "consistent",
        supporting_signal_ids: ["signal_revenue_1", "signal_revenue_2", "signal_revenue_3"],
      },
      {
        category: "customer",
        semantic_anchor_key: "customer_concentration",
        summary: "Customer concentration needs attention.",
        importance: "medium",
        signal_agreement: "conflicting",
        company_knowledge_alignment: "not_applicable",
        supporting_signal_ids: ["signal_customer_1"],
      },
      {
        category: "operational",
        semantic_anchor_key: "ai_infrastructure",
        summary: "AI infrastructure investment is increasing.",
        importance: "medium",
        signal_agreement: "corroborating",
        company_knowledge_alignment: "consistent",
        supporting_signal_ids: ["signal_operational_1", "signal_operational_2"],
      },
    ],
  };
}

function businessSignals(): BusinessSignalArtifact {
  return {
    company: "Microsoft",
    period: "2026-Q1",
    signals: [
      signal("signal_revenue_1", "revenue", "Revenue driver observed: cloud subscriptions"),
      signal("signal_revenue_2", "revenue", "Revenue driver observed: cloud consumption"),
      signal("signal_revenue_3", "revenue", "Revenue driver observed: enterprise cloud demand"),
      signal("signal_margin_1", "margin", "Margin pressure observed: infrastructure cost"),
      signal("signal_customer_1", "customer", "Customer concentration observed: enterprise customers"),
      signal("signal_operational_1", "operational", "Operational signal observed: AI infrastructure"),
      signal("signal_operational_2", "operational", "Operational signal observed: data center capacity"),
    ],
    metadata: {
      schema_version: "1.0.0",
      pipeline_version: "business-signal-builder-v1",
      signal_version: 3,
      generated_at: "2026-06-08T00:00:00.000Z",
      input_hash: "business-signal-hash",
    },
    lineage: {
      derived_from: [
        {
          path: "upstream/business-signals/source.json",
          version: 1,
          input_hash: "upstream-signal-hash",
        },
      ],
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
      ],
      model_version: "deterministic-v1",
      prompt_version: "none",
    },
  };
}

function signal(
  signalId: string,
  category: BusinessSignalArtifact["signals"][number]["category"],
  summary: string,
): BusinessSignalArtifact["signals"][number] {
  return {
    signal_id: signalId,
    category,
    summary,
    direction: "neutral",
    magnitude: "low",
    confidence: 0.8,
    evidence: [
      {
        evidence_id: `evidence_${signalId}`,
        source: "company-knowledge",
        description: summary,
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
          id: "2026",
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

function confidenceFor(artifact: QuarterUnderstandingArtifact, semanticAnchorKey: string) {
  return artifact.understandings.find((understanding) =>
    understanding.semantic_anchor_key === semanticAnchorKey)?.confidence;
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
