import { CachePromptProvider } from "./cache-prompt-provider.js";
import { FilesystemPromptProvider } from "./filesystem-prompt-provider.js";
import {
  FilePromptActivationStore,
  type PromptActivationStore,
} from "./prompt-activation-store.js";
import type { PromptProvider, ResolvedPrompt } from "./prompt.types.js";

export class PromptResolver {
  private readonly providers: PromptProvider[];

  constructor(
    provider: PromptProvider | PromptProvider[] = [
      new CachePromptProvider(),
      new FilesystemPromptProvider(),
    ],
    private readonly activationStore: PromptActivationStore = new FilePromptActivationStore(),
  ) {
    this.providers = Array.isArray(provider) ? provider : [provider];
  }

  resolve(promptId: string): ResolvedPrompt {
    const activation = this.activationStore.getActivation(promptId);

    if (activation) {
      const prompt = this.resolveFromProviders(promptId, activation.active_version);

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

    const prompt = this.resolveFromProviders(promptId);

    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    return prompt;
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
