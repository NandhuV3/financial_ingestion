import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type { TrustSignalsArtifactContent } from "../../trust-signals-builder/types.js";
import { artifact, TestArtifactRepository } from "../../business-signals-builder/tests/artifact-fixtures.js";
import type {
  ConceptRegistryContent,
  QuarterUnderstandingBuilderInput,
  QuarterUnderstandingArtifactContent,
} from "../types.js";
import type { UnderstandingCategory } from "../contract.js";

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
        artifact_path: "quarter-change-1",
        artifact_version: 1,
        absent_reason: null,
      },
      topic_evolution: {
        available: false,
        artifact_path: null,
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
  return artifact("trust-signals-1", "trust_signals", {
    company_id: "MSFT",
    period_id: "2026-Q2",
    trust_signals: [
      {
        signal_id: "trust-signal-1",
        signal_type: "COMMITMENT_OVERDUE",
        company_id: "MSFT",
        period_id: "2026-Q2",
        dimension: "commitment_follow_through",
        severity: "high",
        direction: "negative",
        observation: "Commitment status observed: overdue.",
        evidence_refs: ["commitment-evidence-1"],
        source_artifact_refs: [
          {
            artifact_id: "commitment-tracking-1",
            artifact_type: "commitment_tracking",
            artifact_version: 1,
          },
        ],
        source_record_refs: ["commitment-1"],
        source_artifact: "commitment_tracking",
        rule_ref: "trust_signals.commitment.overdue",
        confidence: 0.82,
        lifecycle: {
          status: "escalated",
          first_seen_period: "2026-Q2",
          last_seen_period: "2026-Q2",
        },
      },
    ],
    summary: {
      total_signals: 1,
      positive_signals: 0,
      negative_signals: 1,
      neutral_signals: 0,
      high_severity_signals: 1,
    },
    confidence: {
      overall: 0.8,
      source_data_confidence: 0.25,
      rule_evaluation_confidence: 0.82,
      evidence_completeness_score: 1,
    },
    enrichment_status: {
      commitment_tracking: {
        available: true,
        artifact_path: "commitment-tracking-1",
        artifact_version: 1,
        absent_reason: null,
      },
      narrative_consistency: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Narrative Consistency pillar was not provided.",
      },
      accounting_stability: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Accounting Stability pillar was not provided.",
      },
      capital_allocation_tracking: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Capital Allocation Tracking pillar was not provided.",
      },
    },
    depth_indicator: {
      overall: "base",
      commitment_dimension: "present",
      narrative_dimension: "absent",
      explanation_dimension: "absent",
      accounting_dimension: "absent",
      capital_allocation_dimension: "absent",
    },
    missing_dimensions: [
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ],
    evaluation_hooks: {
      available_pillar_count: 1,
      emitted_signal_count: 1,
      missing_dimension_count: 4,
      rule_count: 26,
    },
  });
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
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    understandings: [
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
    ],
    proposed_concepts: [
      {
        proposed_concept_id: "proposed:revenue:revenue_signals_show_current_business_momentum",
        title: "Revenue signals show current business momentum",
        description: "Proposed concept for revenue interpretation.",
        evidence_refs: ["signal-growth-1", "revenue_drivers.0"],
        rationale: "Concept Registry enrichment was unavailable, so this understanding is emitted without a concept_id.",
      },
    ],
    enrichment_status: {
      trust_signals: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Trust Signals enrichment was not provided.",
      },
      topic_evolution: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Topic Evolution enrichment was not provided.",
      },
      concept_registry: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Concept Registry enrichment was not provided.",
      },
    },
    depth_indicator: {
      overall: "base",
      trust_dimension: "absent",
      longitudinal_dimension: "absent",
    },
    confidence: {
      overall: 0.8,
      grounding_score: 0.8,
      signal_utilization_score: 1,
      evidence_coverage_score: 1,
      interpretation_quality_score: 0.8,
    },
    evaluation_hooks: {
      prompt_version: "deterministic-quarter-understanding-v1",
      model_version: "deterministic",
      understanding_count: 1,
      signal_utilization: {
        available_signal_count: 2,
        used_signal_count: 1,
        ignored_signal_count: 1,
      },
      grounding: {
        evidence_package_count: 1,
        missing_evidence_count: 0,
      },
      concept_usage: {
        concept_registry_available: false,
        emitted_concept_count: 0,
        proposed_concept_count: 1,
      },
      depth: {
        overall: "base",
        trust_dimension: "absent",
        longitudinal_dimension: "absent",
      },
      enrichment_status: {
        trust_signals: {
          available: false,
          artifact_path: null,
          artifact_version: null,
          absent_reason: "Trust Signals enrichment was not provided.",
        },
        topic_evolution: {
          available: false,
          artifact_path: null,
          artifact_version: null,
          absent_reason: "Topic Evolution enrichment was not provided.",
        },
        concept_registry: {
          available: false,
          artifact_path: null,
          artifact_version: null,
          absent_reason: "Concept Registry enrichment was not provided.",
        },
      },
    },
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
