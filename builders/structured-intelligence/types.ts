import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import type { StructuredUnderstanding } from "./contract.js";

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

export type StructuredIntelligenceDependencies = {
  filing: Artifact<FilingArtifactContent>;
  themes: Artifact<ThemesArtifactContent>;
};

export type StructuredPromptContext = {
  company_id: string;
  period_id: string;
  filing: {
    filing_id: string;
    filing_type: string;
    filing_content: string;
    evidence_hashes: string[];
  };
  themes: Array<{
    theme_id: string;
    title: string;
    summary: string;
    category: string;
    evidence_hashes: string[];
  }>;
};

export type StructuredIntelligencePromptOutput = {
  understanding: StructuredUnderstanding;
};
