import type { PromptProvenance } from "../../prompt-registry/prompt-provenance.types.js";

export type StructuredIntelligenceGenerationStatus = "generated" | "failed";

export type StructuredIntelligenceGenerationReport = {
  status: StructuredIntelligenceGenerationStatus;
  duration_ms: number;
  source_coverage: number;
  input_hash: string;
  model_version: string;
  prompt_version: string;
  prompt_provenance: PromptProvenance;
  generated_at: string;
  validation_passed: boolean;
  field_coverage: number;
  empty_fields: string[];
  populated_fields: string[];
};
