import { CachePromptProvider } from "./cache-prompt-provider.js";
import { FilesystemPromptProvider } from "./filesystem-prompt-provider.js";
import type { PromptActivation } from "./prompt-activation.types.js";
import {
  ACTIVATION_MIN_SCORE,
  MAX_ALLOWED_REGRESSION,
} from "./activation-policy.js";
import {
  FilePromptEvaluationStore,
  type PromptEvaluationStore,
} from "./prompt-evaluation-store.js";
import type { PromptProvider } from "./prompt.types.js";

export class PromptActivationGate {
  private readonly providers: PromptProvider[];

  constructor(
    private readonly evaluationStore: PromptEvaluationStore,
    providers: PromptProvider | PromptProvider[],
  ) {
    this.providers = Array.isArray(providers) ? providers : [providers];
  }

  static fromCacheRoot(cacheRoot: string): PromptActivationGate {
    return new PromptActivationGate(
      new FilePromptEvaluationStore(cacheRoot),
      [
        new CachePromptProvider(cacheRoot),
        new FilesystemPromptProvider(),
      ],
    );
  }

  validateActivation(activation: PromptActivation): void {
    if (!this.promptVersionExists(activation.prompt_id, activation.active_version)) {
      throw new Error(
        `Prompt activation ${activation.activation_id} is invalid: prompt ${activation.prompt_id} version ${activation.active_version} does not exist.`,
      );
    }

    const evaluation = this.evaluationStore.getEvaluation(activation.prompt_id, activation.active_version);

    if (!evaluation) {
      throw new Error(
        `Prompt activation ${activation.activation_id} denied: evaluation is missing for ${activation.prompt_id} ${activation.active_version}.`,
      );
    }

    if (!evaluation.passed) {
      throw new Error(`Prompt activation ${activation.activation_id} denied: evaluation did not pass.`);
    }

    if (evaluation.failures.length > 0) {
      throw new Error(`Prompt activation ${activation.activation_id} denied: evaluation has failures.`);
    }

    if (evaluation.overall_score < ACTIVATION_MIN_SCORE) {
      throw new Error(
        `Prompt activation ${activation.activation_id} denied: score ${evaluation.overall_score} is below minimum ${ACTIVATION_MIN_SCORE}.`,
      );
    }

    if (evaluation.compared_against) {
      const baseline = this.evaluationStore.getEvaluation(activation.prompt_id, evaluation.compared_against);

      if (!baseline) {
        throw new Error(
          `Prompt activation ${activation.activation_id} denied: comparison evaluation is missing for ${evaluation.compared_against}.`,
        );
      }

      const regression = baseline.overall_score - evaluation.overall_score;

      if (regression > MAX_ALLOWED_REGRESSION) {
        throw new Error(
          `Prompt activation ${activation.activation_id} denied: score regression ${round(regression)} exceeds maximum ${MAX_ALLOWED_REGRESSION}.`,
        );
      }
    }
  }

  private promptVersionExists(promptId: string, version: string): boolean {
    return this.providers.some((provider) => provider.resolve(promptId, version) !== null);
  }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
