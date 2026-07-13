import type { PromptSource } from "../../src/prompt-registry/prompt-source.types.js";

/**
 * Canonical governance domain models for the Prompt Registry.
 *
 * These models describe governed Prompt Packages only. They do not implement
 * lifecycle behavior, version management, active resolution, replay resolution,
 * prompt execution, or business validation.
 */
export const PROMPT_REGISTRY_MODELS_CONTRACT_VERSION =
  "prompt-registry-models-v1";

export const PROMPT_LIFECYCLE_STATES = [
  "draft",
  "review",
  "approved",
  "active",
  "deprecated",
  "retired",
] as const;

export type PromptLifecycleState = typeof PROMPT_LIFECYCLE_STATES[number];

export type PromptPackageVersion = string;

/**
 * Deterministic identity for one immutable Prompt Package version.
 */
export interface PromptPackageIdentity {
  prompt_id: string;
  prompt_version: PromptPackageVersion;
}

/**
 * Immutable version lineage for a Prompt Package.
 *
 * This records prompt-version provenance only. It does not authorize lifecycle
 * transitions or perform version management.
 */
export interface PromptVersionLineage {
  previous_prompt_version: PromptPackageVersion | null;
  change_reason: string;
}

/**
 * Governed Prompt Package definition.
 *
 * Prompt Packages are registry-owned governance assets. They are not execution
 * records and are not business artifacts.
 */
export interface PromptPackage {
  identity: PromptPackageIdentity;
  lifecycle_state: PromptLifecycleState;
  system_prompt_template: string;
  user_prompt_template_id: string;
  expected_output_schema_id: string;
  source: PromptSource;
  content_hash: string;
  version_lineage: PromptVersionLineage;
}

/**
 * Active Prompt Package selection for a prompt identifier.
 *
 * Activation records governance state only. It does not implement activation
 * behavior or lifecycle enforcement.
 */
export interface PromptActivation {
  prompt_id: string;
  active_prompt_version: PromptPackageVersion;
  activation_id: string;
}

/**
 * Request for Prompt Package resolution.
 *
 * Omitted prompt_version means active-version resolution by an implementation.
 * This model does not implement that resolution behavior.
 */
export interface PromptResolutionRequest {
  prompt_id: string;
  prompt_version?: PromptPackageVersion;
}

/**
 * Exact historical prompt reference required for replay.
 */
export interface PromptReplayReference {
  prompt_id: string;
  prompt_version: PromptPackageVersion;
  activation_id: string | null;
  content_hash: string;
}

/**
 * Result of governed Prompt Package resolution.
 */
export interface PromptResolutionResult {
  prompt_package: PromptPackage;
  activation: PromptActivation | null;
  replay_reference: PromptReplayReference;
}
