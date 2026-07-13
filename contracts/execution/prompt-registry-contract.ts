import type {
  PromptPackage,
  PromptPackageVersion,
  PromptReplayReference,
  PromptResolutionRequest,
  PromptResolutionResult,
} from "./prompt-registry-models.js";

/**
 * Public contract surface for the Prompt Registry.
 *
 * These interfaces define Prompt Package governance ownership only. Concrete
 * lifecycle behavior, version management, activation, replay resolution, prompt
 * rendering, and persistence are owned by later implementation packages.
 */
export const PROMPT_REGISTRY_CONTRACT_VERSION =
  "prompt-registry-v1";

/**
 * Canonical registry interface for governed Prompt Package access.
 *
 * Implementations own governance-backed lookup. Consumers must not infer active
 * versions, lifecycle state, or replay substitutions themselves.
 */
export interface PromptRegistry {
  resolve(request: PromptResolutionRequest): Promise<PromptResolutionResult>;
  resolveReplay(
    reference: PromptReplayReference,
  ): Promise<PromptResolutionResult>;
}

/**
 * Prompt Package resolver boundary consumed by Prompt Framework components.
 *
 * This interface resolves governed Prompt Packages. It does not render prompts
 * and does not execute prompts.
 */
export interface PromptResolver {
  resolvePromptPackage(
    request: PromptResolutionRequest,
  ): Promise<PromptResolutionResult>;
}

/**
 * Read-only Prompt Package lookup boundary for implementations that need exact
 * package identity access.
 */
export interface PromptPackageResolver {
  getPromptPackage(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): Promise<PromptPackage | undefined>;
}
