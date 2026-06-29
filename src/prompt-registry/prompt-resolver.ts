import { CachePromptProvider } from "./cache-prompt-provider.js";
import { FilesystemPromptProvider } from "./filesystem-prompt-provider.js";
import {
  FilePromptActivationStore,
  type PromptActivationStore,
} from "./prompt-activation-store.js";
import { calculateEffectivePromptHash } from "./prompt-hash.js";
import { defaultPromptRenderers } from "./prompt-renderers.js";
import type {
  PromptProvider,
  PromptRendererRegistry,
  RenderedPrompt,
  ResolvedPrompt,
} from "./prompt.types.js";

export class PromptRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptRenderError";
  }
}

export class PromptResolver {
  private readonly providers: PromptProvider[];

  constructor(
    provider: PromptProvider | PromptProvider[] = [
      new CachePromptProvider(),
      new FilesystemPromptProvider(),
    ],
    private readonly activationStore: PromptActivationStore = new FilePromptActivationStore(),
    private readonly renderers: PromptRendererRegistry = defaultPromptRenderers(),
  ) {
    this.providers = Array.isArray(provider) ? provider : [provider];
  }

  resolve(promptId: string, version?: string): ResolvedPrompt {
    const activation = this.activationStore.getActivation(promptId);

    if (activation) {
      if (version !== undefined && activation.active_version !== version) {
        throw new Error(
          `Prompt activation ${activation.activation_id} selects ${promptId} version ${activation.active_version}, but version ${version} was requested.`,
        );
      }

      const prompt = this.resolveFromProviders(
        promptId,
        version ?? activation.active_version,
      );

      if (!prompt) {
        throw new Error(
          `Invalid prompt activation ${activation.activation_id}: prompt ${promptId} version ${activation.active_version} was not found.`,
        );
      }

      return {
        ...prompt,
        activationId: activation.activation_id,
      };
    }

    const prompt = this.resolveFromProviders(promptId, version);

    if (!prompt) {
      throw new Error(
        version === undefined
          ? `Prompt not found: ${promptId}`
          : `Prompt not found: ${promptId} version ${version}`,
      );
    }

    return prompt;
  }

  render<TContext>(
    promptId: string,
    context: TContext,
    version?: string,
  ): RenderedPrompt {
    const prompt = this.resolve(promptId, version);
    const renderer = this.renderers[promptId];

    if (!renderer) {
      throw new PromptRenderError(
        `Prompt renderer not found: ${promptId}`,
      );
    }

    const userPrompt = renderer(context);

    return {
      prompt_id: prompt.promptId,
      prompt_version: prompt.version,
      activation_id: prompt.activationId,
      system_prompt: prompt.content,
      user_prompt: userPrompt,
      render_hash: calculateEffectivePromptHash({
        systemPrompt: prompt.content,
        userPrompt,
        schemaVersion: prompt.version,
      }),
      source: prompt.source,
    };
  }

  private resolveFromProviders(promptId: string, version?: string): ResolvedPrompt | null {
    for (const provider of this.providers) {
      const prompt = provider.resolve(promptId, version);

      if (prompt) {
        return prompt;
      }
    }

    return null;
  }
}
