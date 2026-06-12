import type { PromptSource } from "./prompt-source.types.js";

export type ResolvedPrompt = {
  promptId: string;
  version: string;
  content: string;
  hash: string;
  source: PromptSource;
  activationId: string | null;
};

export interface PromptProvider {
  resolve(promptId: string, version?: string): ResolvedPrompt | null;
}
