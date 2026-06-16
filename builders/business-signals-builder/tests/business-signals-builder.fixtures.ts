import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type {
  BusinessSignal,
  BusinessSignalsArtifactContent,
  BusinessSignalsBuilderInput,
  QuarterChangeArtifactContent,
  TopicEvolutionArtifactContent,
} from "../types.js";
import { artifact } from "./artifact-fixtures.js";

export { artifact, TestArtifactRepository } from "./artifact-fixtures.js";

export function input(): BusinessSignalsBuilderInput {
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

export function quarterChangeArtifact(): Artifact<QuarterChangeArtifactContent> {
  return artifact("quarter-change-1", "quarter_change", {
    changes: [
      {
        change_type: "NEW_CATEGORY",
        category: "AI infrastructure",
        previous_importance: null,
        current_importance: "high",
        previous_evidence_count: 0,
        current_evidence_count: 3,
        previous_theme_names: [],
        current_theme_names: ["AI capacity"],
      },
    ],
    topic_changes: [
      {
        change_type: "TOPIC_INTENSIFIED",
        topic_id: "cloud",
        previous_categories: ["operations"],
        current_categories: ["operations"],
        previous_theme_names: ["Cloud"],
        current_theme_names: ["Cloud"],
        previous_importance: "medium",
        current_importance: "high",
        previous_evidence_count: 2,
        current_evidence_count: 5,
      },
    ],
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
      {
        topic_id: "devices",
        topic_name: "Devices",
        presence_state: "persistent",
        trend_state: "weakening",
        current_status: "present",
        quarters_present: 3,
        presence_ratio: 0.75,
      },
      {
        topic_id: "legacy",
        topic_name: "Legacy",
        presence_state: "insufficient_history",
        trend_state: "insufficient_history",
        current_status: "present",
        quarters_present: 1,
        presence_ratio: 0.25,
      },
    ],
  });
}

export function validBusinessSignalsContent(): BusinessSignalsArtifactContent {
  const signal: BusinessSignal = {
    signal_id: "signal-1",
    signal_type: "REVENUE_DRIVER_OBSERVED",
    company_id: "MSFT",
    period_id: "2026-Q2",
    category: "growth",
    direction: "stable",
    magnitude: "medium",
    observation: "Revenue driver observed: Cloud consumption",
    evidence_refs: ["company_knowledge.revenue_drivers.0:2026-Q2"],
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
  };

  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    signals: [signal],
    enrichment_status: {
      quarter_change: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Quarter Change enrichment was not provided.",
      },
      topic_evolution: {
        available: false,
        artifact_path: null,
        artifact_version: null,
        absent_reason: "Topic Evolution enrichment was not provided.",
      },
    },
    depth_indicator: {
      overall: "base",
    },
    signal_summary: {
      total_signals: 1,
      by_category: {
        growth: 1,
        margin: 0,
        product: 0,
        customer: 0,
        competitive: 0,
        strategic: 0,
      },
      by_magnitude: {
        low: 0,
        medium: 1,
        high: 0,
      },
    },
  };
}

