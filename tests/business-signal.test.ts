import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBusinessSignals,
  type BuildBusinessSignalsInputs,
} from "../src/business-signal-intelligence/build-business-signals.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { QuarterChangeReport } from "../src/change-engine/change.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import type { TopicEvolutionReport } from "../src/topic-evolution/topic-evolution.types.js";

describe("business signal builder", () => {
  it("generates signals from Company Knowledge fields", () => {
    const artifact = buildBusinessSignals(inputs());

    assert.deepEqual(
      artifact.signals.map((signal) => signal.signal_type),
      ["revenue_driver", "customer_dependency", "competitive_advantage", "operating_dependency", "operating_dependency"],
    );
    assert.deepEqual(
      artifact.signals.map((signal) => signal.category),
      ["revenue", "customer", "competitive", "dependency", "dependency"],
    );
    assert.deepEqual(
      artifact.signals.map((signal) => signal.summary),
      [
        "Revenue driver observed: cloud subscriptions",
        "Customer dependency observed: enterprise customers",
        "Competitive signal observed: developer ecosystem",
        "Dependency observed: data center capacity",
        "Operating dependency observed: cloud infrastructure",
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
    assert.equal(artifact.signals.find((signal) => signal.category === "customer")?.confidence, 0.75);
  });

  it("generates movement signals from Quarter Change topic changes", () => {
    const artifact = buildBusinessSignals({
      ...inputs(),
      quarterChange: quarterChange(),
    });

    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "topic_new"
      && signal.direction === "emerging"
      && signal.evidence[0]?.source === "quarter-change"));
    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "topic_intensified"
      && signal.direction === "positive"
      && signal.evidence[0]?.source === "quarter-change"));
    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "topic_weakened"
      && signal.direction === "weakening"
      && signal.evidence[0]?.source === "quarter-change"));
  });

  it("generates trend signals from Topic Evolution", () => {
    const artifact = buildBusinessSignals({
      ...inputs(),
      topicEvolution: topicEvolution(),
    });

    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "persistent_topic"
      && signal.summary === "Persistent topic observed: Cloud"));
    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "strengthening_topic"
      && signal.summary === "Strengthening topic observed: Regulation"));
    assert.ok(artifact.signals.find((signal) =>
      signal.signal_type === "dormant_topic"
      && signal.summary === "Dormant topic observed: Taxation"));
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
    const quarterChangeChanged = buildBusinessSignals({
      ...inputs(),
      quarterChange: quarterChange(),
    });
    const topicEvolutionChanged = buildBusinessSignals({
      ...inputs(),
      topicEvolution: topicEvolution(),
    });

    assert.equal(first.metadata.input_hash, generatedAtChanged.metadata.input_hash);
    assert.equal(first.metadata.input_hash, identical.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, productChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, revenueChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, reportingPeriodChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, quarterChangeChanged.metadata.input_hash);
    assert.notEqual(first.metadata.input_hash, topicEvolutionChanged.metadata.input_hash);
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
    assert.equal(countBySummary(artifact, "Customer dependency observed: enterprise customers"), 1);
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
        "Customer dependency observed: enterprise customers",
        "Competitive signal observed: developer ecosystem",
        "Dependency observed: data center capacity",
        "Operating dependency observed: cloud infrastructure",
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
        path: "company-knowledge/current.json",
        version: 1,
        input_hash: "knowledge-input-hash",
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
      { quarterChange: quarterChange(), topicEvolution: topicEvolution(), generatedAt: "2026-06-08T00:00:00.000Z" },
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

function quarterChange(): QuarterChangeReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    previous_filing: filing("2026-01-28"),
    current_filing: filing("2026-04-29"),
    summary: {
      new_categories: 1,
      removed_categories: 0,
      importance_increases: 1,
      importance_decreases: 1,
      evidence_increases: 1,
      evidence_decreases: 1,
    },
    changes: [],
    topic_summary: {
      persisted_topics: 1,
      evolved_topics: 0,
      intensified_topics: 1,
      weakened_topics: 1,
    },
    topic_changes: [
      topicChange("TOPIC_NEW", "artificial_intelligence", null, "high", 0, 3),
      topicChange("TOPIC_INTENSIFIED", "cloud", "medium", "high", 2, 4),
      topicChange("TOPIC_WEAKENED", "margins", "high", "medium", 4, 2),
      topicChange("TOPIC_DISAPPEARED", "competition", "high", null, 3, 0),
    ],
  };
}

function topicChange(
  changeType: QuarterChangeReport["topic_changes"][number]["change_type"],
  topicId: string,
  previousImportance: QuarterChangeReport["topic_changes"][number]["previous_importance"],
  currentImportance: QuarterChangeReport["topic_changes"][number]["current_importance"],
  previousEvidenceCount: number,
  currentEvidenceCount: number,
): QuarterChangeReport["topic_changes"][number] {
  return {
    change_type: changeType,
    topic_id: topicId,
    previous_categories: previousImportance ? [topicId] : [],
    current_categories: currentImportance ? [topicId] : [],
    previous_theme_names: previousImportance ? [`Previous ${topicId}`] : [],
    current_theme_names: currentImportance ? [`Current ${topicId}`] : [],
    previous_importance: previousImportance,
    current_importance: currentImportance,
    previous_evidence_count: previousEvidenceCount,
    current_evidence_count: currentEvidenceCount,
  };
}

function topicEvolution(): TopicEvolutionReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    generated_at: "2026-06-08T00:00:00.000Z",
    history_start: "2026-01-28",
    history_end: "2026-04-29",
    filings_analyzed: 2,
    filing_dates: ["2026-01-28", "2026-04-29"],
    topic_registry_version: "test",
    topic_registry_hash: "registry-hash",
    assignment_policy: {
      included_statuses: ["assigned", "low_confidence"],
      excluded_statuses: ["unassigned", "missing"],
    },
    summary: {
      topics_analyzed: 3,
      topics_present_latest: 2,
      new_topics: 0,
      persistent_topics: 1,
      recurring_topics: 1,
      dormant_topics: 1,
      disappeared_topics: 0,
      strengthening_topics: 1,
      weakening_topics: 0,
      stable_topics: 1,
      mixed_topics: 0,
      unknown_trend_topics: 0,
      insufficient_history_topics: 0,
    },
    topics: [
      topicEvolutionItem("cloud", "Cloud", "persistent", "stable", "present"),
      topicEvolutionItem("regulation", "Regulation", "recurring", "strengthening", "present"),
      topicEvolutionItem("taxation", "Taxation", "dormant", "insufficient_history", "absent"),
    ],
    diagnostics: {
      assigned_topics_used: 3,
      unassigned_topics_ignored: 0,
      themes_without_topic_ignored: 0,
      missing_themes_with_topics_files: [],
      filings_with_no_assigned_topics: [],
      duration_ms: 12,
    },
  };
}

function topicEvolutionItem(
  topicId: string,
  topicName: string,
  presenceState: TopicEvolutionReport["topics"][number]["presence_state"],
  trendState: TopicEvolutionReport["topics"][number]["trend_state"],
  currentStatus: TopicEvolutionReport["topics"][number]["current_status"],
): TopicEvolutionReport["topics"][number] {
  return {
    topic_id: topicId,
    topic_name: topicName,
    presence_state: presenceState,
    trend_state: trendState,
    current_status: currentStatus,
    first_seen: "2026-01-28",
    last_seen: currentStatus === "present" ? "2026-04-29" : "2026-01-28",
    quarters_present: currentStatus === "present" ? 2 : 1,
    quarters_absent: currentStatus === "present" ? 0 : 1,
    presence_ratio: currentStatus === "present" ? 1 : 0.5,
    strength_history: currentStatus === "present" ? [20, 30] : [20],
    history: [
      {
        filing_date: "2026-01-28",
        form_type: "10-Q",
        accession_number: "previous",
        present: true,
        importance: "medium",
        importance_score: 2,
        evidence_count: 2,
        theme_count: 1,
        topic_strength: 22,
        theme_names: [`Previous ${topicName}`],
        categories: [topicId],
        assignment_statuses: ["assigned"],
        confidence_scores: [0.8],
      },
      {
        filing_date: "2026-04-29",
        form_type: "10-Q",
        accession_number: "current",
        present: currentStatus === "present",
        importance: currentStatus === "present" ? "high" : null,
        importance_score: currentStatus === "present" ? 3 : 0,
        evidence_count: currentStatus === "present" ? 3 : 0,
        theme_count: currentStatus === "present" ? 1 : 0,
        topic_strength: currentStatus === "present" ? 33 : 0,
        theme_names: currentStatus === "present" ? [`Current ${topicName}`] : [],
        categories: currentStatus === "present" ? [topicId] : [],
        assignment_statuses: currentStatus === "present" ? ["assigned"] : [],
        confidence_scores: currentStatus === "present" ? [0.85] : [],
      },
    ],
  };
}

function filing(filingDate: string) {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `accession-${filingDate}`,
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
      derived_from: ["structured-intelligence", "filing-metadata"],
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
