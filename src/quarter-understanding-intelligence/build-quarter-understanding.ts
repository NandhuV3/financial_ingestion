import type { BusinessSignalArtifact } from "../business-signal-intelligence/types/business-signal.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";
import {
  buildDeterministicQuarterInsights,
  type QuarterInsight,
} from "./build-deterministic-quarter-understanding.js";
import { buildQuarterUnderstandingConcepts } from "./build-quarter-understanding-concepts.js";
import { consolidateQuarterConcepts } from "./consolidate-quarter-understandings.js";
import type {
  BusinessKey,
  CompanyKnowledgeAlignment,
  DerivedFromArtifact,
  QuarterUnderstanding,
  QuarterUnderstandingArtifact,
  SignalAgreement,
  SourceFilingReference,
  UnderstandingCategory,
  UnderstandingImportance,
} from "./types/quarter-understanding.types.js";

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_PIPELINE_VERSION = "quarter-understanding-builder-v1";
const DEFAULT_MODEL_VERSION = "deterministic-builder-v1";
const DEFAULT_PROMPT_VERSION = "none";
const DEFAULT_UNDERSTANDING_VERSION = 1;

export type LLMReasoningOutput = {
  reasoning_schema_version: string;
  understandings: Array<{
    category: string;
    semantic_anchor_key: string;
    summary: string;
    importance: string;
    signal_agreement: string;
    company_knowledge_alignment: string;
    supporting_signal_ids: string[];
  }>;
};

export type BuildQuarterUnderstandingInputs = {
  companyKnowledge?: CompanyKnowledge | null;
  businessSignalArtifact?: BusinessSignalArtifact | null;
  quarterChange?: QuarterChangeReport | null;
  topicEvolution?: TopicEvolutionReport | null;
  reasoningOutput?: LLMReasoningOutput | null;
  reportingPeriod: string;
  derivedFrom?: DerivedFromArtifact[];
  schemaVersion?: string;
  pipelineVersion?: string;
  modelVersion?: string;
  promptVersion?: string;
  understandingVersion?: number;
  generatedAt?: string;
};

export function buildQuarterUnderstanding(
  inputs: BuildQuarterUnderstandingInputs,
): QuarterUnderstandingArtifact {
  const company = firstText([
    inputs.companyKnowledge?.company,
    inputs.businessSignalArtifact?.company,
  ]);
  const period = inputs.reportingPeriod.trim();
  const derivedFrom = buildDerivedFrom(inputs);
  const understandings = buildUnderstandings(inputs, company, period, derivedFrom);

  return {
    company,
    period,
    understandings,
    metadata: {
      schema_version: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
      pipeline_version: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
      model_version: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
      prompt_version: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
      generated_at: inputs.generatedAt ?? getCurrentTimestamp(),
      understanding_version: inputs.understandingVersion ?? DEFAULT_UNDERSTANDING_VERSION,
      input_hash: calculateQuarterUnderstandingInputHash(inputs),
    },
    lineage: {
      derived_from: derivedFrom,
      source_filings: buildSourceFilings(inputs),
    },
  };
}

function buildUnderstandings(
  inputs: BuildQuarterUnderstandingInputs,
  company: string,
  reportingPeriod: string,
  derivedFrom: DerivedFromArtifact[],
): QuarterUnderstanding[] {
  if (hasDeterministicSources(inputs)) {
    return buildDeterministicUnderstandings(inputs, company, reportingPeriod, derivedFrom);
  }

  return buildLegacyReasoningUnderstandings(inputs, company, reportingPeriod, derivedFrom);
}

function buildDeterministicUnderstandings(
  inputs: BuildQuarterUnderstandingInputs,
  company: string,
  reportingPeriod: string,
  derivedFrom: DerivedFromArtifact[],
): QuarterUnderstanding[] {
  const signalArtifactRef = findArtifactRef(derivedFrom, "business-signal");
  const companyKnowledgeRef = findArtifactRef(derivedFrom, "company-knowledge");
  const rawInsights = buildDeterministicQuarterInsights({
    companyKnowledge: inputs.companyKnowledge,
    businessSignalArtifact: inputs.businessSignalArtifact,
    quarterChange: inputs.quarterChange,
    topicEvolution: inputs.topicEvolution,
  });
  const concepts = buildQuarterUnderstandingConcepts(rawInsights);
  const insights = consolidateQuarterConcepts(concepts);
  const sourceCounts = countInsightSources(inputs, insights);
  const understandings: QuarterUnderstanding[] = [];
  const seenAnchors = new Set<string>();

  for (const insight of insights) {
    const category = normalizeCategory(insight.category);
    const semanticAnchorKey = normalizeSemanticAnchor(insight.semantic_anchor_key);
    const summary = insight.summary.trim();

    if (!category || !semanticAnchorKey || !summary || seenAnchors.has(semanticAnchorKey)) {
      continue;
    }

    const sourceCount = sourceCounts.get(semanticAnchorKey) ?? 1;
    const signalAgreement = signalAgreementForInsight(insight, sourceCount);
    const businessKey = buildBusinessKey(company, category, semanticAnchorKey);
    const resolvedSignals = resolveSignalsForInsight(inputs.businessSignalArtifact, insight);
    const signalRefs = resolvedSignals.map((signal) => ({
      signal_id: signal.signal_id,
      period: inputs.businessSignalArtifact?.period ?? reportingPeriod,
      artifact_path: signalArtifactRef?.path ?? "",
      input_hash: inputs.businessSignalArtifact?.metadata.input_hash ?? signalArtifactRef?.input_hash ?? "",
    }));

    seenAnchors.add(semanticAnchorKey);
    understandings.push({
      understanding_id: buildUnderstandingId(businessKey, reportingPeriod),
      semantic_anchor_key: semanticAnchorKey,
      business_key: businessKey,
      category,
      summary,
      importance: insight.importance,
      confidence: {
        score: calculateConfidenceScore(signalAgreement, sourceCount),
        evidence_count: sourceCount,
        source_reliability: sourceReliabilityForEvidenceCount(sourceCount),
        signal_agreement: signalAgreement,
        company_knowledge_alignment: "consistent",
      },
      evidence: {
        signal_refs: signalRefs,
        company_knowledge_ref: companyKnowledgeRef
          ? {
              artifact_path: companyKnowledgeRef.path,
              version: companyKnowledgeRef.version,
              input_hash: companyKnowledgeRef.input_hash,
            }
          : null,
        evidence_context: evidenceContextForInsight(insight, resolvedSignals, summary),
      },
    });
  }

  return understandings.sort(compareUnderstandings);
}

function buildLegacyReasoningUnderstandings(
  inputs: BuildQuarterUnderstandingInputs,
  company: string,
  reportingPeriod: string,
  derivedFrom: DerivedFromArtifact[],
): QuarterUnderstanding[] {
  const signalById = new Map((inputs.businessSignalArtifact?.signals ?? [])
    .map((signal) => [signal.signal_id, signal]));
  const signalArtifactRef = findArtifactRef(derivedFrom, "business-signal");
  const companyKnowledgeRef = findArtifactRef(derivedFrom, "company-knowledge");
  const candidates = inputs.reasoningOutput?.understandings ?? [];
  const understandings: QuarterUnderstanding[] = [];
  const seenAnchors = new Set<string>();

  for (const candidate of candidates) {
    const category = normalizeCategory(candidate.category);
    const importance = normalizeImportance(candidate.importance);
    const signalAgreement = normalizeSignalAgreement(candidate.signal_agreement);
    const companyKnowledgeAlignment = normalizeCompanyKnowledgeAlignment(candidate.company_knowledge_alignment);
    const semanticAnchorKey = normalizeSemanticAnchor(candidate.semantic_anchor_key);
    const summary = candidate.summary.trim();

    if (!category || !importance || !signalAgreement || !companyKnowledgeAlignment || !semanticAnchorKey || !summary) {
      continue;
    }

    if (seenAnchors.has(semanticAnchorKey)) {
      continue;
    }

    const resolvedSignals = dedupeStrings(candidate.supporting_signal_ids ?? [])
      .map((signalId) => signalById.get(signalId))
      .filter((signal): signal is NonNullable<typeof signal> => Boolean(signal));

    if (resolvedSignals.length === 0) {
      continue;
    }

    const businessKey = buildBusinessKey(company, category, semanticAnchorKey);
    const signalRefs = resolvedSignals.map((signal) => ({
      signal_id: signal.signal_id,
      period: inputs.businessSignalArtifact?.period ?? reportingPeriod,
      artifact_path: signalArtifactRef?.path ?? "",
      input_hash: inputs.businessSignalArtifact?.metadata.input_hash ?? signalArtifactRef?.input_hash ?? "",
    }));

    seenAnchors.add(semanticAnchorKey);
    understandings.push({
      understanding_id: buildUnderstandingId(businessKey, reportingPeriod),
      semantic_anchor_key: semanticAnchorKey,
      business_key: businessKey,
      category,
      summary,
      importance,
      confidence: {
        score: calculateConfidenceScore(signalAgreement, resolvedSignals.length),
        evidence_count: resolvedSignals.length,
        source_reliability: sourceReliabilityForEvidenceCount(resolvedSignals.length),
        signal_agreement: signalAgreement,
        company_knowledge_alignment: companyKnowledgeAlignment,
      },
      evidence: {
        signal_refs: signalRefs,
        company_knowledge_ref: companyKnowledgeRef
          ? {
              artifact_path: companyKnowledgeRef.path,
              version: companyKnowledgeRef.version,
              input_hash: companyKnowledgeRef.input_hash,
            }
          : null,
        evidence_context: resolvedSignals.map((signal) => signal.summary).join(" "),
      },
    });
  }

  return understandings.sort(compareUnderstandings);
}

function buildBusinessKey(
  company: string,
  category: UnderstandingCategory,
  topic: string,
): BusinessKey {
  return {
    company,
    category,
    topic,
  };
}

function buildUnderstandingId(businessKey: BusinessKey, reportingPeriod: string): string {
  return `understanding_${calculateStringHash(JSON.stringify({
    semantic_anchor_key: businessKey.topic,
    category: businessKey.category,
    reportingPeriod,
  })).slice(0, 16)}`;
}

function calculateConfidenceScore(signalAgreement: SignalAgreement, evidenceCount: number): number {
  const sourceReliability = sourceReliabilityForEvidenceCount(evidenceCount);

  if (signalAgreement === "conflicting") {
    return 0.45;
  }

  if (signalAgreement === "mixed") {
    return 0.6;
  }

  if (signalAgreement === "corroborating" && sourceReliability === "high") {
    return 0.9;
  }

  if (signalAgreement === "corroborating" && sourceReliability === "medium") {
    return 0.75;
  }

  return 0.5;
}

function sourceReliabilityForEvidenceCount(evidenceCount: number): "high" | "medium" | "low" {
  if (evidenceCount >= 3) {
    return "high";
  }

  if (evidenceCount === 2) {
    return "medium";
  }

  return "low";
}

function buildDerivedFrom(inputs: BuildQuarterUnderstandingInputs): DerivedFromArtifact[] {
  return normalizeDerivedFrom([
    ...(inputs.derivedFrom ?? []),
    ...(inputs.businessSignalArtifact ? [businessSignalArtifactRef(inputs.businessSignalArtifact)] : []),
    ...(inputs.companyKnowledge ? [companyKnowledgeArtifactRef(inputs.companyKnowledge)] : []),
    ...(inputs.quarterChange ? [quarterChangeArtifactRef(inputs.quarterChange)] : []),
    ...(inputs.topicEvolution ? [topicEvolutionArtifactRef(inputs.topicEvolution)] : []),
    ...(inputs.businessSignalArtifact?.lineage.derived_from ?? []),
  ]);
}

function companyKnowledgeArtifactRef(artifact: CompanyKnowledge): DerivedFromArtifact {
  return {
    path: "company-knowledge/current.json",
    version: artifact.metadata.knowledge_version,
    input_hash: artifact.metadata.input_hash,
  };
}

function businessSignalArtifactRef(artifact: BusinessSignalArtifact): DerivedFromArtifact {
  return {
    path: `business-signals/${artifact.period}/current.json`,
    version: artifact.metadata.signal_version,
    input_hash: artifact.metadata.input_hash,
  };
}

function quarterChangeArtifactRef(artifact: QuarterChangeReport): DerivedFromArtifact {
  return {
    path: `comparison/${artifact.current_filing.filing_date}/quarter-change-report.json`,
    version: 1,
    input_hash: calculateStringHash(JSON.stringify(normalizeQuarterChangeForHash(artifact))),
  };
}

function topicEvolutionArtifactRef(artifact: TopicEvolutionReport): DerivedFromArtifact {
  return {
    path: "reports/topic-evolution-report.json",
    version: 1,
    input_hash: calculateStringHash(JSON.stringify(normalizeTopicEvolutionForHash(artifact))),
  };
}

function buildSourceFilings(inputs: BuildQuarterUnderstandingInputs): SourceFilingReference[] {
  return normalizeSourceFilings([
    ...(inputs.companyKnowledge?.lineage.source_filings ?? []),
    ...(inputs.businessSignalArtifact?.lineage.source_filings ?? []),
    ...(inputs.quarterChange ? [filingMetadataToSourceFiling(inputs.quarterChange.current_filing)] : []),
    ...(inputs.quarterChange?.previous_filing ? [filingMetadataToSourceFiling(inputs.quarterChange.previous_filing)] : []),
  ]);
}

function filingMetadataToSourceFiling(filing: QuarterChangeReport["current_filing"]): SourceFilingReference {
  return {
    id: filing.accession_number,
    period: filing.filing_date,
    type: filing.form_type,
  };
}

function calculateQuarterUnderstandingInputHash(inputs: BuildQuarterUnderstandingInputs): string {
  return calculateStringHash(JSON.stringify({
    companyKnowledge: normalizeCompanyKnowledgeForHash(inputs.companyKnowledge ?? null),
    businessSignalArtifact: normalizeBusinessSignalArtifactForHash(inputs.businessSignalArtifact ?? null),
    quarterChange: normalizeQuarterChangeForHash(inputs.quarterChange ?? null),
    topicEvolution: normalizeTopicEvolutionForHash(inputs.topicEvolution ?? null),
    reasoningOutput: normalizeReasoningOutputForHash(inputs.reasoningOutput ?? null),
    reportingPeriod: inputs.reportingPeriod.trim(),
    derivedFrom: normalizeDerivedFrom(inputs.derivedFrom ?? []),
    schemaVersion: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    pipelineVersion: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
    modelVersion: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
    promptVersion: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    understandingVersion: inputs.understandingVersion ?? DEFAULT_UNDERSTANDING_VERSION,
  }));
}

function normalizeQuarterChangeForHash(report: QuarterChangeReport | null): QuarterChangeReport | null {
  return report;
}

function normalizeTopicEvolutionForHash(report: TopicEvolutionReport | null): TopicEvolutionReport | null {
  if (!report) {
    return null;
  }

  return {
    ...report,
    generated_at: "",
  };
}

function hasDeterministicSources(inputs: BuildQuarterUnderstandingInputs): boolean {
  return Boolean(
    (!inputs.reasoningOutput && inputs.companyKnowledge)
    || inputs.businessSignalArtifact?.signals.some((signal) => "signal_type" in signal)
    || inputs.quarterChange
    || inputs.topicEvolution,
  );
}

function resolveSignalsForInsight(
  artifact: BusinessSignalArtifact | null | undefined,
  insight: QuarterInsight,
): BusinessSignalArtifact["signals"] {
  const normalizedAnchors = [
    insight.semantic_anchor_key,
    ...(insight.source_anchor_keys ?? []),
  ].map(normalizeSemanticAnchor).filter(Boolean);
  const normalizedSummaries = [
    insight.summary,
    ...(insight.source_summaries ?? []),
  ].map(normalizeSemanticAnchor).filter(Boolean);

  return (artifact?.signals ?? []).filter((signal) => {
    const signalText = normalizeSemanticAnchor(`${signal.signal_type} ${signal.category} ${signal.summary}`);

    return normalizedAnchors.some((anchor) =>
      signalText.includes(anchor)
      || anchor.includes(normalizeSemanticAnchor(signal.summary).slice(0, 40)))
      || normalizedSummaries.some((summary) =>
        signalText.includes(summary)
        || summary.includes(normalizeSemanticAnchor(signal.summary).slice(0, 40)));
  });
}

function evidenceContextForInsight(
  insight: QuarterInsight,
  resolvedSignals: BusinessSignalArtifact["signals"],
  fallback: string,
): string {
  if (insight.source_summaries && insight.source_summaries.length > 0) {
    return dedupeStrings(insight.source_summaries).join(" ");
  }

  if (resolvedSignals.length > 0) {
    return resolvedSignals.map((signal) => signal.summary).join(" ");
  }

  return fallback;
}

function countInsightSources(
  inputs: BuildQuarterUnderstandingInputs,
  insights: QuarterInsight[],
): Map<string, number> {
  const sourceKindsByAnchor = new Map<string, Set<string>>();

  for (const insight of insights) {
    const anchor = normalizeSemanticAnchor(insight.semantic_anchor_key);
    const sourceKinds = sourceKindsByAnchor.get(anchor) ?? new Set<string>();

    for (const sourceKind of insight.source_kinds ?? []) {
      if (sourceKind.trim()) {
        sourceKinds.add(sourceKind.trim());
      }
    }

    if (insight.summary.includes("Business Signal") || matchesBusinessSignal(inputs.businessSignalArtifact, insight)) {
      sourceKinds.add("business-signals");
    }

    if (matchesQuarterChange(inputs.quarterChange, insight)) {
      sourceKinds.add("quarter-change");
    }

    if (matchesTopicEvolution(inputs.topicEvolution, insight)) {
      sourceKinds.add("topic-evolution");
    }

    if (matchesCompanyKnowledge(inputs.companyKnowledge, insight)) {
      sourceKinds.add("company-knowledge");
    }

    if (sourceKinds.size === 0) {
      sourceKinds.add("deterministic-source");
    }

    sourceKindsByAnchor.set(anchor, sourceKinds);
  }

  return new Map([...sourceKindsByAnchor.entries()].map(([anchor, sources]) => [anchor, sources.size]));
}

function matchesBusinessSignal(
  artifact: BusinessSignalArtifact | null | undefined,
  insight: QuarterInsight,
): boolean {
  const anchors = [insight.semantic_anchor_key, ...(insight.source_anchor_keys ?? [])]
    .map(normalizeSemanticAnchor)
    .filter(Boolean);

  return (artifact?.signals ?? []).some((signal) =>
    anchors.some((anchor) =>
      normalizeSemanticAnchor(signal.summary).includes(anchor)
      || anchor.includes(normalizeSemanticAnchor(signal.summary).slice(0, 40))),
  );
}

function matchesQuarterChange(
  report: QuarterChangeReport | null | undefined,
  insight: QuarterInsight,
): boolean {
  const anchor = normalizeSemanticAnchor(insight.semantic_anchor_key);
  const anchors = [anchor, ...(insight.source_anchor_keys ?? []).map(normalizeSemanticAnchor)];

  return [
    ...(report?.topic_changes ?? []).map((change) => change.topic_id),
    ...(report?.changes ?? []).map((change) => change.category),
  ].some((value) => anchors.includes(normalizeSemanticAnchor(value)));
}

function matchesTopicEvolution(
  report: TopicEvolutionReport | null | undefined,
  insight: QuarterInsight,
): boolean {
  const anchor = normalizeSemanticAnchor(insight.semantic_anchor_key);
  const anchors = [anchor, ...(insight.source_anchor_keys ?? []).map(normalizeSemanticAnchor)];

  return (report?.topics ?? []).some((topic) => anchors.includes(normalizeSemanticAnchor(topic.topic_id)));
}

function matchesCompanyKnowledge(
  companyKnowledge: CompanyKnowledge | null | undefined,
  insight: QuarterInsight,
): boolean {
  const anchor = normalizeSemanticAnchor(insight.semantic_anchor_key);
  const anchors = [anchor, ...(insight.source_anchor_keys ?? []).map(normalizeSemanticAnchor)];
  const values = [
    ...(companyKnowledge?.revenue_drivers ?? []),
    ...(companyKnowledge?.competitive_positioning ?? []).map((value) => value.signal),
    ...(companyKnowledge?.opportunities ?? []),
    ...(companyKnowledge?.risks ?? []),
    ...(companyKnowledge?.key_dependencies ?? []).map((value) => value.description),
  ];

  return values.some((value) => anchors.includes(normalizeSemanticAnchor(value)));
}

function signalAgreementForInsight(insight: QuarterInsight, sourceCount: number): SignalAgreement {
  if (insight.signal_agreement) {
    return insight.signal_agreement;
  }

  if (insight.insight_type === "concern") {
    return "conflicting";
  }

  if (insight.insight_type === "watchlist" && sourceCount > 1) {
    return "mixed";
  }

  return "corroborating";
}

function normalizeCompanyKnowledgeForHash(companyKnowledge: CompanyKnowledge | null): CompanyKnowledge | null {
  if (!companyKnowledge) {
    return null;
  }

  return {
    ...companyKnowledge,
    metadata: {
      ...companyKnowledge.metadata,
      generated_at: "",
    },
    lineage: {
      ...companyKnowledge.lineage,
      source_filings: normalizeSourceFilings(companyKnowledge.lineage.source_filings),
      derived_from: dedupeStrings(companyKnowledge.lineage.derived_from).sort((left, right) => left.localeCompare(right)),
    },
  };
}

function normalizeBusinessSignalArtifactForHash(
  artifact: BusinessSignalArtifact | null,
): BusinessSignalArtifact | null {
  if (!artifact) {
    return null;
  }

  return {
    ...artifact,
    metadata: {
      ...artifact.metadata,
      generated_at: "",
    },
    lineage: {
      ...artifact.lineage,
      derived_from: normalizeDerivedFrom(artifact.lineage.derived_from),
      source_filings: normalizeSourceFilings(artifact.lineage.source_filings),
    },
  };
}

function normalizeReasoningOutputForHash(reasoningOutput: LLMReasoningOutput | null): LLMReasoningOutput | null {
  if (!reasoningOutput) {
    return null;
  }

  return {
    reasoning_schema_version: reasoningOutput.reasoning_schema_version,
    understandings: reasoningOutput.understandings.map((understanding) => ({
      ...understanding,
      supporting_signal_ids: dedupeStrings(understanding.supporting_signal_ids ?? [])
        .sort((left, right) => left.localeCompare(right)),
    })),
  };
}

function normalizeDerivedFrom(values: DerivedFromArtifact[]): DerivedFromArtifact[] {
  const seen = new Set<string>();
  const output: DerivedFromArtifact[] = [];

  for (const value of values) {
    const normalized = {
      path: value.path.trim(),
      version: value.version,
      input_hash: value.input_hash.trim(),
    };
    const key = `${normalized.path}|${normalized.version}|${normalized.input_hash}`.toLowerCase();

    if (!normalized.path || !normalized.input_hash || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }

  return output.sort((left, right) =>
    left.path.localeCompare(right.path)
    || left.version - right.version
    || left.input_hash.localeCompare(right.input_hash));
}

function normalizeSourceFilings(values: SourceFilingReference[]): SourceFilingReference[] {
  const seen = new Set<string>();
  const output: SourceFilingReference[] = [];

  for (const value of values) {
    const normalized = {
      id: value.id.trim(),
      period: value.period.trim(),
      type: value.type.trim(),
    };
    const key = `${normalized.id}|${normalized.period}|${normalized.type}`.toLowerCase();

    if (!normalized.id || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }

  return output.sort((left, right) =>
    left.period.localeCompare(right.period)
    || left.id.localeCompare(right.id)
    || left.type.localeCompare(right.type));
}

function findArtifactRef(values: DerivedFromArtifact[], pattern: string): DerivedFromArtifact | null {
  return values.find((value) => value.path.toLowerCase().includes(pattern)) ?? null;
}

function normalizeCategory(value: string): UnderstandingCategory | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const allowed: UnderstandingCategory[] = [
    "revenue",
    "growth",
    "margin",
    "customer",
    "product",
    "competitive",
    "dependency",
    "operational",
    "capital_allocation",
    "management_commentary",
  ];

  return allowed.includes(normalized as UnderstandingCategory)
    ? normalized as UnderstandingCategory
    : null;
}

function normalizeImportance(value: string): UnderstandingImportance | null {
  const normalized = value.trim().toLowerCase();

  return ["low", "medium", "high"].includes(normalized)
    ? normalized as UnderstandingImportance
    : null;
}

function normalizeSignalAgreement(value: string): SignalAgreement | null {
  const normalized = value.trim().toLowerCase();

  return ["corroborating", "mixed", "conflicting"].includes(normalized)
    ? normalized as SignalAgreement
    : null;
}

function normalizeCompanyKnowledgeAlignment(value: string): CompanyKnowledgeAlignment | null {
  const normalized = value.trim().toLowerCase();

  return ["consistent", "inconsistent", "not_applicable"].includes(normalized)
    ? normalized as CompanyKnowledgeAlignment
    : null;
}

function normalizeSemanticAnchor(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function compareUnderstandings(left: QuarterUnderstanding, right: QuarterUnderstanding): number {
  return importanceRank(right.importance) - importanceRank(left.importance)
    || left.semantic_anchor_key.localeCompare(right.semantic_anchor_key);
}

function importanceRank(value: UnderstandingImportance): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;

  return 1;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function firstText(values: Array<string | undefined | null>): string {
  return values.map((value) => value?.trim() ?? "").find(Boolean) ?? "";
}
