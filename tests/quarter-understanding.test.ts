import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildQuarterUnderstanding,
  type BuildQuarterUnderstandingInputs,
  type LLMReasoningOutput,
} from "../src/quarter-understanding-intelligence/build-quarter-understanding.js";
import type { BusinessSignalArtifact } from "../src/business-signal-intelligence/types/business-signal.types.js";
import type { QuarterChangeReport } from "../src/change-engine/change.types.js";
import type { CompanyKnowledge } from "../src/company-knowledge/types/company-knowledge.types.js";
import type { QuarterUnderstandingArtifact } from "../src/quarter-understanding-intelligence/types/quarter-understanding.types.js";
import type { TopicEvolutionReport } from "../src/topic-evolution/topic-evolution.types.js";

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
      {
        path: "company-knowledge/current.json",
        version: 2,
        input_hash: "company-knowledge-hash",
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

  it("generates deterministic strength understandings from durable and trend signals", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    const cloud = understandingFor(artifact, "cloud_platform_growth");
    const ai = understandingFor(artifact, "ai_investment_and_dependency");

    assert.ok(cloud);
    assert.equal(cloud.category, "revenue");
    assert.match(cloud.summary, /Cloud Platform Growth remains a material business theme/);
    assert.match(cloud.evidence.evidence_context, /cloud subscriptions/);
    assert.match(cloud.evidence.evidence_context, /Cloud demand/);

    assert.ok(ai);
    assert.match(ai.summary, /Ai Investment And Dependency remains a material business theme/);
    assert.match(ai.evidence.evidence_context, /AI infrastructure/);
  });

  it("generates deterministic concern understandings from risks and dependency signals", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    const competition = understandingFor(artifact, "competitive_pressure");
    const customers = understandingFor(artifact, "customer_demand");

    assert.ok(competition);
    assert.equal(competition.confidence.signal_agreement, "mixed");
    assert.match(competition.evidence.evidence_context, /competition/);
    assert.match(competition.evidence.evidence_context, /intense competition across product lines/);

    assert.ok(customers);
    assert.match(customers.summary, /requires monitoring/);
    assert.match(customers.evidence.evidence_context, /enterprise customers/);
  });

  it("generates deterministic change understandings from Quarter Change", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    const cloud = understandingFor(artifact, "cloud_platform_growth");
    const revenue = understandingFor(artifact, "revenue");

    assert.ok(cloud);
    assert.match(cloud.evidence.evidence_context, /New topic observed: cloud demand/);
    assert.deepEqual(
      cloud.evidence.signal_refs.map((signal) => signal.signal_id).sort(),
      ["signal_revenue_cloud", "signal_topic_new"],
    );

    assert.ok(revenue);
    assert.match(revenue.evidence.evidence_context, /Category strengthened this quarter: revenue/);
  });

  it("generates deterministic watchlist understandings from weakened and dormant signals", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    const margin = understandingFor(artifact, "margin_pressure");
    const legacy = understandingFor(artifact, "legacy_licensing");

    assert.ok(margin);
    assert.match(margin.summary, /requires monitoring/);
    assert.match(margin.evidence.evidence_context, /Topic weakened this quarter: margin pressure/);

    assert.ok(legacy);
    assert.match(legacy.summary, /requires monitoring/);
    assert.match(legacy.evidence.evidence_context, /Legacy licensing/);
  });

  it("scores deterministic confidence from source agreement and source count", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    assert.equal(confidenceFor(artifact, "cloud_platform_growth")?.score, 0.9);
    assert.equal(confidenceFor(artifact, "competitive_pressure")?.score, 0.6);
    assert.equal(confidenceFor(artifact, "margin_pressure")?.score, 0.45);
    assert.equal(confidenceFor(artifact, "customer_demand")?.score, 0.45);
  });

  it("consolidates related deterministic observations into fewer business-level understandings", () => {
    const artifact = buildQuarterUnderstanding(deterministicInputs());

    assert.equal(artifact.understandings.length <= 8, true);
    assert.equal(artifact.understandings.filter((understanding) =>
      understanding.semantic_anchor_key.includes("cloud")).length, 1);
    assert.equal(artifact.understandings.some((understanding) =>
      understanding.summary.startsWith("Topic ")), false);
  });

  it("changes input hash when deterministic Quarter Change or Topic Evolution inputs change", () => {
    const base = buildQuarterUnderstanding(deterministicInputs());
    const quarterChangeChanged = buildQuarterUnderstanding({
      ...deterministicInputs(),
      quarterChange: {
        ...quarterChange(),
        topic_changes: [
          {
            ...quarterChange().topic_changes[0]!,
            topic_id: "changed_topic",
          },
        ],
      },
    });
    const topicEvolutionChanged = buildQuarterUnderstanding({
      ...deterministicInputs(),
      topicEvolution: {
        ...topicEvolution(),
        topics: [
          {
            ...topicEvolution().topics[0]!,
            trend_state: "weakening",
          },
        ],
      },
    });

    assert.notEqual(base.metadata.input_hash, quarterChangeChanged.metadata.input_hash);
    assert.notEqual(base.metadata.input_hash, topicEvolutionChanged.metadata.input_hash);
  });

  it("supports old Topic Evolution reports without history categories", () => {
    const artifact = buildQuarterUnderstanding({
      ...deterministicInputs(),
      topicEvolution: topicEvolutionWithoutHistoryField("categories"),
    });

    assert.equal(
      artifact.understandings.some((understanding) =>
        understanding.summary.includes("AI infrastructure")),
      true,
    );
    assertNoUndefined(artifact);
  });

  it("supports old Topic Evolution reports without history assignment statuses", () => {
    const artifact = buildQuarterUnderstanding({
      ...deterministicInputs(),
      topicEvolution: topicEvolutionWithoutHistoryField("assignment_statuses"),
    });

    assert.equal(artifact.understandings.length > 0, true);
    assertNoUndefined(artifact);
  });

  it("supports old Topic Evolution reports without history confidence scores", () => {
    const artifact = buildQuarterUnderstanding({
      ...deterministicInputs(),
      topicEvolution: topicEvolutionWithoutHistoryField("confidence_scores"),
    });

    assert.equal(artifact.understandings.length > 0, true);
    assertNoUndefined(artifact);
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

function deterministicInputs(): BuildQuarterUnderstandingInputs {
  return {
    companyKnowledge: companyKnowledge(),
    businessSignalArtifact: deterministicBusinessSignals(),
    quarterChange: quarterChange(),
    topicEvolution: topicEvolution(),
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

function deterministicBusinessSignals(): BusinessSignalArtifact {
  return {
    ...businessSignals(),
    signals: [
      deterministicSignal("signal_revenue_cloud", "revenue_driver", "revenue", "cloud subscriptions"),
      deterministicSignal("signal_customer_dependency", "customer_dependency", "customer", "Customer dependency observed: enterprise customers"),
      deterministicSignal("signal_competitive", "competitive_advantage", "competitive", "developer ecosystem"),
      deterministicSignal("signal_competition_advantage", "competitive_advantage", "competitive", "intense competition across product lines"),
      deterministicSignal("signal_topic_new", "topic_new", "growth", "Cloud demand"),
      deterministicSignal("signal_topic_weakened", "topic_weakened", "margin", "margin pressure"),
      deterministicSignal("signal_strengthening", "strengthening_topic", "operational", "AI infrastructure"),
      deterministicSignal("signal_dormant", "dormant_topic", "dependency", "legacy licensing"),
    ],
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

function deterministicSignal(
  signalId: string,
  signalType: BusinessSignalArtifact["signals"][number]["signal_type"],
  category: BusinessSignalArtifact["signals"][number]["category"],
  summary: string,
): BusinessSignalArtifact["signals"][number] {
  return {
    signal_id: signalId,
    signal_type: signalType,
    category,
    summary,
    direction: "neutral",
    magnitude: signalType === "strengthening_topic" ? "high" : "low",
    confidence: 0.8,
    evidence: [
      {
        evidence_id: `evidence_${signalId}`,
        source: "business-signals",
        description: summary,
      },
    ],
  };
}

function quarterChange(): QuarterChangeReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    previous_filing: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2025-10-30",
      form_type: "10-Q",
      accession_number: "2025",
    },
    current_filing: {
      company: "Microsoft",
      ticker: "MSFT",
      filing_date: "2026-01-28",
      form_type: "10-Q",
      accession_number: "2026",
    },
    summary: {
      new_categories: 0,
      removed_categories: 0,
      importance_increases: 1,
      importance_decreases: 0,
      evidence_increases: 0,
      evidence_decreases: 0,
    },
    changes: [
      {
        change_type: "IMPORTANCE_INCREASED",
        category: "revenue",
        previous_importance: "medium",
        current_importance: "high",
        previous_evidence_count: 1,
        current_evidence_count: 3,
        previous_theme_names: ["Cloud"],
        current_theme_names: ["Cloud growth"],
      },
    ],
    topic_changes: [
      {
        change_type: "TOPIC_NEW",
        topic_id: "cloud_demand",
        previous_categories: [],
        current_categories: ["growth"],
        previous_theme_names: [],
        current_theme_names: ["Cloud demand"],
        previous_importance: null,
        current_importance: "high",
        previous_evidence_count: 0,
        current_evidence_count: 3,
      },
      {
        change_type: "TOPIC_WEAKENED",
        topic_id: "margin_pressure",
        previous_categories: ["margin"],
        current_categories: ["margin"],
        previous_theme_names: ["Margin pressure"],
        current_theme_names: ["Margin pressure"],
        previous_importance: "high",
        current_importance: "medium",
        previous_evidence_count: 4,
        current_evidence_count: 1,
      },
    ],
    topic_summary: {
      persisted_topics: 0,
      evolved_topics: 0,
      intensified_topics: 0,
      weakened_topics: 1,
    },
  };
}

function topicEvolution(): TopicEvolutionReport {
  return {
    company: "Microsoft",
    ticker: "MSFT",
    generated_at: "2026-06-08T00:00:00.000Z",
    history_start: "2025-10-30",
    history_end: "2026-01-28",
    filings_analyzed: 2,
    filing_dates: ["2025-10-30", "2026-01-28"],
    topic_registry_version: "test",
    topic_registry_hash: "hash",
    assignment_policy: {
      included_statuses: ["assigned", "low_confidence"],
      excluded_statuses: ["unassigned", "missing"],
    },
    summary: {
      topics_analyzed: 2,
      topics_present_latest: 1,
      new_topics: 0,
      persistent_topics: 0,
      recurring_topics: 0,
      dormant_topics: 1,
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
        topic_id: "ai_infrastructure",
        topic_name: "AI infrastructure",
        presence_state: "persistent",
        trend_state: "strengthening",
        current_status: "present",
        first_seen: "2025-10-30",
        last_seen: "2026-01-28",
        quarters_present: 2,
        quarters_absent: 0,
        presence_ratio: 1,
        strength_history: [0.4, 0.8],
        history: [
          topicObservation("2025-10-30", "AI infrastructure", "operational"),
          topicObservation("2026-01-28", "AI infrastructure", "operational"),
        ],
      },
      {
        topic_id: "legacy_licensing",
        topic_name: "Legacy licensing",
        presence_state: "dormant",
        trend_state: "stable",
        current_status: "absent",
        first_seen: "2025-10-30",
        last_seen: "2025-10-30",
        quarters_present: 1,
        quarters_absent: 1,
        presence_ratio: 0.5,
        strength_history: [0.5, 0],
        history: [
          topicObservation("2025-10-30", "Legacy licensing", "dependency"),
        ],
      },
    ],
    diagnostics: {
      assigned_topics_used: 2,
      unassigned_topics_ignored: 0,
      themes_without_topic_ignored: 0,
      missing_themes_with_topics_files: [],
      filings_with_no_assigned_topics: [],
      duration_ms: 1,
    },
  };
}

function topicEvolutionWithoutHistoryField(
  field: "categories" | "assignment_statuses" | "confidence_scores",
): TopicEvolutionReport {
  return {
    ...topicEvolution(),
    topics: topicEvolution().topics.map((topic) => ({
      ...topic,
      history: topic.history.map((observation) => {
        const copy: Partial<typeof observation> = { ...observation };

        delete copy[field];

        return copy as typeof observation;
      }),
    })),
  };
}

function topicObservation(filingDate: string, themeName: string, category: string): TopicEvolutionReport["topics"][number]["history"][number] {
  return {
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: filingDate,
    present: true,
    importance: "medium",
    importance_score: 2,
    evidence_count: 2,
    theme_count: 1,
    topic_strength: 0.5,
    theme_names: [themeName],
    categories: [category],
    assignment_statuses: ["assigned"],
    confidence_scores: [0.9],
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

function understandingFor(artifact: QuarterUnderstandingArtifact, semanticAnchorKey: string) {
  return artifact.understandings.find((understanding) =>
    understanding.semantic_anchor_key === semanticAnchorKey);
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
