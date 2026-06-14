import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type {
  BusinessSignal,
  BusinessSignalArtifact,
  BusinessSignalCategory,
  BusinessSignalDirection,
  BusinessSignalMagnitude,
  BusinessSignalType,
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
  quarterChange?: QuarterChangeReport | null;
  topicEvolution?: TopicEvolutionReport | null;
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
    ...buildStringSignals("revenue_driver", "revenue", "Revenue driver observed", inputs.companyKnowledge?.revenue_drivers ?? []),
    ...buildStringSignals("customer_dependency", "customer", "Customer dependency observed", inputs.companyKnowledge?.customers ?? []),
    ...buildCompetitiveSignals(inputs.companyKnowledge),
    ...buildDependencySignals(inputs.companyKnowledge),
    ...buildStringSignals("operating_dependency", "dependency", "Operating dependency observed", inputs.companyKnowledge?.operating_model ?? []),
    ...buildQuarterChangeSignals(inputs.quarterChange),
    ...buildTopicEvolutionSignals(inputs.topicEvolution),
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
      derived_from: buildDerivedFrom(inputs),
      source_filings: buildSourceFilings(inputs),
      model_version: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
      prompt_version: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    },
  };
}

function buildStringSignals(
  signalType: BusinessSignalType,
  category: BusinessSignalCategory,
  summaryPrefix: string,
  values: string[],
): BusinessSignal[] {
  return cleanArray(values).map((value) => buildSignal({
    signalType,
    category,
    summary: `${summaryPrefix}: ${value}`,
    sourceText: value,
    evidenceSource: "company-knowledge",
  }));
}

function buildCompetitiveSignals(companyKnowledge?: CompanyKnowledge | null): BusinessSignal[] {
  return (companyKnowledge?.competitive_positioning ?? [])
    .map((positioning) => positioning.signal)
    .filter(Boolean)
    .map((signal) => buildSignal({
      signalType: "competitive_advantage",
      category: "competitive",
      summary: `Competitive signal observed: ${signal.trim()}`,
      sourceText: signal,
      evidenceSource: "company-knowledge",
    }));
}

function buildDependencySignals(companyKnowledge?: CompanyKnowledge | null): BusinessSignal[] {
  return (companyKnowledge?.key_dependencies ?? [])
    .map((dependency) => dependency.description)
    .filter(Boolean)
    .map((description) => buildSignal({
      signalType: "operating_dependency",
      category: "dependency",
      summary: `Dependency observed: ${description.trim()}`,
      sourceText: description,
      evidenceSource: "company-knowledge",
    }));
}

function buildQuarterChangeSignals(quarterChange?: QuarterChangeReport | null): BusinessSignal[] {
  return (quarterChange?.topic_changes ?? [])
    .flatMap((change) => {
      if (change.change_type === "TOPIC_NEW") {
        return [buildSignal({
          signalType: "topic_new",
          category: "growth",
          summary: `New topic observed: ${topicDisplayName(change.topic_id)}`,
          sourceText: topicChangeEvidence(change),
          evidenceSource: "quarter-change",
          direction: "emerging",
          magnitude: "medium",
          confidence: 0.75,
        })];
      }

      if (change.change_type === "TOPIC_INTENSIFIED") {
        return [buildSignal({
          signalType: "topic_intensified",
          category: "growth",
          summary: `Topic intensified: ${topicDisplayName(change.topic_id)}`,
          sourceText: topicChangeEvidence(change),
          evidenceSource: "quarter-change",
          direction: "positive",
          magnitude: "medium",
          confidence: 0.75,
        })];
      }

      if (change.change_type === "TOPIC_WEAKENED") {
        return [buildSignal({
          signalType: "topic_weakened",
          category: "operational",
          summary: `Topic weakened: ${topicDisplayName(change.topic_id)}`,
          sourceText: topicChangeEvidence(change),
          evidenceSource: "quarter-change",
          direction: "weakening",
          magnitude: "medium",
          confidence: 0.75,
        })];
      }

      return [];
    });
}

function buildTopicEvolutionSignals(topicEvolution?: TopicEvolutionReport | null): BusinessSignal[] {
  return (topicEvolution?.topics ?? [])
    .flatMap((topic) => {
      const signals: BusinessSignal[] = [];
      const sourceText = [
        topic.topic_name,
        `presence=${topic.presence_state}`,
        `trend=${topic.trend_state}`,
        `quarters_present=${topic.quarters_present}`,
        `presence_ratio=${topic.presence_ratio}`,
      ].join("; ");

      if (topic.presence_state === "persistent" && topic.current_status === "present") {
        signals.push(buildSignal({
          signalType: "persistent_topic",
          category: "growth",
          summary: `Persistent topic observed: ${topic.topic_name}`,
          sourceText,
          evidenceSource: "topic-evolution",
          direction: "neutral",
          magnitude: "low",
          confidence: 0.7,
        }));
      }

      if (topic.trend_state === "strengthening" && topic.current_status === "present") {
        signals.push(buildSignal({
          signalType: "strengthening_topic",
          category: "growth",
          summary: `Strengthening topic observed: ${topic.topic_name}`,
          sourceText,
          evidenceSource: "topic-evolution",
          direction: "positive",
          magnitude: "medium",
          confidence: 0.8,
        }));
      }

      if (topic.presence_state === "dormant") {
        signals.push(buildSignal({
          signalType: "dormant_topic",
          category: "operational",
          summary: `Dormant topic observed: ${topic.topic_name}`,
          sourceText,
          evidenceSource: "topic-evolution",
          direction: "weakening",
          magnitude: "medium",
          confidence: 0.7,
        }));
      }

      return signals;
    });
}

function buildSignal(params: {
  signalType: BusinessSignalType;
  category: BusinessSignalCategory;
  summary: string;
  sourceText: string;
  evidenceSource: string;
  direction?: BusinessSignalDirection;
  magnitude?: BusinessSignalMagnitude;
  confidence?: number;
}): BusinessSignal {
  const sourceText = params.sourceText.trim();
  const summary = params.summary.trim();
  const confidence = params.confidence ?? confidenceForType(params.signalType);
  const evidenceId = deterministicId("evidence", params.signalType, sourceText);

  return {
    signal_id: deterministicId("signal", params.signalType, sourceText),
    signal_type: params.signalType,
    category: params.category,
    summary,
    direction: params.direction ?? "neutral",
    magnitude: params.magnitude ?? "low",
    confidence,
    evidence: [
      {
        evidence_id: evidenceId,
        source: params.evidenceSource,
        description: sourceText,
      },
    ],
  };
}

function confidenceForType(signalType: BusinessSignalType): number {
  switch (signalType) {
    case "revenue_driver":
    case "competitive_advantage":
      return 0.8;
    case "customer_dependency":
    case "operating_dependency":
      return 0.75;
    case "topic_intensified":
    case "strengthening_topic":
      return 0.8;
    case "topic_new":
    case "topic_weakened":
      return 0.75;
    case "persistent_topic":
    case "dormant_topic":
      return 0.7;
    default:
      return 0.7;
  }
}

function dedupeSignals(signals: BusinessSignal[]): BusinessSignal[] {
  const output: BusinessSignal[] = [];
  const indexByKey = new Map<string, number>();

  for (const signal of signals) {
    const key = `${signal.signal_type}|${normalizeForKey(signal.summary)}`;
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
    quarterChange: normalizeQuarterChangeForHash(inputs.quarterChange ?? null),
    topicEvolution: normalizeTopicEvolutionForHash(inputs.topicEvolution ?? null),
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

function buildDerivedFrom(inputs: BuildBusinessSignalsInputs): DerivedFromArtifact[] {
  return normalizeDerivedFrom([
    ...(inputs.derivedFrom ?? []),
    ...(inputs.companyKnowledge ? [{
      path: "company-knowledge/current.json",
      version: inputs.companyKnowledge.metadata.knowledge_version,
      input_hash: inputs.companyKnowledge.metadata.input_hash,
    }] : []),
    ...(inputs.quarterChange ? [{
      path: `quarter-change/${inputs.quarterChange.current_filing.filing_date}.json`,
      version: 1,
      input_hash: calculateStringHash(JSON.stringify(normalizeQuarterChangeForHash(inputs.quarterChange))),
    }] : []),
    ...(inputs.topicEvolution ? [{
      path: "topic-evolution/current.json",
      version: 1,
      input_hash: calculateStringHash(JSON.stringify(normalizeTopicEvolutionForHash(inputs.topicEvolution))),
    }] : []),
  ]);
}

function buildSourceFilings(inputs: BuildBusinessSignalsInputs): CompanyKnowledge["lineage"]["source_filings"] {
  return normalizeSourceFilings([
    ...(inputs.companyKnowledge?.lineage.source_filings ?? []),
    ...(inputs.quarterChange?.previous_filing ? [{
      id: inputs.quarterChange.previous_filing.accession_number,
      period: inputs.quarterChange.previous_filing.filing_date,
      type: inputs.quarterChange.previous_filing.form_type,
    }] : []),
    ...(inputs.quarterChange ? [{
      id: inputs.quarterChange.current_filing.accession_number,
      period: inputs.quarterChange.current_filing.filing_date,
      type: inputs.quarterChange.current_filing.form_type,
    }] : []),
  ]);
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

function normalizeQuarterChangeForHash(quarterChange: QuarterChangeReport | null): QuarterChangeReport | null {
  return quarterChange;
}

function normalizeTopicEvolutionForHash(topicEvolution: TopicEvolutionReport | null): TopicEvolutionReport | null {
  if (!topicEvolution) {
    return null;
  }

  return {
    ...topicEvolution,
    generated_at: "",
    diagnostics: {
      ...topicEvolution.diagnostics,
      duration_ms: 0,
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

function deterministicId(prefix: string, signalType: BusinessSignalType, value: string): string {
  return `${prefix}_${calculateStringHash(`${signalType}:${normalizeForKey(value)}`).slice(0, 16)}`;
}

function normalizeForKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function topicDisplayName(topicId: string): string {
  return topicId.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

function topicChangeEvidence(change: QuarterChangeReport["topic_changes"][number]): string {
  return [
    change.topic_id,
    `previous_importance=${change.previous_importance ?? "none"}`,
    `current_importance=${change.current_importance ?? "none"}`,
    `previous_evidence_count=${change.previous_evidence_count}`,
    `current_evidence_count=${change.current_evidence_count}`,
    `previous_themes=${change.previous_theme_names.join("; ")}`,
    `current_themes=${change.current_theme_names.join("; ")}`,
  ].join("; ");
}
