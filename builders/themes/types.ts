import type {
  EvidenceCatalogArtifactContent,
} from "../../contracts/artifacts/evidence-catalog-artifact-content.js";
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  ThemePromptEvidence,
} from "../../src/prompt-registry/themes-prompt.js";
import type { ThemeCategory } from "./contract.js";

export type { ThemePromptEvidence };

export type FilingType = "10-K" | "10-Q" | "Transcript";

export type ThemesBuilderInput = {
  filing_type: FilingType;
};

export type ThemeCandidate = {
  title: string;
  summary: string;
  category: ThemeCategory;
  paragraph_indexes: number[];
};

export type ThemesLLMOutput = {
  themes: ThemeCandidate[];
};

export type ThemesDependencies = {
  evidence_catalog: Artifact<EvidenceCatalogArtifactContent>;
};
