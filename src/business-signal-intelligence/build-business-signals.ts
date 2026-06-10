import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type {
  BusinessSignal,
  BusinessSignalArtifact,
  BusinessSignalCategory,
} from "./types/business-signal.types.js";

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_PIPELINE_VERSION = "business-signal-builder-v1";
const DEFAULT_MODEL_VERSION = "deterministic-v1";
const DEFAULT_PROMPT_VERSION = "none";
const DEFAULT_SIGNAL_VERSION = 1;

type DerivedFromArtifact = {
  path: string;
  version: number;
  input_hash: string;
};

export type BuildBusinessSignalsInputs = {
  companyKnowledge?: CompanyKnowledge | null;
  filingMetadata?: FilingMetadata | null;
  reportingPeriod?: string;
  derivedFrom?: DerivedFromArtifact[];
  schemaVersion?: string;
  pipelineVersion?: string;
  modelVersion?: string;
  promptVersion?: string;
  signalVersion?: number;
  generatedAt?: string;
};

export function buildBusinessSignals(
  inputs: BuildBusinessSignalsInputs,
): BusinessSignalArtifact {
  const company = firstText([
    inputs.companyKnowledge?.company,
    inputs.filingMetadata?.company,
  ]);
  const period = inputs.reportingPeriod?.trim() ?? "";
  const signals = dedupeSignals([
    ...buildStringSignals("revenue", "Revenue driver observed", inputs.companyKnowledge?.revenue_drivers ?? []),
    ...buildCompetitiveSignals(inputs.companyKnowledge),
    ...buildDependencySignals(inputs.companyKnowledge),
    ...buildStringSignals("operational", "Operational signal observed", inputs.companyKnowledge?.operating_model ?? []),
    ...buildStringSignals("product", "Product signal observed", inputs.companyKnowledge?.products ?? []),
    ...buildStringSignals("customer", "Customer signal observed", inputs.companyKnowledge?.customers ?? []),
  ]);

  return {
    company,
    period,
    signals,
    metadata: {
      schema_version: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
      pipeline_version: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
      signal_version: inputs.signalVersion ?? DEFAULT_SIGNAL_VERSION,
      generated_at: inputs.generatedAt ?? getCurrentTimestamp(),
      input_hash: calculateBusinessSignalInputHash(inputs),
    },
    lineage: {
      derived_from: normalizeDerivedFrom(inputs.derivedFrom ?? []),
      source_filings: normalizeSourceFilings(inputs.companyKnowledge?.lineage.source_filings ?? []),
      model_version: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
      prompt_version: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    },
  };
}

function buildStringSignals(
  category: BusinessSignalCategory,
  summaryPrefix: string,
  values: string[],
): BusinessSignal[] {
  return cleanArray(values).map((value) => buildSignal({
    category,
    summary: `${summaryPrefix}: ${value}`,
    sourceText: value,
  }));
}

function buildCompetitiveSignals(companyKnowledge?: CompanyKnowledge | null): BusinessSignal[] {
  return (companyKnowledge?.competitive_positioning ?? [])
    .map((positioning) => positioning.signal)
    .filter(Boolean)
    .map((signal) => buildSignal({
      category: "competitive",
      summary: `Competitive signal observed: ${signal.trim()}`,
      sourceText: signal,
    }));
}

function buildDependencySignals(companyKnowledge?: CompanyKnowledge | null): BusinessSignal[] {
  return (companyKnowledge?.key_dependencies ?? [])
    .map((dependency) => dependency.description)
    .filter(Boolean)
    .map((description) => buildSignal({
      category: "dependency",
      summary: `Dependency observed: ${description.trim()}`,
      sourceText: description,
    }));
}

function buildSignal(params: {
  category: BusinessSignalCategory;
  summary: string;
  sourceText: string;
}): BusinessSignal {
  const sourceText = params.sourceText.trim();
  const summary = params.summary.trim();
  const confidence = confidenceForCategory(params.category);
  const evidenceId = deterministicId("evidence", params.category, sourceText);

  return {
    signal_id: deterministicId("signal", params.category, sourceText),
    category: params.category,
    summary,
    direction: "neutral",
    magnitude: "low",
    confidence,
    evidence: [
      {
        evidence_id: evidenceId,
        source: "company-knowledge",
        description: sourceText,
      },
    ],
  };
}

function confidenceForCategory(category: BusinessSignalCategory): number {
  switch (category) {
    case "revenue":
    case "competitive":
      return 0.8;
    case "dependency":
    case "operational":
      return 0.75;
    case "product":
    case "customer":
      return 0.7;
    default:
      return 0.7;
  }
}

function dedupeSignals(signals: BusinessSignal[]): BusinessSignal[] {
  const output: BusinessSignal[] = [];
  const indexByKey = new Map<string, number>();

  for (const signal of signals) {
    const key = `${signal.category}|${normalizeForKey(signal.summary)}`;
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, output.length);
      output.push({
        ...signal,
        evidence: dedupeEvidence(signal.evidence),
      });
      continue;
    }

    const existing = output[existingIndex];

    if (!existing) {
      continue;
    }

    output[existingIndex] = {
      ...existing,
      evidence: dedupeEvidence([...existing.evidence, ...signal.evidence]),
    };
  }

  return output;
}

function dedupeEvidence(evidence: BusinessSignal["evidence"]): BusinessSignal["evidence"] {
  const seen = new Set<string>();
  const output: BusinessSignal["evidence"] = [];

  for (const item of evidence) {
    const key = normalizeForKey(item.evidence_id);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function calculateBusinessSignalInputHash(inputs: BuildBusinessSignalsInputs): string {
  return calculateStringHash(JSON.stringify({
    companyKnowledge: normalizeCompanyKnowledgeForHash(inputs.companyKnowledge ?? null),
    filingMetadata: inputs.filingMetadata ?? null,
    reportingPeriod: inputs.reportingPeriod?.trim() ?? "",
    derivedFrom: normalizeDerivedFrom(inputs.derivedFrom ?? []),
    schemaVersion: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    pipelineVersion: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
    modelVersion: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
    promptVersion: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    signalVersion: inputs.signalVersion ?? DEFAULT_SIGNAL_VERSION,
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
      derived_from: cleanArray(companyKnowledge.lineage.derived_from).sort((left, right) => left.localeCompare(right)),
    },
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

function normalizeSourceFilings(
  values: CompanyKnowledge["lineage"]["source_filings"],
): CompanyKnowledge["lineage"]["source_filings"] {
  const seen = new Set<string>();
  const output: CompanyKnowledge["lineage"]["source_filings"] = [];

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

function cleanArray(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const cleaned = value.trim();
    const key = normalizeForKey(cleaned);

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

function deterministicId(prefix: string, category: BusinessSignalCategory, value: string): string {
  return `${prefix}_${calculateStringHash(`${category}:${normalizeForKey(value)}`).slice(0, 16)}`;
}

function normalizeForKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
