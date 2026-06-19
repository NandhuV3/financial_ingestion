import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type { TrustSignalsArtifactContent } from "../../trust-signals-builder/types.js";
import { validTrustSignalsContent } from "../../trust-signals-builder/tests/trust-signals-builder.fixtures.js";
import { artifact, TestArtifactRepository } from "../../business-signals-builder/tests/artifact-fixtures.js";
import type {
  ConceptRegistryContent,
  QuarterUnderstandingBuilderInput,
  QuarterUnderstandingArtifactContent,
} from "../types.js";
import {
  QUARTER_UNDERSTANDING_MODEL_VERSION,
  QUARTER_UNDERSTANDING_PROMPT_ID,
  type UnderstandingCategory,
} from "../contract.js";
import {
  buildQuarterUnderstandingConfidence,
  buildQuarterUnderstandingEvaluationHooks,
} from "../confidence.js";
import {
  buildQuarterUnderstandingOutputHash,
  buildQuarterUnderstandingReplayability,
} from "../replayability.js";

export { artifact, TestArtifactRepository };

export function input(): QuarterUnderstandingBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
  };
}

export function companyKnowledgeArtifact(): Artifact<CompanyKnowledgeArtifactContent> {
  return artifact("company-knowledge-1", "company_knowledge", {
    company_id: "MSFT",
    period_id: "2026-Q2",
    company_knowledge_version: 1,
    knowledge: {
      business_model: {
        summary: "Microsoft sells software, cloud infrastructure, and productivity services.",
        value_creation: "Enterprise customers run workloads on Microsoft platforms.",
        revenue_structure: "Recurring subscriptions and cloud usage.",
        confidence: 0.86,
        supporting_periods: ["2026-Q2"],
        last_updated_period: "2026-Q2",
      },
      products: [
        {
          product_name: "Azure",
          description: "Cloud infrastructure services.",
          importance: "high",
          confidence: 0.88,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      customers: [
        {
          customer_segment: "Enterprises",
          description: "Organizations using Microsoft software and cloud platforms.",
          confidence: 0.84,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      revenue_structure: {
        summary: "Revenue comes from subscriptions, licenses, and cloud usage.",
        recurring_components: ["subscriptions"],
        transactional_components: ["licenses"],
        confidence: 0.87,
        supporting_periods: ["2026-Q2"],
        last_updated_period: "2026-Q2",
      },
      revenue_drivers: [
        {
          driver: "Cloud consumption",
          description: "Usage growth in cloud services.",
          confidence: 0.82,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      competitive_positioning: [
        {
          positioning: "Enterprise platform breadth",
          rationale: "Integrated software and cloud footprint.",
          confidence: 0.8,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      strategic_priorities: [
        {
          priority: "AI infrastructure",
          description: "Investment in AI datacenter capacity.",
          confidence: 0.83,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
      management_focus: [],
      dependencies: [
        {
          dependency: "Datacenter capacity",
          description: "Cloud and AI services require infrastructure capacity.",
          confidence: 0.81,
          supporting_periods: ["2026-Q2"],
          last_updated_period: "2026-Q2",
        },
      ],
    },
    confidence: {
      overall: 0.84,
      evidence_depth: 0.8,
      history_length: 1,
      consistency_score: 0.83,
      governance_confidence: 0.85,
    },
  });
}

export function businessSignalsArtifact(): Artifact<BusinessSignalsArtifactContent> {
  return artifact("business-signals-1", "business_signals", {
    company_id: "MSFT",
    period_id: "2026-Q2",
    signals: [
      {
        signal_id: "signal-growth-1",
        signal_type: "REVENUE_DRIVER_OBSERVED",
        company_id: "MSFT",
        period_id: "2026-Q2",
        category: "growth",
        direction: "improving",
        magnitude: "high",
        observation: "Revenue driver observed: Cloud consumption.",
        evidence_refs: ["revenue-driver-evidence-1"],
        source_artifact_refs: [
          {
            artifact_id: "company-knowledge-1",
            artifact_type: "company_knowledge",
            artifact_version: 1,
          },
        ],
        rule_ref: "business_signals.durable.revenue_driver_observed",
        company_knowledge_refs: ["revenue_drivers.0"],
        topic_refs: [],
        evidence_confidence: 0.82,
      },
      {
        signal_id: "signal-strategy-1",
        signal_type: "TOPIC_INTENSIFIED",
        company_id: "MSFT",
        period_id: "2026-Q2",
        category: "strategic",
        direction: "improving",
        magnitude: "medium",
        observation: "Movement signal observed through Business Signals.",
        evidence_refs: ["movement-evidence-1"],
        source_artifact_refs: [
          {
            artifact_id: "company-knowledge-1",
            artifact_type: "company_knowledge",
            artifact_version: 1,
          },
        ],
        rule_ref: "business_signals.movement.topic_intensified",
        company_knowledge_refs: ["strategic_priorities.0"],
        topic_refs: ["cloud"],
        evidence_confidence: 0.78,
      },
    ],
    enrichment_status: {
      quarter_change: {
        available: true,
        artifact_ref: "quarter-change-1",
        artifact_version: 1,
        absent_reason: null,
      },
      topic_evolution: {
        available: false,
        artifact_ref: null,
        artifact_version: null,
        absent_reason: "Topic Evolution enrichment was not provided.",
      },
    },
    depth_indicator: {
      overall: "standard",
    },
    signal_summary: {
      total_signals: 2,
      by_category: {
        growth: 1,
        margin: 0,
        product: 0,
        customer: 0,
        competitive: 0,
        strategic: 1,
      },
      by_magnitude: {
        low: 0,
        medium: 1,
        high: 1,
      },
    },
  });
}

export function trustSignalsArtifact(): Artifact<TrustSignalsArtifactContent> {
  return artifact(
    "trust-signals-1",
    "trust_signals",
    validTrustSignalsContent(),
  );
}

export function topicEvolutionArtifact(): Artifact<TopicEvolutionArtifactContent> {
  return artifact("topic-evolution-1", "topic_evolution", {
    topics: [
      {
        topic_id: "cloud",
        topic_name: "Cloud",
        presence_state: "persistent",
        trend_state: "strengthening",
        current_status: "present",
        quarters_present: 4,
        presence_ratio: 1,
      },
    ],
  });
}

export function conceptRegistryArtifact(): Artifact<ConceptRegistryContent> {
  return artifact("concept-registry-1", "concept_registry", {
    concepts: [
      activeConcept("business_model"),
      activeConcept("revenue"),
      activeConcept("products"),
      activeConcept("customers"),
      activeConcept("competition"),
      activeConcept("operations"),
      activeConcept("strategy"),
      activeConcept("execution"),
      activeConcept("trust"),
    ],
  });
}

export function validQuarterUnderstandingContent(): QuarterUnderstandingArtifactContent {
  const enrichmentStatus = {
    trust_signals: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Trust Signals enrichment was not provided.",
    },
    topic_evolution: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Topic Evolution enrichment was not provided.",
    },
    concept_registry: {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: "Concept Registry enrichment was not provided.",
    },
  } as const;
  const depthIndicator = {
    overall: "base",
    trust_dimension: "absent",
    longitudinal_dimension: "absent",
  } as const;
  const understandings = [
    {
      understanding_id: "revenue:revenue_signals_show_current_business_momentum:signal_growth_1",
      category: "revenue",
      title: "Revenue signals show current business momentum",
      explanation: "Revenue interpretation is grounded in current business signals.",
      importance: "high",
      direction: "improving",
      evidence_package: {
        signal_refs: ["signal-growth-1"],
        company_knowledge_refs: ["revenue_drivers.0"],
        trust_signal_refs: [],
        topic_refs: [],
      },
    },
  ] satisfies QuarterUnderstandingArtifactContent["understandings"];
  const proposedConcepts = [
    {
      proposed_concept_id: "proposed:revenue:revenue_signals_show_current_business_momentum",
      title: "Revenue signals show current business momentum",
      description: "Proposed concept for revenue interpretation.",
      evidence_refs: ["signal-growth-1", "revenue_drivers.0"],
      rationale: "Concept Registry enrichment was unavailable, so this understanding is emitted without a concept_id.",
    },
  ];
  const evaluationHooks = buildQuarterUnderstandingEvaluationHooks({
    understandings,
    availableSignalCount: 2,
    proposedConceptCount: proposedConcepts.length,
    depth: depthIndicator,
    enrichmentStatus,
    promptVersion: "quarter-understanding-v1",
    modelVersion: QUARTER_UNDERSTANDING_MODEL_VERSION,
  });
  const contentWithoutReplayability: Omit<
    QuarterUnderstandingArtifactContent,
    "replayability_metadata"
  > = {
    company_id: "MSFT",
    period_id: "2026-Q2",
    understandings,
    proposed_concepts: proposedConcepts,
    enrichment_status: enrichmentStatus,
    depth_indicator: depthIndicator,
    limitations: {
      trust_dimension_gaps: [
        "commitment_follow_through",
        "narrative_consistency",
        "explanation_quality",
        "accounting_stability",
        "capital_allocation_consistency",
      ],
    },
    confidence: buildQuarterUnderstandingConfidence({
      understandings,
      availableSignalCount: 2,
      enrichmentStatus,
    }),
    evaluation_hooks: evaluationHooks,
  };

  return {
    ...contentWithoutReplayability,
    replayability_metadata: buildQuarterUnderstandingReplayability({
      prompt: {
        promptId: QUARTER_UNDERSTANDING_PROMPT_ID,
        version: "quarter-understanding-v1",
        content: "fixture",
        hash: "quarter-understanding-prompt-hash",
        source: "filesystem",
        activationId: null,
      },
      modelVersion: QUARTER_UNDERSTANDING_MODEL_VERSION,
      conceptRegistryVersion: null,
      inputHash: "quarter-understanding-input-hash",
      outputHash: buildQuarterUnderstandingOutputHash(
        contentWithoutReplayability,
      ),
      evaluationHooks,
      evaluationMetadata: {
        prompt_hash: "quarter-understanding-prompt-hash",
      },
      enrichmentStatus,
      depthIndicator,
    }),
  };
}

function activeConcept(category: UnderstandingCategory) {
  return {
    concept_id: `concept:${category}`,
    category,
    title: category,
    status: "active" as const,
  };
}
