import type { QuarterInsight } from "./build-deterministic-quarter-understanding.js";
import type { QuarterConcept, SourceRef } from "./build-quarter-understanding-concepts.js";

export function consolidateQuarterConcepts(concepts: QuarterConcept[]): QuarterInsight[] {
  return concepts
    .map(consolidateConcept)
    .filter((insight): insight is QuarterInsight => Boolean(insight))
    .sort(compareConsolidatedInsights);
}

function consolidateConcept(concept: QuarterConcept): QuarterInsight | null {
  const sourceRefs = concept.source_refs;

  if (sourceRefs.length === 0) {
    return null;
  }

  const category = chooseCategory(sourceRefs);
  const importance = importanceFromScore(concept.importance_score);
  const hasPositive = concept.strengths.length > 0 || concept.changes.length > 0;
  const hasNegative = concept.concerns.length > 0 || concept.watch_items.length > 0;
  const summary = buildSummary(concept);

  if (!summary) {
    return null;
  }

  return {
    insight_type: hasNegative && !hasPositive ? "concern" : "strength",
    category,
    semantic_anchor_key: concept.concept_id,
    summary,
    importance,
    source_anchor_keys: dedupe(sourceRefs.map((ref) => ref.anchor_key)),
    source_summaries: dedupe(sourceRefs.map((ref) => ref.summary)),
    source_kinds: dedupe(sourceRefs.map((ref) => ref.source_type)),
    signal_agreement: hasPositive && hasNegative ? "mixed" : hasNegative ? "conflicting" : "corroborating",
  };
}

function buildSummary(concept: QuarterConcept): string {
  const subject = concept.concept_name;
  const strength = bestObservation([...concept.strengths, ...concept.changes]);
  const concern = bestObservation([...concept.concerns, ...concept.watch_items]);
  const change = bestObservation(concept.changes);
  const watch = bestObservation(concept.watch_items);
  const strengthPhrase = phrase(strength);
  const concernPhrase = phrase(concern);
  const changePhrase = phrase(change);
  const watchPhrase = phrase(watch);

  if (strength && concern) {
    return `${subject} remains a material business theme, supported by ${strengthPhrase}, while ${lowerFirst(concernPhrase)}.`;
  }

  if (strength && change && normalizePhrase(strengthPhrase) !== normalizePhrase(changePhrase)) {
    return `${subject} remains a material business theme, supported by ${strengthPhrase} and ${lowerFirst(changePhrase)}.`;
  }

  if (strength) {
    return `${subject} remains a material business theme, supported by ${strengthPhrase}.`;
  }

  if (concern && watch && normalizePhrase(concernPhrase) !== normalizePhrase(watchPhrase)) {
    return `${subject} requires monitoring because ${lowerFirst(concernPhrase)} and ${lowerFirst(watchPhrase)}.`;
  }

  if (concern) {
    return `${subject} requires monitoring because ${lowerFirst(concernPhrase)}.`;
  }

  if (watch) {
    return `${subject} remains on the watchlist because ${lowerFirst(watchPhrase)}.`;
  }

  return "";
}

function phrase(value: string): string {
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
    .replace(/^Topic intensified(?: this quarter)?:\s*/i, "topic intensified around ")
    .replace(/^Topic weakened this quarter:\s*/i, "topic weakened around ")
    .replace(/^Topic persisted across quarters:\s*/i, "topic persisted around ")
    .replace(/^Topic evolved this quarter:\s*/i, "topic evolved around ")
    .replace(/^New topic observed:\s*/i, "new topic emerged around ")
    .replace(/^Topic is strengthening over time:\s*/i, "topic strength increased around ")
    .replace(/^Topic is weakening over time:\s*/i, "topic weakened over time around ")
    .replace(/^Topic has persisted across filings:\s*/i, "topic persisted across filings around ")
    .replace(/^Topic is recurring across filings:\s*/i, "topic recurred across filings around ")
    .replace(/^Topic needs monitoring:\s*/i, "topic needs monitoring around ")
    .replace(/^Dormant topic observed:\s*/i, "dormant topic observed around ")
    .replace(/^Persistent topic observed:\s*/i, "persistent topic observed around ")
    .replace(/^Strengthening topic observed:\s*/i, "strengthening topic observed around ")
    .replace(/\.+$/g, "")
    .trim();
}

function chooseCategory(sourceRefs: SourceRef[]): string {
  const categories = sourceRefs.map((ref) => ref.category);
  const ranked = [
    "revenue",
    "growth",
    "competitive",
    "customer",
    "product",
    "margin",
    "dependency",
    "operational",
    "capital_allocation",
    "management_commentary",
  ];

  return ranked.find((category) => categories.includes(category)) ?? firstText(categories) ?? "operational";
}

function importanceFromScore(score: number): QuarterInsight["importance"] {
  if (score >= 12) {
    return "high";
  }

  if (score >= 4) {
    return "medium";
  }

  return "low";
}

function compareConsolidatedInsights(left: QuarterInsight, right: QuarterInsight): number {
  return importanceRank(right.importance) - importanceRank(left.importance)
    || left.semantic_anchor_key.localeCompare(right.semantic_anchor_key)
    || left.summary.localeCompare(right.summary);
}

function importanceRank(value: QuarterInsight["importance"]): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;

  return 1;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function firstText(values: string[]): string {
  return values.map((value) => value.trim()).find(Boolean) ?? "";
}

function bestObservation(values: string[]): string {
  return [...values].sort((left, right) =>
    observationRank(right) - observationRank(left)
    || left.localeCompare(right))[0] ?? "";
}

function observationRank(value: string): number {
  if (/^Revenue driver/i.test(value)) return 10;
  if (/^Opportunity/i.test(value)) return 9;
  if (/^Competitive/i.test(value)) return 8;
  if (/^Topic intensified/i.test(value)) return 7;
  if (/^Topic is strengthening|^Strengthening topic/i.test(value)) return 6;
  if (/^Topic persisted|^Topic has persisted|^Persistent topic/i.test(value)) return 5;
  if (/^Risk/i.test(value)) return 10;
  if (/^Operating dependency|^Dependency/i.test(value)) return 8;
  if (/^Topic weakened/i.test(value)) return 7;
  if (/^Topic needs monitoring|^Dormant topic/i.test(value)) return 6;

  return 1;
}

function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();

    if (trimmed && !seen.has(key)) {
      seen.add(key);
      output.push(trimmed);
    }
  }

  return output;
}
