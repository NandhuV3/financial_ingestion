import type { BusinessSignalArtifact } from "../business-signal-intelligence/types/business-signal.types.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
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

  if (signalAgreement === "corroborating" && sourceReliability === "high") {
    return 0.9;
  }

  if (signalAgreement === "corroborating" && sourceReliability === "medium") {
    return 0.75;
  }

  if (signalAgreement === "conflicting") {
    return 0.45;
  }

  return 0.6;
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
    ...(inputs.businessSignalArtifact?.lineage.derived_from ?? []),
  ]);
}

function businessSignalArtifactRef(artifact: BusinessSignalArtifact): DerivedFromArtifact {
  return {
    path: `business-signals/${artifact.period}/current.json`,
    version: artifact.metadata.signal_version,
    input_hash: artifact.metadata.input_hash,
  };
}

function buildSourceFilings(inputs: BuildQuarterUnderstandingInputs): SourceFilingReference[] {
  return normalizeSourceFilings([
    ...(inputs.companyKnowledge?.lineage.source_filings ?? []),
    ...(inputs.businessSignalArtifact?.lineage.source_filings ?? []),
  ]);
}

function calculateQuarterUnderstandingInputHash(inputs: BuildQuarterUnderstandingInputs): string {
  return calculateStringHash(JSON.stringify({
    companyKnowledge: normalizeCompanyKnowledgeForHash(inputs.companyKnowledge ?? null),
    businessSignalArtifact: normalizeBusinessSignalArtifactForHash(inputs.businessSignalArtifact ?? null),
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
