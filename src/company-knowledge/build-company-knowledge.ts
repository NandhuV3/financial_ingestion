import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import type { StructuredIntelligence } from "../structured-intelligence/types/structured-intelligence.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type {
  CompanyKnowledge,
  CompanyKnowledgeCompetitivePositioning,
} from "./types/company-knowledge.types.js";

const DEFAULT_SCHEMA_VERSION = "1.0.0";
const DEFAULT_PIPELINE_VERSION = "company-knowledge-builder-v1";
const DEFAULT_MODEL_VERSION = "deterministic-v1";
const DEFAULT_PROMPT_VERSION = "none";
const DEFAULT_KNOWLEDGE_VERSION = 1;

export type BuildCompanyKnowledgeInputs = {
  structuredIntelligence: StructuredIntelligence;
  filingMetadata: FilingMetadata;
  schemaVersion?: string;
  pipelineVersion?: string;
  modelVersion?: string;
  promptVersion?: string;
  knowledgeVersion?: number;
  generatedAt?: string;
};

export function buildCompanyKnowledge(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledge {
  const si = inputs.structuredIntelligence;
  const sourceFilings = mergeSourceFilings(inputs);

  return {
    company: si.company,
    business_description: si.business_description,
    business_model: {
      value_creation: si.business_description,
      monetization: si.revenue_drivers.join("; "),
      revenue_structure: "mixed",
    },
    products: si.products,
    customers: si.customers,
    revenue_drivers: si.revenue_drivers,
    competitive_positioning: buildCompetitivePositioning(si),
    operating_model: si.operating_model,
    key_dependencies: buildKeyDependencies(si),
    strategic_priorities: si.strategic_priorities,
    risks: si.risks,
    opportunities: si.opportunities,
    confidence: {
      overall: si.confidence.overall,
      filing_depth: si.confidence.source_coverage,
      field_coverage: calculateFieldCoverage(si),
    },
    metadata: {
      schema_version: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
      pipeline_version: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
      knowledge_version: inputs.knowledgeVersion ?? DEFAULT_KNOWLEDGE_VERSION,
      generated_at: inputs.generatedAt ?? getCurrentTimestamp(),
      input_hash: calculateCompanyKnowledgeInputHash(inputs),
    },
    lineage: {
      source_filings: sourceFilings,
      derived_from: mergeDerivedFrom(),
      model_version: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
      prompt_version: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    },
  };
}

export function calculateCompanyKnowledgeInputHash(inputs: BuildCompanyKnowledgeInputs): string {
  return calculateStringHash(JSON.stringify({
    structuredIntelligence: normalizeStructuredIntelligenceForHash(inputs.structuredIntelligence),
    filingMetadata: inputs.filingMetadata,
    schemaVersion: inputs.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    pipelineVersion: inputs.pipelineVersion ?? DEFAULT_PIPELINE_VERSION,
    modelVersion: inputs.modelVersion ?? DEFAULT_MODEL_VERSION,
    promptVersion: inputs.promptVersion ?? DEFAULT_PROMPT_VERSION,
    knowledgeVersion: inputs.knowledgeVersion ?? DEFAULT_KNOWLEDGE_VERSION,
  }));
}

function buildCompetitivePositioning(
  si: StructuredIntelligence,
): CompanyKnowledgeCompetitivePositioning[] {
  return si.competitive_positioning.map((signal) => ({
    signal,
    source_type: "observed",
  }));
}

function buildKeyDependencies(
  si: StructuredIntelligence,
): CompanyKnowledge["key_dependencies"] {
  return si.key_dependencies.map((dependency) => ({
    description: dependency,
    type: "technology",
  }));
}

function calculateFieldCoverage(si: StructuredIntelligence): number {
  const fields = [
    si.business_description,
    si.products,
    si.customers,
    si.revenue_drivers,
    si.competitive_positioning,
    si.operating_model,
    si.key_dependencies,
    si.strategic_priorities,
    si.risks,
    si.opportunities,
  ];
  const populated = fields.filter((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value.trim()),
  ).length;

  return round(populated / fields.length);
}

function mergeSourceFilings(inputs: BuildCompanyKnowledgeInputs): CompanyKnowledge["lineage"]["source_filings"] {
  const filings = [
    ...inputs.structuredIntelligence.lineage.source_filings,
    {
      id: inputs.filingMetadata.accession_number,
      period: inputs.filingMetadata.filing_date,
      type: inputs.filingMetadata.form_type,
    },
  ];
  const seen = new Set<string>();
  const output: CompanyKnowledge["lineage"]["source_filings"] = [];

  for (const filing of filings) {
    const key = `${filing.id.trim()}|${filing.period.trim()}|${filing.type.trim()}`.toLowerCase();

    if (!filing.id.trim() || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push({
      id: filing.id.trim(),
      period: filing.period.trim(),
      type: filing.type.trim(),
    });
  }

  return output.sort((left, right) =>
    left.period.localeCompare(right.period)
    || left.id.localeCompare(right.id)
    || left.type.localeCompare(right.type),
  );
}

function mergeDerivedFrom(): string[] {
  return [
    "structured-intelligence",
    "filing-metadata",
  ];
}

function normalizeStructuredIntelligenceForHash(
  structuredIntelligence: StructuredIntelligence,
): StructuredIntelligence {
  return {
    ...structuredIntelligence,
    metadata: {
      ...structuredIntelligence.metadata,
      generated_at: "",
    },
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
