import type { PromptSource } from "./prompt-source.types.js";

export type ResolvedPrompt = {
  promptId: string;
  version: string;
  content: string;
  hash: string;
  source: PromptSource;
  activationId: string | null;
};

export type RenderedPrompt = {
  prompt_id: string;
  prompt_version: string;
  activation_id: string | null;
  system_prompt: string;
  user_prompt: string;
  render_hash: string;
  source: PromptSource;
};

export type PromptRenderer<TContext = unknown> = (context: TContext) => string;

export type PromptRendererRegistry = Record<string, PromptRenderer>;

export interface PromptProvider {
  resolve(promptId: string, version?: string): ResolvedPrompt | null;
}
