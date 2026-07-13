import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  PromptActivation,
  PromptPackage,
  PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";
import type {
  PromptPackageResolver as PromptFrameworkPackageResolver,
} from "../../prompt-framework/src/index.js";
import type { PromptResolutionService } from "./resolution-service.js";

export type PromptPackageRenderInput<TContext> = {
  prompt_package: PromptPackage;
  activation: PromptActivation | null;
  context: TContext;
};

export interface PromptPackageRenderer {
  render<TContext>(input: PromptPackageRenderInput<TContext>): LLMPromptPackage;
}

/**
 * Adapter consumed by Prompt Framework PromptUnit execution.
 *
 * It performs governed Prompt Package resolution and delegates prompt rendering
 * to an injected renderer. It does not execute prompts, invoke providers,
 * manage prompt lifecycle, or implement replay policy.
 */
export class PromptRegistryPromptFrameworkAdapter
  implements PromptFrameworkPackageResolver {
  constructor(
    private readonly resolutionService: PromptResolutionService,
    private readonly renderer: PromptPackageRenderer,
  ) {}

  render<TContext>(
    promptId: string,
    context: TContext,
    version?: PromptPackageVersion,
  ): LLMPromptPackage {
    const resolution = version === undefined
      ? this.resolutionService.resolvePromptPackageSync({
        prompt_id: promptId,
      })
      : this.resolutionService.resolvePromptPackageSync({
        prompt_id: promptId,
        prompt_version: version,
      });

    return this.renderer.render({
      prompt_package: resolution.prompt_package,
      activation: resolution.activation,
      context,
    });
  }
}
