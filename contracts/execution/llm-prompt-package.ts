import type { PromptSource } from "../../src/prompt-registry/prompt-source.types.js";

export const LLM_PROMPT_PACKAGE_CONTRACT_VERSION =
  "llm-prompt-package-v1";

export type LLMPromptPackage = {
  prompt_id: string;
  prompt_version: string;
  activation_id: string | null;
  system_prompt: string;
  user_prompt: string;
  render_hash: string;
  source: PromptSource;
};
