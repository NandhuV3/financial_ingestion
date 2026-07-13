import type {
  ReplayDecision,
  ReplayRequest,
  ReplayResult,
  ReplayValidationResult,
} from "./llm-replay-policy-models.js";

/**
 * Public contract surface for the LLM Replay Policy.
 *
 * These interfaces define replay policy ownership only. Concrete replay
 * decision logic, validation behavior, replay execution, regeneration,
 * provider invocation, Prompt Registry integration, and artifact persistence
 * are owned by later implementation packages or adjacent Platform Foundation
 * frameworks.
 */
export const LLM_REPLAY_POLICY_CONTRACT_VERSION =
  "llm-replay-policy-v1";

/**
 * Canonical replay policy entry point consumed by LLM-native layers.
 */
export interface ReplayPolicy {
  evaluate(request: ReplayRequest): Promise<ReplayDecision>;
}

/**
 * Deterministic replay decision boundary.
 *
 * Implementations choose between replay, regeneration, or failure according to
 * locked policy rules. This contract does not implement those rules.
 */
export interface ReplayDecisionEngine {
  decide(request: ReplayRequest): Promise<ReplayDecision>;
}

/**
 * Replay request validation boundary.
 *
 * Validation is policy-level only. Business validation and artifact resolution
 * remain outside this contract.
 */
export interface ReplayRequestValidator {
  validate(request: ReplayRequest): ReplayValidationResult;
}

/**
 * Replay result projection boundary for later implementations.
 *
 * This extension point models result creation only. It does not execute replay
 * or regeneration.
 */
export interface ReplayResultFactory {
  createResult(decision: ReplayDecision): ReplayResult;
}
