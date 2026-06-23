import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import type { StructuredUnderstanding } from "./contract.js";

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
    evidence_refs: string[];
  };
  themes: Array<{
    theme_id: string;
    title: string;
    summary: string;
    category: string;
    evidence_refs: string[];
  }>;
};

export type StructuredIntelligencePromptOutput = {
  understanding: StructuredUnderstanding;
};
