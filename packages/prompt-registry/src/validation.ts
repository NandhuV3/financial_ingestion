import {
  PROMPT_LIFECYCLE_STATES,
  type PromptActivation,
  type PromptLifecycleState,
  type PromptPackage,
  type PromptPackageVersion,
} from "../../../contracts/execution/prompt-registry-models.js";
import { PromptRegistryValidationError } from "./errors.js";

export function validatePromptPackage(promptPackage: PromptPackage): void {
  requireObject(promptPackage, "PromptPackage");
  requireText(promptPackage.identity?.prompt_id, "PromptPackage.identity.prompt_id");
  requireText(
    promptPackage.identity?.prompt_version,
    "PromptPackage.identity.prompt_version",
  );
  validateLifecycleState(promptPackage.lifecycle_state);
  requireText(
    promptPackage.system_prompt_template,
    "PromptPackage.system_prompt_template",
  );
  requireText(
    promptPackage.user_prompt_template_id,
    "PromptPackage.user_prompt_template_id",
  );
  requireText(
    promptPackage.expected_output_schema_id,
    "PromptPackage.expected_output_schema_id",
  );
  requireText(promptPackage.source, "PromptPackage.source");
  requireText(promptPackage.content_hash, "PromptPackage.content_hash");
  requireObject(promptPackage.version_lineage, "PromptPackage.version_lineage");
  if (
    promptPackage.version_lineage.previous_prompt_version !== null
      && !isNonEmptyText(promptPackage.version_lineage.previous_prompt_version)
  ) {
    throw new PromptRegistryValidationError(
      "PromptPackage.version_lineage.previous_prompt_version must be null or non-empty text.",
    );
  }
  requireText(
    promptPackage.version_lineage.change_reason,
    "PromptPackage.version_lineage.change_reason",
  );
}

export function validatePromptActivation(activation: PromptActivation): void {
  requireObject(activation, "PromptActivation");
  requireText(activation.prompt_id, "PromptActivation.prompt_id");
  requireText(
    activation.active_prompt_version,
    "PromptActivation.active_prompt_version",
  );
  requireText(activation.activation_id, "PromptActivation.activation_id");
}

export function validateLifecycleState(
  lifecycleState: PromptLifecycleState,
): void {
  if (!PROMPT_LIFECYCLE_STATES.includes(lifecycleState)) {
    throw new PromptRegistryValidationError(
      `PromptPackage lifecycle_state '${lifecycleState}' is invalid.`,
    );
  }
}

export function validatePromptIdentity(
  promptId: string,
  promptVersion: PromptPackageVersion,
): void {
  requireText(promptId, "prompt_id");
  requireText(promptVersion, "prompt_version");
}

export function clonePromptPackage(promptPackage: PromptPackage): PromptPackage {
  return {
    identity: {
      prompt_id: promptPackage.identity.prompt_id,
      prompt_version: promptPackage.identity.prompt_version,
    },
    lifecycle_state: promptPackage.lifecycle_state,
    system_prompt_template: promptPackage.system_prompt_template,
    user_prompt_template_id: promptPackage.user_prompt_template_id,
    expected_output_schema_id: promptPackage.expected_output_schema_id,
    source: promptPackage.source,
    content_hash: promptPackage.content_hash,
    version_lineage: {
      previous_prompt_version:
        promptPackage.version_lineage.previous_prompt_version,
      change_reason: promptPackage.version_lineage.change_reason,
    },
  };
}

export function clonePromptActivation(
  activation: PromptActivation,
): PromptActivation {
  return {
    prompt_id: activation.prompt_id,
    active_prompt_version: activation.active_prompt_version,
    activation_id: activation.activation_id,
  };
}

function requireObject(value: unknown, fieldName: string): void {
  if (typeof value !== "object" || value === null) {
    throw new PromptRegistryValidationError(`${fieldName} must be an object.`);
  }
}

function requireText(value: unknown, fieldName: string): void {
  if (!isNonEmptyText(value)) {
    throw new PromptRegistryValidationError(`${fieldName} is required.`);
  }
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
