import type {
  ThemeInputBoundaryContent,
} from "../../contracts/execution/theme-input-boundary-content.js";
import type {
  ThemePromptEvidence,
} from "../../src/prompt-registry/themes-prompt.js";
import type { ThemeCategory } from "./contract.js";

export type { ThemePromptEvidence };

export type FilingType = "10-K" | "10-Q" | "Transcript";

export type ThemesBuilderInput = {
  theme_input_boundary?: ThemeInputBoundaryContent;
  filing_type?: FilingType;
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
