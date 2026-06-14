import type { BusinessSignal, BusinessSignalArtifact } from "../business-signal-intelligence/types/business-signal.types.js";
import type { QuarterChange, QuarterChangeReport } from "../change-engine/change.types.js";
import type { TopicChange } from "../change-engine/topic-change.types.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import type { TopicEvolution, TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";

export type QuarterInsight = {
  insight_type:
    | "strength"
    | "concern"
    | "change"
    | "watchlist";
  category: string;
  semantic_anchor_key: string;
  summary: string;
  importance: "high" | "medium" | "low";
  source_anchor_keys?: string[];
  source_summaries?: string[];
  source_kinds?: string[];
  signal_agreement?: "corroborating" | "mixed" | "conflicting";
};

export type BuildDeterministicQuarterUnderstandingInputs = {
  companyKnowledge?: CompanyKnowledge | null;
  businessSignalArtifact?: BusinessSignalArtifact | null;
  quarterChange?: QuarterChangeReport | null;
  topicEvolution?: TopicEvolutionReport | null;
};

export function buildDeterministicQuarterInsights(
  inputs: BuildDeterministicQuarterUnderstandingInputs,
): QuarterInsight[] {
  return dedupeInsights([
    ...insightsFromBusinessSignals(inputs.businessSignalArtifact),
    ...insightsFromQuarterChange(inputs.quarterChange),
    ...insightsFromTopicEvolution(inputs.topicEvolution),
    ...insightsFromCompanyKnowledge(inputs.companyKnowledge),
  ]).sort(compareInsights);
}

function insightsFromBusinessSignals(artifact?: BusinessSignalArtifact | null): QuarterInsight[] {
  return (artifact?.signals ?? []).map((signal) => insightFromBusinessSignal(signal));
}

function insightFromBusinessSignal(signal: BusinessSignal): QuarterInsight {
  const anchor = semanticAnchorFromText(signal.summary);
  const importance = importanceFromMagnitude(signal.magnitude);

  switch (signal.signal_type) {
    case "revenue_driver":
    case "competitive_advantage":
    case "persistent_topic":
    case "strengthening_topic":
      return {
        insight_type: "strength",
        category: signal.category,
        semantic_anchor_key: anchor,
        summary: signal.summary,
        importance,
      };
    case "topic_new":
    case "topic_intensified":
      return {
        insight_type: "change",
        category: signal.category,
        semantic_anchor_key: anchor,
        summary: signal.summary,
        importance,
      };
    case "customer_dependency":
    case "operating_dependency":
      return {
        insight_type: "concern",
        category: signal.category,
        semantic_anchor_key: anchor,
        summary: signal.summary,
        importance,
      };
    case "topic_weakened":
    case "dormant_topic":
      return {
        insight_type: "watchlist",
        category: signal.category,
        semantic_anchor_key: anchor,
        summary: signal.summary,
        importance,
      };
  }
}

function insightsFromQuarterChange(report?: QuarterChangeReport | null): QuarterInsight[] {
  if (!report) {
    return [];
  }

  return [
    ...report.topic_changes.map(insightFromTopicChange),
    ...report.changes.map(insightFromCategoryChange),
  ];
}

function insightFromTopicChange(change: TopicChange): QuarterInsight {
  const topicLabel = labelFromTopicId(change.topic_id);
  const category = firstText(change.current_categories) || firstText(change.previous_categories) || "operational";

  switch (change.change_type) {
    case "TOPIC_NEW":
      return {
        insight_type: "change",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `New topic observed: ${topicLabel}.`,
        importance: change.current_importance ?? "medium",
      };
    case "TOPIC_DISAPPEARED":
      return {
        insight_type: "watchlist",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `Topic disappeared from the current quarter: ${topicLabel}.`,
        importance: change.previous_importance ?? "medium",
      };
    case "TOPIC_INTENSIFIED":
      return {
        insight_type: "change",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `Topic intensified this quarter: ${topicLabel}.`,
        importance: change.current_importance ?? "medium",
      };
    case "TOPIC_WEAKENED":
      return {
        insight_type: "watchlist",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `Topic weakened this quarter: ${topicLabel}.`,
        importance: change.current_importance ?? change.previous_importance ?? "medium",
      };
    case "TOPIC_PERSISTED":
      return {
        insight_type: "strength",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `Topic persisted across quarters: ${topicLabel}.`,
        importance: change.current_importance ?? change.previous_importance ?? "medium",
      };
    case "TOPIC_EVOLVED":
      return {
        insight_type: "change",
        category,
        semantic_anchor_key: change.topic_id,
        summary: `Topic evolved this quarter: ${topicLabel}.`,
        importance: change.current_importance ?? change.previous_importance ?? "medium",
      };
  }
}

function insightFromCategoryChange(change: QuarterChange): QuarterInsight {
  const categoryLabel = change.category.trim();
  const anchor = semanticAnchorFromText(categoryLabel);

  switch (change.change_type) {
    case "NEW_CATEGORY":
      return {
        insight_type: "change",
        category: change.category,
        semantic_anchor_key: anchor,
        summary: `New filing category observed: ${categoryLabel}.`,
        importance: change.current_importance ?? "medium",
      };
    case "REMOVED_CATEGORY":
      return {
        insight_type: "watchlist",
        category: change.category,
        semantic_anchor_key: anchor,
        summary: `Filing category removed this quarter: ${categoryLabel}.`,
        importance: change.previous_importance ?? "medium",
      };
    case "IMPORTANCE_INCREASED":
    case "EVIDENCE_INCREASED":
      return {
        insight_type: "change",
        category: change.category,
        semantic_anchor_key: anchor,
        summary: `Category strengthened this quarter: ${categoryLabel}.`,
        importance: change.current_importance ?? "medium",
      };
    case "IMPORTANCE_DECREASED":
    case "EVIDENCE_DECREASED":
      return {
        insight_type: "watchlist",
        category: change.category,
        semantic_anchor_key: anchor,
        summary: `Category weakened this quarter: ${categoryLabel}.`,
        importance: change.current_importance ?? change.previous_importance ?? "medium",
      };
  }
}

function insightsFromTopicEvolution(report?: TopicEvolutionReport | null): QuarterInsight[] {
  return (report?.topics ?? []).map((topic) => insightFromTopicEvolution(topic));
}

function insightFromTopicEvolution(topic: TopicEvolution): QuarterInsight {
  const category = firstText(topic.history.flatMap((observation) =>
    Array.isArray(observation.categories) ? observation.categories : [],
  )) || "operational";

  if (topic.trend_state === "strengthening") {
    return {
      insight_type: "strength",
      category,
      semantic_anchor_key: topic.topic_id,
      summary: `Topic is strengthening over time: ${topic.topic_name}.`,
      importance: "high",
    };
  }

  if (topic.trend_state === "weakening") {
    return {
      insight_type: "concern",
      category,
      semantic_anchor_key: topic.topic_id,
      summary: `Topic is weakening over time: ${topic.topic_name}.`,
      importance: "medium",
    };
  }

  if (topic.presence_state === "persistent") {
    return {
      insight_type: "strength",
      category,
      semantic_anchor_key: topic.topic_id,
      summary: `Topic has persisted across filings: ${topic.topic_name}.`,
      importance: "medium",
    };
  }

  if (topic.presence_state === "recurring") {
    return {
      insight_type: "strength",
      category,
      semantic_anchor_key: topic.topic_id,
      summary: `Topic is recurring across filings: ${topic.topic_name}.`,
      importance: "medium",
    };
  }

  if (topic.presence_state === "dormant" || topic.presence_state === "disappeared") {
    return {
      insight_type: "watchlist",
      category,
      semantic_anchor_key: topic.topic_id,
      summary: `Topic needs monitoring: ${topic.topic_name}.`,
      importance: "medium",
    };
  }

  return {
    insight_type: "watchlist",
    category,
    semantic_anchor_key: topic.topic_id,
    summary: `Topic has limited history: ${topic.topic_name}.`,
    importance: "low",
  };
}

function insightsFromCompanyKnowledge(companyKnowledge?: CompanyKnowledge | null): QuarterInsight[] {
  if (!companyKnowledge) {
    return [];
  }

  return [
    ...companyKnowledge.revenue_drivers.map((value) => ({
      insight_type: "strength" as const,
      category: "revenue",
      semantic_anchor_key: semanticAnchorFromText(value),
      summary: `Revenue driver remains central: ${value}.`,
      importance: "medium" as const,
    })),
    ...companyKnowledge.competitive_positioning.map((value) => ({
      insight_type: "strength" as const,
      category: "competitive",
      semantic_anchor_key: semanticAnchorFromText(value.signal),
      summary: `Competitive position remains relevant: ${value.signal}.`,
      importance: "medium" as const,
    })),
    ...(companyKnowledge.opportunities ?? []).map((value) => ({
      insight_type: "strength" as const,
      category: "growth",
      semantic_anchor_key: semanticAnchorFromText(value),
      summary: `Opportunity identified in Company Knowledge: ${value}.`,
      importance: "medium" as const,
    })),
    ...(companyKnowledge.risks ?? []).map((value) => ({
      insight_type: "concern" as const,
      category: "operational",
      semantic_anchor_key: semanticAnchorFromText(value),
      summary: `Risk identified in Company Knowledge: ${value}.`,
      importance: "medium" as const,
    })),
    ...companyKnowledge.key_dependencies.map((value) => ({
      insight_type: "watchlist" as const,
      category: "dependency",
      semantic_anchor_key: semanticAnchorFromText(value.description),
      summary: `Dependency requires monitoring: ${value.description}.`,
      importance: "medium" as const,
    })),
  ];
}

function dedupeInsights(values: QuarterInsight[]): QuarterInsight[] {
  const seen = new Set<string>();
  const output: QuarterInsight[] = [];

  for (const value of values) {
    const key = `${value.insight_type}|${value.category}|${value.semantic_anchor_key}|${value.summary}`.toLowerCase();

    if (!value.semantic_anchor_key || !value.summary.trim() || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(value);
  }

  return output;
}

function compareInsights(left: QuarterInsight, right: QuarterInsight): number {
  return insightTypeRank(left.insight_type) - insightTypeRank(right.insight_type)
    || importanceRank(right.importance) - importanceRank(left.importance)
    || left.semantic_anchor_key.localeCompare(right.semantic_anchor_key)
    || left.summary.localeCompare(right.summary);
}

function insightTypeRank(value: QuarterInsight["insight_type"]): number {
  if (value === "strength") return 1;
  if (value === "concern") return 2;
  if (value === "change") return 3;

  return 4;
}

function importanceRank(value: QuarterInsight["importance"]): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;

  return 1;
}

function importanceFromMagnitude(value: BusinessSignal["magnitude"]): QuarterInsight["importance"] {
  if (value === "high") return "high";
  if (value === "medium") return "medium";

  return "low";
}

function semanticAnchorFromText(value: string): string {
  return value.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function labelFromTopicId(value: string): string {
  return value.trim().replace(/[_-]+/g, " ");
}

function firstText(values: Array<string | null | undefined>): string {
  return values.map((value) => value?.trim() ?? "").find(Boolean) ?? "";
}
