import type {
  PromptActivation,
  PromptPackage,
  PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import { PromptRegistryActivationError } from "./errors.js";
import { PromptPackageLifecycleManager } from "./lifecycle.js";
import type { PromptRegistrySnapshot } from "./types.js";
import {
  clonePromptActivation,
  clonePromptPackage,
  validatePromptActivation,
  validatePromptIdentity,
  validatePromptPackage,
} from "./validation.js";
import { PromptVersionCatalog } from "./version-manager.js";

export class PromptActivationManager {
  private readonly lifecycleManager = new PromptPackageLifecycleManager();
  private readonly catalog: PromptVersionCatalog;
  private readonly activations: readonly PromptActivation[];

  constructor(
    catalog: PromptVersionCatalog,
    activations: readonly PromptActivation[] = [],
  ) {
    this.catalog = catalog;
    this.activations = sortActivations(activations.map((activation) => {
      validatePromptActivation(activation);
      return clonePromptActivation(activation);
    }));

    validateActiveVersionUniqueness(this.activations);
    validateActivePackages(this.catalog, this.activations);
  }

  activate(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): {
    catalog: PromptVersionCatalog;
    activation_manager: PromptActivationManager;
    activation: PromptActivation;
  } {
    validatePromptIdentity(promptId, promptVersion);

    const targetPackage = this.catalog.getVersion(promptId, promptVersion);
    if (targetPackage === undefined) {
      throw new PromptRegistryActivationError(
        `PromptPackage '${promptId}' version '${promptVersion}' does not exist.`,
      );
    }

    const currentActivation = this.getActivation(promptId);
    if (currentActivation?.active_prompt_version === promptVersion) {
      return {
        catalog: this.catalog,
        activation_manager: this,
        activation: currentActivation,
      };
    }

    if (targetPackage.lifecycle_state !== "approved") {
      throw new PromptRegistryActivationError(
        `PromptPackage '${promptId}' version '${promptVersion}' must be approved before activation.`,
      );
    }

    let nextCatalog = this.catalog.replaceVersion(
      this.lifecycleManager.transition(targetPackage, "active"),
    );

    if (currentActivation !== undefined) {
      const previouslyActivePackage = nextCatalog.getVersion(
        promptId,
        currentActivation.active_prompt_version,
      );

      if (previouslyActivePackage !== undefined) {
        nextCatalog = nextCatalog.replaceVersion(
          this.lifecycleManager.transition(previouslyActivePackage, "deprecated"),
        );
      }
    }

    const activation: PromptActivation = {
      prompt_id: promptId,
      active_prompt_version: promptVersion,
      activation_id: deterministicActivationId(promptId, promptVersion),
    };
    const nextActivations = [
      ...this.activations.filter((candidate) => candidate.prompt_id !== promptId),
      activation,
    ];
    const activationManager = new PromptActivationManager(
      nextCatalog,
      nextActivations,
    );

    return {
      catalog: nextCatalog,
      activation_manager: activationManager,
      activation: clonePromptActivation(activation),
    };
  }

  getActivation(promptId: string): PromptActivation | undefined {
    validatePromptIdentity(promptId, "active");

    const activation = this.activations.find((candidate) =>
      candidate.prompt_id === promptId
    );

    return activation === undefined
      ? undefined
      : clonePromptActivation(activation);
  }

  activePackage(promptId: string): PromptPackage | undefined {
    const activation = this.getActivation(promptId);
    if (activation === undefined) {
      return undefined;
    }

    const promptPackage = this.catalog.getVersion(
      promptId,
      activation.active_prompt_version,
    );

    return promptPackage === undefined
      ? undefined
      : clonePromptPackage(promptPackage);
  }

  snapshot(): PromptRegistrySnapshot {
    return {
      packages: this.catalog.listPackages(),
      activations: this.activations.map(clonePromptActivation),
    };
  }
}

function deterministicActivationId(
  promptId: string,
  promptVersion: PromptPackageVersion,
): string {
  return `prompt-activation:${stableHash({
    prompt_id: promptId,
    active_prompt_version: promptVersion,
  })}`;
}

function validateActiveVersionUniqueness(
  activations: readonly PromptActivation[],
): void {
  const promptIds = new Set<string>();

  for (const activation of activations) {
    if (promptIds.has(activation.prompt_id)) {
      throw new PromptRegistryActivationError(
        `PromptPackage '${activation.prompt_id}' has more than one active version.`,
      );
    }

    promptIds.add(activation.prompt_id);
  }
}

function validateActivePackages(
  catalog: PromptVersionCatalog,
  activations: readonly PromptActivation[],
): void {
  for (const activation of activations) {
    const promptPackage = catalog.getVersion(
      activation.prompt_id,
      activation.active_prompt_version,
    );

    if (promptPackage === undefined) {
      throw new PromptRegistryActivationError(
        `Prompt activation '${activation.activation_id}' references missing PromptPackage '${activation.prompt_id}' version '${activation.active_prompt_version}'.`,
      );
    }

    validatePromptPackage(promptPackage);

    if (promptPackage.lifecycle_state !== "active") {
      throw new PromptRegistryActivationError(
        `Prompt activation '${activation.activation_id}' references a PromptPackage that is not active.`,
      );
    }
  }
}

function sortActivations(
  activations: readonly PromptActivation[],
): readonly PromptActivation[] {
  return [...activations].sort((left, right) =>
    left.prompt_id.localeCompare(right.prompt_id)
      || left.active_prompt_version.localeCompare(right.active_prompt_version)
      || left.activation_id.localeCompare(right.activation_id)
  );
}
