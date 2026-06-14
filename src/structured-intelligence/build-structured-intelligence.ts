import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { PartnerTopicEvolutionSource } from "../partner-domain/partner-source.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";
import {
  STRUCTURED_INTELLIGENCE_MODEL_VERSION,
  STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
} from "./structured-intelligence.constants.js";
import { calculateStructuredIntelligenceInputHash } from "./structured-intelligence.hash.js";
import type { PromptProvenance } from "../prompt-registry/prompt-provenance.types.js";
import type {
  StructuredIntelligenceLLMOutput,
  StructuredIntelligencePromptInput,
} from "./types/build-structured-intelligence.prompt.types.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceConfidence,
} from "./types/structured-intelligence.types.js";

export type StructuredIntelligenceSourceArtifacts = {
  filingMetadata: FilingMetadata;
  themes: ThemeOutput | null;
  topicAssignments: TopicAssignmentOutputV2 | null;
  quarterChanges: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};

export type StructuredIntelligenceArtifactPaths = {
  filingMetadata: string;
  themes: string;
  topicAssignments: string;
  quarterChanges: string;
  topicEvolution: string;
};

export type BuildStructuredIntelligenceInputs = {
  artifacts: StructuredIntelligenceSourceArtifacts;
  promptInput: StructuredIntelligencePromptInput;
  output: StructuredIntelligenceLLMOutput;
  paths: StructuredIntelligenceArtifactPaths;
  promptProvenance: PromptProvenance;
  generatedAt?: string;
};

export function buildStructuredIntelligence(
  inputs: BuildStructuredIntelligenceInputs,
): StructuredIntelligence {
  const confidence = calculateStructuredIntelligenceConfidence(
    inputs.output,
    calculateSourceCoverage(inputs.artifacts),
  );

  return {
    company: inputs.artifacts.filingMetadata.company,
    business_description: inputs.output.business_description,
    products: inputs.output.products,
    customers: inputs.output.customers,
    revenue_drivers: inputs.output.revenue_drivers,
    competitive_positioning: inputs.output.competitive_positioning,
    operating_model: inputs.output.operating_model,
    key_dependencies: inputs.output.key_dependencies,
    strategic_priorities: inputs.output.strategic_priorities,
    risks: inputs.output.risks,
    opportunities: inputs.output.opportunities,
    confidence,
    metadata: {
      schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
      pipeline_version: STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
      generated_at: inputs.generatedAt ?? new Date().toISOString(),
      input_hash: calculateStructuredIntelligenceInputHash(inputs.promptInput),
      prompt_provenance: inputs.promptProvenance,
    },
    lineage: {
      source_filings: [
        {
          id: inputs.artifacts.filingMetadata.accession_number,
          period: inputs.artifacts.filingMetadata.filing_date,
          type: inputs.artifacts.filingMetadata.form_type,
        },
      ],
      derived_from: artifactPaths(inputs.paths),
      model_version: STRUCTURED_INTELLIGENCE_MODEL_VERSION,
      prompt_version: inputs.promptProvenance.prompt_version,
    },
  };
}

export function calculateStructuredIntelligenceConfidence(
  output: StructuredIntelligenceLLMOutput,
  sourceCoverage: number,
): StructuredIntelligenceConfidence {
  const fieldCoverage = calculateFieldCoverage(output);
  const overall = round((fieldCoverage * 0.70) + (sourceCoverage * 0.30));

  return {
    overall,
    source_coverage: round(sourceCoverage),
  };
}

export function calculateSourceCoverage(artifacts: StructuredIntelligenceSourceArtifacts): number {
  const sources = [
    artifacts.themes,
    artifacts.topicAssignments,
    artifacts.quarterChanges,
    artifacts.topicEvolution,
  ];
  const available = sources.filter(Boolean).length;

  return sources.length === 0 ? 0 : round(available / sources.length);
}

function calculateFieldCoverage(output: StructuredIntelligenceLLMOutput): number {
  const fields = [
    output.business_description,
    output.products,
    output.customers,
    output.revenue_drivers,
    output.competitive_positioning,
    output.operating_model,
    output.key_dependencies,
    output.strategic_priorities,
    output.risks,
    output.opportunities,
  ];
  const populated = fields.filter((field) =>
    Array.isArray(field)
      ? field.length > 0
      : field.trim().length > 0,
  ).length;

  return round(populated / fields.length);
}

function artifactPaths(paths: StructuredIntelligenceArtifactPaths): string[] {
  return [
    paths.filingMetadata,
    paths.themes,
    paths.topicAssignments,
    paths.quarterChanges,
    paths.topicEvolution,
  ];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
