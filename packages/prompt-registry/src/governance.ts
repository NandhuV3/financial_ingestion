import type {
  PromptLifecycleState,
  PromptPackage,
  PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";
import { PromptActivationManager } from "./activation-manager.js";
import { PromptRegistryLifecycleError } from "./errors.js";
import { PromptPackageLifecycleManager } from "./lifecycle.js";
import type {
  PromptRegistrySnapshot,
  PromptVersionCreationRequest,
} from "./types.js";
import { validatePromptIdentity } from "./validation.js";
import { PromptVersionCatalog } from "./version-manager.js";

export class PromptRegistryGovernance {
  private readonly lifecycleManager = new PromptPackageLifecycleManager();
  private readonly catalog: PromptVersionCatalog;
  private readonly activationManager: PromptActivationManager;

  constructor(snapshot: PromptRegistrySnapshot = {
    packages: [],
    activations: [],
  }) {
    this.catalog = new PromptVersionCatalog(snapshot.packages);
    this.activationManager = new PromptActivationManager(
      this.catalog,
      snapshot.activations,
    );
  }

  createVersion(request: PromptVersionCreationRequest): {
    governance: PromptRegistryGovernance;
    prompt_package: PromptPackage;
  } {
    const result = this.catalog.createVersion(request);

    return {
      governance: this.withCatalog(result.catalog),
      prompt_package: result.prompt_package,
    };
  }

  transitionVersion(
    promptId: string,
    promptVersion: PromptPackageVersion,
    targetState: PromptLifecycleState,
  ): {
    governance: PromptRegistryGovernance;
    prompt_package: PromptPackage;
  } {
    if (targetState === "active") {
      const result = this.activateVersion(promptId, promptVersion);
      const activePackage = result.governance.activeVersion(promptId);

      if (activePackage === undefined) {
        throw new PromptRegistryLifecycleError(
          `PromptPackage '${promptId}' version '${promptVersion}' was not activated.`,
        );
      }

      return {
        governance: result.governance,
        prompt_package: activePackage,
      };
    }

    const promptPackage = this.requiredVersion(promptId, promptVersion);
    const transitionedPackage = this.lifecycleManager.transition(
      promptPackage,
      targetState,
    );
    const nextCatalog = this.catalog.replaceVersion(transitionedPackage);
    const nextSnapshot = {
      packages: nextCatalog.listPackages(),
      activations: this.snapshot().activations.filter((activation) =>
        !(activation.prompt_id === promptId
          && activation.active_prompt_version === promptVersion)
      ),
    };

    return {
      governance: new PromptRegistryGovernance(nextSnapshot),
      prompt_package: transitionedPackage,
    };
  }

  activateVersion(promptId: string, promptVersion: PromptPackageVersion): {
    governance: PromptRegistryGovernance;
    activation_id: string;
  } {
    const result = this.activationManager.activate(promptId, promptVersion);

    return {
      governance: new PromptRegistryGovernance(
        result.activation_manager.snapshot(),
      ),
      activation_id: result.activation.activation_id,
    };
  }

  getVersion(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): PromptPackage | undefined {
    return this.catalog.getVersion(promptId, promptVersion);
  }

  latestVersion(promptId: string): PromptPackage | undefined {
    validatePromptIdentity(promptId, "latest");

    return this.catalog.latestVersion(promptId);
  }

  activeVersion(promptId: string): PromptPackage | undefined {
    validatePromptIdentity(promptId, "active");

    return this.activationManager.activePackage(promptId);
  }

  snapshot(): PromptRegistrySnapshot {
    return this.activationManager.snapshot();
  }

  private requiredVersion(
    promptId: string,
    promptVersion: PromptPackageVersion,
  ): PromptPackage {
    const promptPackage = this.catalog.getVersion(promptId, promptVersion);

    if (promptPackage === undefined) {
      throw new PromptRegistryLifecycleError(
        `PromptPackage '${promptId}' version '${promptVersion}' does not exist.`,
      );
    }

    return promptPackage;
  }

  private withCatalog(catalog: PromptVersionCatalog): PromptRegistryGovernance {
    return new PromptRegistryGovernance({
      packages: catalog.listPackages(),
      activations: this.snapshot().activations,
    });
  }
}
