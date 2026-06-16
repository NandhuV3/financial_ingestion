import {
  type BuilderRecommendation,
  type CandidateChange,
  type CandidateSummary,
  type CompanyKnowledgeCandidateEvaluationHooks,
  type StabilityClass,
} from "./contract.js";
import type {
  CompanyKnowledge,
  CompanyKnowledgeHistoryContent,
  ComparisonResult,
  FieldComparisonInput,
  KnowledgeFieldPath,
  StructuredIntelligenceArtifactContent,
} from "./types.js";

const COMPARISON_ENGINE_VERSION = "company-knowledge-comparison-v1";
const PROMOTION_RULES_VERSION = "company-knowledge-promotion-rules-v1";
const NO_CHANGE_SIMILARITY_THRESHOLD = 0.9;
const MINOR_UPDATE_SIMILARITY_THRESHOLD = 0.75;
const MAJOR_UPDATE_SIMILARITY_THRESHOLD = 0.5;
// Governed promotion threshold: "High Confidence" in the builder contract.
const HIGH_CONFIDENCE_THRESHOLD = 0.8;

const fieldStability: Record<KnowledgeFieldPath, StabilityClass> = {
  business_model: "stable",
  products: "stable",
  revenue_structure: "stable",
  customers: "semi_stable",
  revenue_drivers: "semi_stable",
  competitive_positioning: "semi_stable",
  strategic_priorities: "dynamic",
  management_focus: "dynamic",
  dependencies: "dynamic",
};

export function buildCandidateKnowledgeFromStructuredIntelligence(
  structuredIntelligence: StructuredIntelligenceArtifactContent,
): CompanyKnowledge {
  const period = structuredIntelligence.period_id;
  const confidence = clampConfidence(structuredIntelligence.confidence.overall);
  const understanding = structuredIntelligence.understanding;

  return {
    business_model: {
      summary: understanding.business_model.summary,
      value_creation: understanding.business_model.value_creation,
      revenue_structure: understanding.business_model.revenue_structure,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    },
    products: understanding.products.map((product) => ({
      product_name: product.product_name,
      description: product.description,
      importance: product.importance,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    customers: understanding.customers.map((customer) => ({
      customer_segment: customer.customer_segment,
      description: customer.description,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    revenue_structure: {
      summary: understanding.revenue_model.summary,
      recurring_components: [...understanding.revenue_model.recurring_components],
      transactional_components: [...understanding.revenue_model.transactional_components],
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    },
    revenue_drivers: understanding.revenue_drivers.map((driver) => ({
      driver: driver.driver,
      description: driver.explanation,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    competitive_positioning: understanding.competitive_positioning.map((positioning) => ({
      positioning: positioning.position,
      rationale: positioning.supporting_reasoning,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    strategic_priorities: understanding.strategic_priorities.map((priority) => ({
      priority: priority.priority,
      description: priority.rationale,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    management_focus: understanding.management_focus.map((focus) => ({
      focus_area: focus.focus_area,
      description: focus.explanation,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
    dependencies: understanding.dependencies.map((dependency) => ({
      dependency: dependency.dependency,
      description: dependency.explanation,
      confidence,
      supporting_periods: [period],
      last_updated_period: period,
    })),
  };
}

export function compareCompanyKnowledgeFields(
  currentKnowledge: CompanyKnowledge | null,
  candidateKnowledge: CompanyKnowledge,
  structuredIntelligence: StructuredIntelligenceArtifactContent,
  knowledgeHistory: CompanyKnowledgeHistoryContent | null = null,
): ComparisonResult[] {
  return fieldPaths().map((fieldPath) => compareField({
    field_path: fieldPath,
    stability_class: fieldStability[fieldPath],
    current_value: currentKnowledge?.[fieldPath] ?? null,
    candidate_value: candidateKnowledge[fieldPath],
    supporting_evidence: evidenceForField(structuredIntelligence, fieldPath),
    current_confidence: extractConfidence(currentKnowledge?.[fieldPath]),
    candidate_confidence: extractConfidence(candidateKnowledge[fieldPath]),
    current_supporting_periods: extractSupportingPeriods(currentKnowledge?.[fieldPath]),
    candidate_supporting_periods: extractSupportingPeriods(candidateKnowledge[fieldPath]),
    historical_supporting_periods: extractHistoricalSupportingPeriods(
      knowledgeHistory,
      fieldPath,
      candidateKnowledge[fieldPath],
    ),
  }));
}

export function compareField(input: FieldComparisonInput): ComparisonResult {
  const firstPopulation = input.current_value === null || input.current_value === undefined;
  const semanticSimilarity = firstPopulation
    ? 0
    : calculateSemanticSimilarity(input.current_value, input.candidate_value);
  const confidenceDelta = round(input.candidate_confidence - input.current_confidence);
  const candidateSupportingPeriods = [
    ...input.candidate_supporting_periods,
    ...input.historical_supporting_periods,
  ];
  const evidenceDelta = Math.max(0, uniqueCount(candidateSupportingPeriods) - uniqueCount(input.current_supporting_periods));
  const hasEvidenceAccumulation = evidenceDelta > 0 && semanticSimilarity >= NO_CHANGE_SIMILARITY_THRESHOLD;
  const classifiedChangeType = firstPopulation
    ? "new_information"
    : classifyChange(semanticSimilarity, hasEvidenceAccumulation);
  const changeType = !firstPopulation && detectContradiction(input, semanticSimilarity)
    ? "contradiction"
    : classifiedChangeType;
  const reviewRequired = input.stability_class === "stable" && !["no_change", "new_information"].includes(changeType)
    || changeType === "contradiction"
    || changeType === "major_update"
    || changeType === "moderate_update";
  const builderRecommendation = recommend(
    changeType,
    input.stability_class,
    input.candidate_confidence,
    confidenceDelta,
    evidenceDelta,
  );

  return {
    field_path: input.field_path,
    current_value: input.current_value,
    candidate_value: input.candidate_value,
    change_type: changeType,
    semantic_similarity: semanticSimilarity,
    confidence_delta: confidenceDelta,
    evidence_delta: evidenceDelta,
    builder_recommendation: reviewRequired ? "candidate_review" : builderRecommendation,
    review_required: reviewRequired,
    supporting_evidence: [...new Set(input.supporting_evidence)].sort(),
    stability_class: input.stability_class,
  };
}

export function buildCandidateSummary(changes: CandidateChange[]): CandidateSummary {
  return {
    total_fields_evaluated: changes.length,
    unchanged_fields: changes.filter((change) => change.change_type === "no_change").length,
    changed_fields: changes.filter((change) => change.change_type !== "no_change").length,
    major_changes: changes.filter((change) => change.change_type === "major_update").length,
    contradictions: changes.filter((change) => change.change_type === "contradiction").length,
    review_candidates: changes.filter((change) => change.review_required).length,
  };
}

export function buildEvaluationHooks(changes: ComparisonResult[]): CompanyKnowledgeCandidateEvaluationHooks {
  return {
    comparison_engine_version: COMPARISON_ENGINE_VERSION,
    promotion_rules_version: PROMOTION_RULES_VERSION,
    total_fields_evaluated: changes.length,
    changed_fields: changes.filter((change) => change.change_type !== "no_change").length,
    unchanged_fields: changes.filter((change) => change.change_type === "no_change").length,
    contradiction_count: changes.filter((change) => change.change_type === "contradiction").length,
    evidence_accumulation_count: changes.filter((change) => change.change_type === "evidence_accumulation").length,
    review_candidate_count: changes.filter((change) => change.review_required).length,
    recommendation_distribution: countRecommendations(changes),
    stability_class_distribution: countStabilityClasses(changes),
  };
}

export function calculateSemanticSimilarity(left: unknown, right: unknown): number {
  if (Array.isArray(left) || Array.isArray(right)) {
    return jaccardSimilarity(tokensForValue(left), tokensForValue(right));
  }

  if (isRecord(left) || isRecord(right)) {
    const leftRecord = isRecord(left) ? left : {};
    const rightRecord = isRecord(right) ? right : {};
    const keys = [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])]
      .filter((key) => !comparisonMetadataKeys.has(key))
      .sort();

    if (keys.length === 0) {
      return 1;
    }

    const total = keys.reduce((sum, key) => sum + calculateSemanticSimilarity(leftRecord[key], rightRecord[key]), 0);

    return round(total / keys.length);
  }

  return normalizedEditSimilarity(String(left ?? ""), String(right ?? ""));
}

function classifyChange(semanticSimilarity: number, hasEvidenceAccumulation: boolean): CandidateChange["change_type"] {
  if (hasEvidenceAccumulation) {
    return "evidence_accumulation";
  }

  if (semanticSimilarity > NO_CHANGE_SIMILARITY_THRESHOLD) {
    return "no_change";
  }

  if (semanticSimilarity >= MINOR_UPDATE_SIMILARITY_THRESHOLD) {
    return "minor_update";
  }

  if (semanticSimilarity >= MAJOR_UPDATE_SIMILARITY_THRESHOLD) {
    return "moderate_update";
  }

  return "major_update";
}

function detectContradiction(
  input: FieldComparisonInput,
  semanticSimilarity: number,
): boolean {
  return input.stability_class === "stable"
    && semanticSimilarity < MAJOR_UPDATE_SIMILARITY_THRESHOLD
    && input.current_confidence >= HIGH_CONFIDENCE_THRESHOLD
    && input.candidate_confidence >= HIGH_CONFIDENCE_THRESHOLD
    && input.supporting_evidence.length > 0;
}

function recommend(
  changeType: CandidateChange["change_type"],
  stabilityClass: StabilityClass,
  candidateConfidence: number,
  confidenceDelta: number,
  evidenceDelta: number,
): BuilderRecommendation {
  if (changeType === "no_change") {
    return "candidate_retain";
  }

  if (changeType === "new_information") {
    return "candidate_promote";
  }

  if (changeType === "minor_update"
    && confidenceDelta > 0
    && evidenceDelta > 0
    && candidateConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return "candidate_promote";
  }

  if (changeType === "evidence_accumulation") {
    return "candidate_promote";
  }

  if (stabilityClass !== "stable" && changeType === "minor_update") {
    return "candidate_merge";
  }

  return "candidate_review";
}

function evidenceForField(
  structuredIntelligence: StructuredIntelligenceArtifactContent,
  fieldPath: KnowledgeFieldPath,
): string[] {
  const understanding = structuredIntelligence.understanding;

  switch (fieldPath) {
    case "business_model":
      return understanding.business_model.evidence_refs;
    case "products":
      return understanding.products.flatMap((product) => product.evidence_refs);
    case "customers":
      return understanding.customers.flatMap((customer) => customer.evidence_refs);
    case "revenue_structure":
      return understanding.revenue_model.evidence_refs;
    case "revenue_drivers":
      return understanding.revenue_drivers.flatMap((driver) => driver.evidence_refs);
    case "competitive_positioning":
      return understanding.competitive_positioning.flatMap((positioning) => positioning.evidence_refs);
    case "strategic_priorities":
      return understanding.strategic_priorities.flatMap((priority) => priority.evidence_refs);
    case "management_focus":
      return understanding.management_focus.flatMap((focus) => focus.evidence_refs);
    case "dependencies":
      return understanding.dependencies.flatMap((dependency) => dependency.evidence_refs);
  }
}

function extractConfidence(value: unknown): number {
  if (Array.isArray(value)) {
    const confidences = value
      .map((item) => isRecord(item) && typeof item.confidence === "number" ? item.confidence : null)
      .filter((item): item is number => item !== null);

    return confidences.length === 0 ? 0 : round(confidences.reduce((sum, item) => sum + item, 0) / confidences.length);
  }

  if (isRecord(value) && typeof value.confidence === "number") {
    return value.confidence;
  }

  return 0;
}

function extractSupportingPeriods(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => isRecord(item) && Array.isArray(item.supporting_periods)
      ? item.supporting_periods.filter((period): period is string => typeof period === "string")
      : []);
  }

  if (isRecord(value) && Array.isArray(value.supporting_periods)) {
    return value.supporting_periods.filter((period): period is string => typeof period === "string");
  }

  return [];
}

function extractHistoricalSupportingPeriods(
  knowledgeHistory: CompanyKnowledgeHistoryContent | null,
  fieldPath: KnowledgeFieldPath,
  candidateValue: unknown,
): string[] {
  if (!knowledgeHistory) {
    return [];
  }

  return knowledgeHistory.versions.flatMap((version) => {
    const historicalValue = version.knowledge[fieldPath];
    const similarity = calculateSemanticSimilarity(historicalValue, candidateValue);

    return similarity >= NO_CHANGE_SIMILARITY_THRESHOLD
      ? extractSupportingPeriods(historicalValue)
      : [];
  });
}

function fieldPaths(): KnowledgeFieldPath[] {
  return [
    "business_model",
    "products",
    "customers",
    "revenue_structure",
    "revenue_drivers",
    "competitive_positioning",
    "strategic_priorities",
    "management_focus",
    "dependencies",
  ];
}

function normalizedEditSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);

  if (maxLength === 0) {
    return 1;
  }

  return round(1 - levenshteinDistance(normalizedLeft, normalizedRight) / maxLength);
}

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_item, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index] ?? 0;
    }
  }

  return previous[right.length] ?? 0;
}

function jaccardSimilarity(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return 1;
  }

  const intersectionSize = [...leftSet].filter((item) => rightSet.has(item)).length;

  return round(intersectionSize / union.size);
}

function tokensForValue(value: unknown): string[] {
  return normalizeText(flattenValue(value).join(" "))
    .split(" ")
    .filter(Boolean);
}

function flattenValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenValue(item));
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([key]) => !comparisonMetadataKeys.has(key))
      .flatMap(([_key, item]) => flattenValue(item));
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [String(value)];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countRecommendations(changes: ComparisonResult[]): CompanyKnowledgeCandidateEvaluationHooks["recommendation_distribution"] {
  return {
    candidate_promote: changes.filter((change) => change.builder_recommendation === "candidate_promote").length,
    candidate_merge: changes.filter((change) => change.builder_recommendation === "candidate_merge").length,
    candidate_review: changes.filter((change) => change.builder_recommendation === "candidate_review").length,
    candidate_retain: changes.filter((change) => change.builder_recommendation === "candidate_retain").length,
  };
}

function countStabilityClasses(changes: ComparisonResult[]): CompanyKnowledgeCandidateEvaluationHooks["stability_class_distribution"] {
  return {
    stable: changes.filter((change) => change.stability_class === "stable").length,
    semi_stable: changes.filter((change) => change.stability_class === "semi_stable").length,
    dynamic: changes.filter((change) => change.stability_class === "dynamic").length,
  };
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number(value.toFixed(4));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const comparisonMetadataKeys = new Set(["confidence", "supporting_periods", "last_updated_period"]);
