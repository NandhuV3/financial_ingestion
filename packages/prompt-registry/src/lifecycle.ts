import type {
  PromptLifecycleState,
  PromptPackage,
} from "../../../contracts/execution/prompt-registry-models.js";
import { PromptRegistryLifecycleError } from "./errors.js";
import {
  clonePromptPackage,
  validateLifecycleState,
  validatePromptPackage,
} from "./validation.js";

const VALID_LIFECYCLE_TRANSITIONS: ReadonlyMap<
  PromptLifecycleState,
  readonly PromptLifecycleState[]
> = new Map([
  ["draft", ["review"]],
  ["review", ["approved"]],
  ["approved", ["active"]],
  ["active", ["deprecated"]],
  ["deprecated", ["retired"]],
  ["retired", []],
]);

export class PromptPackageLifecycleManager {
  transition(
    promptPackage: PromptPackage,
    targetState: PromptLifecycleState,
  ): PromptPackage {
    validatePromptPackage(promptPackage);
    validateLifecycleState(targetState);

    const allowedTargetStates =
      VALID_LIFECYCLE_TRANSITIONS.get(promptPackage.lifecycle_state) ?? [];

    if (!allowedTargetStates.includes(targetState)) {
      throw new PromptRegistryLifecycleError(
        `Invalid PromptPackage lifecycle transition from '${promptPackage.lifecycle_state}' to '${targetState}'.`,
      );
    }

    return {
      ...clonePromptPackage(promptPackage),
      lifecycle_state: targetState,
    };
  }

  canTransition(
    currentState: PromptLifecycleState,
    targetState: PromptLifecycleState,
  ): boolean {
    validateLifecycleState(currentState);
    validateLifecycleState(targetState);

    return (
      VALID_LIFECYCLE_TRANSITIONS.get(currentState) ?? []
    ).includes(targetState);
  }
}
