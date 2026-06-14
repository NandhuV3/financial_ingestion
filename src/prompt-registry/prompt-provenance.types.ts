import type { PromptSource } from "./prompt-source.types.js";

export type PromptProvenance = {
  prompt_id: string;
  prompt_version: string;
  prompt_hash: string;
  prompt_source: PromptSource;
  activation_id: string | null;
};
