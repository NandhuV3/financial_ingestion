import {
  STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
} from "../structured-intelligence/structured-intelligence.constants.js";
import {
  STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT,
} from "../structured-intelligence/build-structured-intelligence.prompt.js";
import { THEME_SYSTEM_PROMPT } from "../themes/theme-input.js";
import { calculatePromptHash } from "./prompt-hash.js";
import type { PromptProvider, ResolvedPrompt } from "./prompt.types.js";

export const THEME_GENERATION_SYSTEM_PROMPT_ID = "theme-generation-system";
export const STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID = "structured-intelligence-system";

const prompts: Record<string, Omit<ResolvedPrompt, "promptId" | "source" | "hash" | "activationId">> = {
  [THEME_GENERATION_SYSTEM_PROMPT_ID]: {
    version: "theme-generation-v1",
    content: THEME_SYSTEM_PROMPT,
  },
  [STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT_ID]: {
    version: STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
    content: STRUCTURED_INTELLIGENCE_SYSTEM_PROMPT,
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
