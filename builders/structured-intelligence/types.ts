import type { ThemesArtifactContent } from "../themes/contract.js";
import type { StructuredUnderstanding, StructuredIntelligenceStatus } from "./contract.js";

export type FilingArtifactContent = {
  filing_id: string;
  filing_type: string;
  filing_content: string;
  filing_hash: string;
  filing_period: string;
};

export type StructuredIntelligenceBuilderInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
};

export type StructuredIntelligencePromptInput = {
  company_id: string;
  period_id: string;
  filing_id: string;
  filing_type: string;
  filing_content: string;
  themes: ThemesArtifactContent["themes"];
};

export type StructuredIntelligenceLLMOutput = {
  status: StructuredIntelligenceStatus;
  understanding: StructuredUnderstanding;
};

