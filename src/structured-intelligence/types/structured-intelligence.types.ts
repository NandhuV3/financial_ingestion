import type { PromptProvenance } from "../../prompt-registry/prompt-provenance.types.js";

export type SourceFiling = {
  id: string;
  period: string;
  type: string;
};

export type StructuredIntelligenceConfidence = {
  overall: number;
  source_coverage: number;
};

export type StructuredIntelligenceMetadata = {
  schema_version: string;
  pipeline_version: string;
  generated_at: string;
  input_hash: string;
  prompt_provenance: PromptProvenance;
};

export type StructuredIntelligenceLineage = {
  source_filings: SourceFiling[];
  derived_from: string[];
  model_version: string;
  prompt_version: string;
};

export type StructuredIntelligence = {
  company: string;

  business_description: string;

  products: string[];

  customers: string[];

  revenue_drivers: string[];

  competitive_positioning: string[];

  operating_model: string[];

  key_dependencies: string[];

  strategic_priorities: string[];

  risks: string[];

  opportunities: string[];

  confidence: StructuredIntelligenceConfidence;

  metadata: StructuredIntelligenceMetadata;

  lineage: StructuredIntelligenceLineage;
};
