import {
  STRUCTURED_INTELLIGENCE_PROMPT_ID as STRUCTURED_INTELLIGENCE_BUILDER_PROMPT_ID,
  STRUCTURED_INTELLIGENCE_PROMPT_VERSION as STRUCTURED_INTELLIGENCE_BUILDER_PROMPT_VERSION,
} from "../../builders/structured-intelligence/contract.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_SYSTEM_PROMPT,
} from "./structured-intelligence-prompt.js";
import {
  INVESTOR_Q1_PROMPT_ID,
  INVESTOR_Q2_PROMPT_ID,
  INVESTOR_Q3_PROMPT_ID,
  INVESTOR_Q4_PROMPT_ID,
  INVESTOR_Q5_PROMPT_ID,
} from "../../builders/investor-intelligence-builder/contract.js";
import {
  INVESTOR_Q1_SYSTEM_PROMPT,
  INVESTOR_Q2_SYSTEM_PROMPT,
  INVESTOR_Q3_SYSTEM_PROMPT,
  INVESTOR_Q4_SYSTEM_PROMPT,
  INVESTOR_Q5_SYSTEM_PROMPT,
} from "./investor-intelligence-prompts.js";
import {
  QUARTER_UNDERSTANDING_PROMPT_ID,
} from "../../builders/quarter-understanding-builder/contract.js";
import {
  QUARTER_UNDERSTANDING_SYSTEM_PROMPT,
} from "./quarter-understanding-prompt.js";
import {
  THEMES_PROMPT_ID,
  THEMES_PROMPT_VERSION,
  THEMES_SYSTEM_PROMPT,
} from "./themes-prompt.js";
import { calculatePromptHash } from "./prompt-hash.js";
import type { PromptProvider, ResolvedPrompt } from "./prompt.types.js";

export const THEME_GENERATION_SYSTEM_PROMPT_ID = THEMES_PROMPT_ID;

const prompts: Record<string, Omit<ResolvedPrompt, "promptId" | "source" | "hash" | "activationId">> = {
  [THEME_GENERATION_SYSTEM_PROMPT_ID]: {
    version: THEMES_PROMPT_VERSION,
    content: THEMES_SYSTEM_PROMPT,
  },
  [STRUCTURED_INTELLIGENCE_BUILDER_PROMPT_ID]: {
    version: STRUCTURED_INTELLIGENCE_BUILDER_PROMPT_VERSION,
    content: STRUCTURED_INTELLIGENCE_BUILDER_SYSTEM_PROMPT,
  },
  [QUARTER_UNDERSTANDING_PROMPT_ID]: {
    version: "quarter-understanding-v1",
    content: QUARTER_UNDERSTANDING_SYSTEM_PROMPT,
  },
  [INVESTOR_Q1_PROMPT_ID]: {
    version: "investor-q1-v1",
    content: INVESTOR_Q1_SYSTEM_PROMPT,
  },
  [INVESTOR_Q2_PROMPT_ID]: {
    version: "investor-q2-v1",
    content: INVESTOR_Q2_SYSTEM_PROMPT,
  },
  [INVESTOR_Q3_PROMPT_ID]: {
    version: "investor-q3-v1",
    content: INVESTOR_Q3_SYSTEM_PROMPT,
  },
  [INVESTOR_Q4_PROMPT_ID]: {
    version: "investor-q4-v1",
    content: INVESTOR_Q4_SYSTEM_PROMPT,
  },
  [INVESTOR_Q5_PROMPT_ID]: {
    version: "investor-q5-v1",
    content: INVESTOR_Q5_SYSTEM_PROMPT,
  },
};

export function listFilesystemPrompts(): ResolvedPrompt[] {
  const provider = new FilesystemPromptProvider();

  return Object.keys(prompts)
    .sort()
    .map((promptId) => provider.resolve(promptId))
    .filter((prompt): prompt is ResolvedPrompt => prompt !== null);
}

export class FilesystemPromptProvider implements PromptProvider {
  resolve(promptId: string, version?: string): ResolvedPrompt | null {
    const prompt = prompts[promptId];

    if (!prompt || (version && prompt.version !== version)) {
      return null;
    }

    return {
      promptId,
      version: prompt.version,
      content: prompt.content,
      hash: calculatePromptHash(prompt.content),
      source: "filesystem",
      activationId: null,
    };
  }
}
