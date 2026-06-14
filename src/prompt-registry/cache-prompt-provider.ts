import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculatePromptHash } from "./prompt-hash.js";
import type { PromptProvider, ResolvedPrompt } from "./prompt.types.js";

export type CachedPrompt = {
  prompt_id: string;
  version: string;
  content: string;
  hash: string;
  source: "cache";
};

export class PromptCacheIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptCacheIntegrityError";
  }
}

export class CachePromptProvider implements PromptProvider {
  constructor(private readonly cacheRoot = defaultPromptCacheRoot()) {}

  resolve(promptId: string, version?: string): ResolvedPrompt | null {
    const cached = this.readCachedPrompt(promptId, version);

    if (!cached) {
      return null;
    }

    const actualHash = calculatePromptHash(cached.content);

    if (cached.hash !== actualHash) {
      throw new PromptCacheIntegrityError(
        `Prompt cache hash mismatch for ${promptId}: expected ${cached.hash}, actual ${actualHash}`,
      );
    }

    return {
      promptId: cached.prompt_id,
      version: cached.version,
      content: cached.content,
      hash: cached.hash,
      source: "cache",
      activationId: null,
    };
  }

  private readCachedPrompt(promptId: string, version?: string): CachedPrompt | null {
    const activePrompts = this.readActivePrompts();
    const activePrompt = activePrompts.find((prompt) =>
      prompt.prompt_id === promptId && (!version || prompt.version === version));

    if (!activePrompt) {
      return null;
    }

    return activePrompt;
  }

  private readActivePrompts(): CachedPrompt[] {
    try {
      const parsed = JSON.parse(readFileSync(join(this.cacheRoot, "active-prompts.json"), "utf8")) as unknown;

      if (!Array.isArray(parsed)) {
        console.warn(`Prompt cache active-prompts.json is corrupt: expected an array.`);
        return [];
      }

      return parsed.filter(isCachedPrompt);
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      console.warn(`Prompt cache unavailable or corrupt: ${errorMessage(error)}`);
      return [];
    }
  }
}

export function defaultPromptCacheRoot(): string {
  return join(process.cwd(), "data", "prompt-registry-cache");
}

export function isCachedPrompt(value: unknown): value is CachedPrompt {
  return typeof value === "object"
    && value !== null
    && (value as CachedPrompt).source === "cache"
    && typeof (value as CachedPrompt).prompt_id === "string"
    && typeof (value as CachedPrompt).version === "string"
    && typeof (value as CachedPrompt).content === "string"
    && typeof (value as CachedPrompt).hash === "string";
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
