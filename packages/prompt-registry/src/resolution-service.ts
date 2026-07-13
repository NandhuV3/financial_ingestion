import type {
  PromptActivation,
  PromptPackage,
  PromptPackageVersion,
  PromptReplayReference,
  PromptResolutionRequest,
  PromptResolutionResult,
} from "../../../contracts/execution/prompt-registry-models.js";
import type {
  PromptPackageResolver,
  PromptRegistry,
  PromptResolver,
} from "../../../contracts/execution/prompt-registry-contract.js";
import { PromptRegistryResolutionError } from "./errors.js";
import type { PromptRegistrySnapshot } from "./types.js";
import {
  clonePromptActivation,
  clonePromptPackage,
  validatePromptIdentity,
} from "./validation.js";
import { PromptVersionCatalog } from "./version-manager.js";

/**
 * Deterministic Prompt Package resolution service.
 *
 * This service resolves governed Prompt Packages only. It does not implement
 * lifecycle transitions, version creation, prompt rendering, replay policy,
 * execution, or persistence.
 */
export class PromptResolutionService
  implements PromptRegistry, PromptResolver, PromptPackageResolver {
  private readonly catalog: PromptVersionCatalog;
  private readonly activationsByPromptId: ReadonlyMap<string, PromptActivation>;

  constructor(snapshot: PromptRegistrySnapshot) {
    this.catalog = new PromptVersionCatalog(snapshot.packages);
    this.activationsByPromptId = activationMap(snapshot);
  }

  async resolve(
    request: PromptResolutionRequest,
  ): Promise<PromptResolutionResult> {
    return this.resolveSync(request);
  }

  async resolvePromptPackage(
    request: PromptResolutionRequest,
  ): Promise<PromptResolutionResult> {
    return this.resolvePromptPackageSync(request);
  }

  resolveSync(
    request: PromptResolutionRequest,
  ): PromptResolutionResult {
    return this.resolvePromptPackageSync(request);
  }

  resolvePromptPackageSync(
    request: PromptResolutionRequest,
  ): PromptResolutionResult {
    validatePromptIdentity(request.prompt_id, request.prompt_version ?? "active");

    return request.prompt_version === undefined
      ? this.resolveActive(request.prompt_id)
      : this.resolveByIdentity(request.prompt_id, request.prompt_version);
  }

  async resolveReplay(
    reference: PromptReplayReference,
  ): Promise<PromptResolutionResult> {
    return this.resolveReplaySync(reference);
  }

  resolveReplaySync(
    reference: PromptReplayReference,
  ): PromptResolutionResult {
    validatePromptIdentity(reference.prompt_id, reference.prompt_version);

    const resolved = this.resolveByIdentity(
      reference.prompt_id,
      reference.prompt_version,
    );

    if (resolved.prompt_package.content_hash !== reference.content_hash) {
      throw new PromptRegistryResolutionError(
        `Replay PromptPackage '${reference.prompt_id}' version '${reference.prompt_version}' content_hash does not match the replay reference.`,
      );
    }

    return {
      ...resolved,
      replay_reference: {
        prompt_id: reference.prompt_id,
        prompt_version: reference.prompt_version,
        activation_id: reference.activation_id,
        content_hash: reference.content_hash,
      },
    };
  }

  async getPromptPackage(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): Promise<PromptPackage | undefined> {
    return this.catalog.getVersion(promptId, promptVersion);
  }

  resolveVersionLineage(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): readonly PromptPackage[] {
    const lineage: PromptPackage[] = [];
    let currentVersion: PromptPackageVersion | null = promptVersion;

    while (currentVersion !== null) {
      const promptPackage = this.catalog.getVersion(promptId, currentVersion);

      if (promptPackage === undefined) {
        throw new PromptRegistryResolutionError(
          `PromptPackage '${promptId}' version '${currentVersion}' could not be resolved for lineage.`,
        );
      }

      lineage.push(promptPackage);
      currentVersion = promptPackage.version_lineage.previous_prompt_version;
    }

    return lineage.reverse().map(clonePromptPackage);
  }

  private resolveActive(promptId: string): PromptResolutionResult {
    const activation = this.activationsByPromptId.get(promptId);

    if (activation === undefined) {
      throw new PromptRegistryResolutionError(
        `No active PromptPackage exists for '${promptId}'.`,
      );
    }

    const result = this.resolveByIdentity(
      promptId,
      activation.active_prompt_version,
    );

    if (result.prompt_package.lifecycle_state !== "active") {
      throw new PromptRegistryResolutionError(
        `Active PromptPackage '${promptId}' version '${activation.active_prompt_version}' is not in active lifecycle state.`,
      );
    }

    return result;
  }

  private resolveByIdentity(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): PromptResolutionResult {
    const promptPackage = this.catalog.getVersion(promptId, promptVersion);

    if (promptPackage === undefined) {
      throw new PromptRegistryResolutionError(
        `PromptPackage '${promptId}' version '${promptVersion}' could not be resolved.`,
      );
    }

    const activation = this.activeActivation(promptId, promptVersion);

    return {
      prompt_package: clonePromptPackage(promptPackage),
      activation,
      replay_reference: {
        prompt_id: promptPackage.identity.prompt_id,
        prompt_version: promptPackage.identity.prompt_version,
        activation_id: activation?.activation_id ?? null,
        content_hash: promptPackage.content_hash,
      },
    };
  }

  private activeActivation(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ) {
    const activation = this.activationsByPromptId.get(promptId);

    if (activation?.active_prompt_version !== promptVersion) {
      return null;
    }

    return clonePromptActivation(activation);
  }
}

function activationMap(
  snapshot: PromptRegistrySnapshot,
): ReadonlyMap<string, PromptActivation> {
  const map = new Map<string, PromptActivation>();

  for (const activation of snapshot.activations) {
    if (map.has(activation.prompt_id)) {
      throw new PromptRegistryResolutionError(
        `PromptPackage '${activation.prompt_id}' has more than one active version.`,
      );
    }

    map.set(activation.prompt_id, clonePromptActivation(activation));
  }

  return map;
}
