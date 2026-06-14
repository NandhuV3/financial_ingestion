import type { QuarterInsight } from "./build-deterministic-quarter-understanding.js";

export type SourceRef = {
  source_type: string;
  anchor_key: string;
  category: string;
  insight_type: QuarterInsight["insight_type"];
  importance: QuarterInsight["importance"];
  summary: string;
};

export type QuarterConcept = {
  concept_id: string;
  concept_name: string;
  strengths: string[];
  concerns: string[];
  changes: string[];
  watch_items: string[];
  topic_ids: string[];
  source_refs: SourceRef[];
  importance_score: number;
};

export function buildQuarterUnderstandingConcepts(insights: QuarterInsight[]): QuarterConcept[] {
  const concepts = new Map<string, QuarterConcept>();

  for (const insight of insights) {
    const conceptId = normalizeConceptId(insight.semantic_anchor_key, insight.summary);

    if (!conceptId) {
      continue;
    }

    const concept = concepts.get(conceptId) ?? {
      concept_id: conceptId,
      concept_name: conceptName(conceptId),
      strengths: [],
      concerns: [],
      changes: [],
      watch_items: [],
      topic_ids: [],
      source_refs: [],
      importance_score: 0,
    };
    const sourceRef: SourceRef = {
      source_type: sourceTypeForInsight(insight),
      anchor_key: insight.semantic_anchor_key,
      category: insight.category,
      insight_type: insight.insight_type,
      importance: insight.importance,
      summary: insight.summary,
    };

    addUnique(concept.topic_ids, insight.semantic_anchor_key);
    addUniqueRef(concept.source_refs, sourceRef);
    addObservation(concept, insight);
    concept.importance_score += importanceScoreForInsight(insight);
    concepts.set(conceptId, concept);
  }

  return [...concepts.values()].sort(compareConcepts);
}

export function normalizeConceptId(anchorKey: string, summary = ""): string {
  const text = normalizeText(`${anchorKey} ${stripTemplatePrefix(summary)}`);

  if (text.includes("cloud") || text.includes("azure")) {
    return "cloud_platform_growth";
  }

  if (text.includes("artificial_intelligence")
    || text.includes("openai")
    || text.includes("ai_infrastructure")
    || /(^|_)ai(_|$)/.test(text)) {
    return "ai_investment_and_dependency";
  }

  if (text.includes("regulation")
    || text.includes("regulatory")
    || text.includes("compliance")
    || text.includes("data_protection")) {
    return "regulatory_pressure";
  }

  if (text.includes("supply_chain")
    || text.includes("component")
    || text.includes("supplier")
    || text.includes("datacenter")
    || text.includes("data_center")
    || text.includes("hardware")) {
    return "infrastructure_supply_dependency";
  }

  if (text.includes("cybersecurity") || /(^|_)security(_|$)/.test(text)) {
    return "cybersecurity";
  }

  if (text.includes("competition") || text.includes("competitive") || text.includes("competitor")) {
    return "competitive_pressure";
  }

  if (text.includes("macroeconomic")
    || text.includes("inflation")
    || text.includes("geopolitical")
    || text.includes("it_spending")) {
    return "macroeconomic_exposure";
  }

  if (text.includes("taxation") || /(^|_)tax(_|$)/.test(text)) {
    return "taxation";
  }

  if (text.includes("product_quality") || /(^|_)quality(_|$)/.test(text)) {
    return "product_quality";
  }

  if (text.includes("intellectual_property")) {
    return "intellectual_property";
  }

  if (text.includes("margin")) {
    return "margin_pressure";
  }

  if (text.includes("customer") || text.includes("enterprise")) {
    return "customer_demand";
  }

  if (text.includes("developer") || text.includes("ecosystem")) {
    return "developer_ecosystem";
  }

  if (text.includes("growth")) {
    return "growth_momentum";
  }

  return normalizeAnchor(anchorKey || summary);
}

function addObservation(concept: QuarterConcept, insight: QuarterInsight): void {
  if (insight.insight_type === "strength") {
    addUnique(concept.strengths, insight.summary);
  } else if (insight.insight_type === "concern") {
    addUnique(concept.concerns, insight.summary);
  } else if (insight.insight_type === "change") {
    addUnique(concept.changes, insight.summary);
  } else {
    addUnique(concept.watch_items, insight.summary);
  }
}

function sourceTypeForInsight(insight: QuarterInsight): string {
  const summary = insight.summary.toLowerCase();

  if (/^(revenue driver remains central|competitive position remains relevant|opportunity identified|risk identified|dependency requires monitoring)/.test(summary)) {
    return "company-knowledge";
  }

  if (/^(new topic observed|topic intensified this quarter|topic weakened this quarter|topic disappeared|topic persisted across quarters|topic evolved this quarter|new filing category|filing category removed|category strengthened|category weakened)/.test(summary)) {
    return "quarter-change";
  }

  if (/^topic (is|has|needs)|^dormant topic observed|^persistent topic observed|^strengthening topic observed/.test(summary)) {
    return "topic-evolution";
  }

  if (summary.includes("observed:")) {
    return "business-signals";
  }

  return "deterministic-source";
}

function importanceScoreForInsight(insight: QuarterInsight): number {
  const importance = insight.importance === "high" ? 3 : insight.importance === "medium" ? 2 : 1;
  const summary = insight.summary.toLowerCase();
  const typeScore = insight.insight_type === "change" ? 3
    : insight.insight_type === "strength" ? 2
      : 1;
  const signalScore = /\b(intensified|strengthening|revenue driver|opportunity)\b/.test(summary) ? 3
    : /\b(dependency|risk|persistent|recurring)\b/.test(summary) ? 2
      : 1;

  return importance + typeScore + signalScore;
}

function compareConcepts(left: QuarterConcept, right: QuarterConcept): number {
  return right.importance_score - left.importance_score
    || left.concept_id.localeCompare(right.concept_id);
}

function addUnique(values: string[], value: string): void {
  const trimmed = value.trim();

  if (!trimmed) {
    return;
  }

  if (!values.some((candidate) => candidate.toLowerCase() === trimmed.toLowerCase())) {
    values.push(trimmed);
  }
}

function addUniqueRef(values: SourceRef[], value: SourceRef): void {
  const key = `${value.source_type}|${value.anchor_key}|${value.summary}`.toLowerCase();

  if (!values.some((candidate) =>
    `${candidate.source_type}|${candidate.anchor_key}|${candidate.summary}`.toLowerCase() === key)) {
    values.push(value);
  }
}

function conceptName(conceptId: string): string {
  return conceptId.split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value: string): string {
  return value.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeAnchor(value: string): string {
  return normalizeText(value).slice(0, 80);
}

function stripTemplatePrefix(value: string): string {
  return value
    .replace(/^Revenue driver remains central:\s*/i, "")
    .replace(/^Revenue driver observed:\s*/i, "")
    .replace(/^Competitive position remains relevant:\s*/i, "")
    .replace(/^Competitive signal observed:\s*/i, "")
    .replace(/^Opportunity identified in Company Knowledge:\s*/i, "")
    .replace(/^Risk identified in Company Knowledge:\s*/i, "")
    .replace(/^Dependency requires monitoring:\s*/i, "")
    .replace(/^Dependency observed:\s*/i, "")
    .replace(/^Operating dependency observed:\s*/i, "")
    .trim();
}
