import type {
  PromptActivation,
  PromptPackage,
  PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";

export type PromptPackageDefinition = Omit<
  PromptPackage,
  "identity" | "lifecycle_state" | "version_lineage"
>;

export type PromptVersionCreationRequest = {
  prompt_id: string;
  prompt_version: PromptPackageVersion;
  change_reason: string;
  package_definition: PromptPackageDefinition;
};

export type PromptRegistrySnapshot = {
  packages: readonly PromptPackage[];
  activations: readonly PromptActivation[];
};
