import type {
  DependencyReference,
} from "../artifacts/artifact-lineage.js";
import type {
  LLMExecutionRecord,
  LLMExecutionRecordModel,
  LLMExecutionRecordProvider,
} from "./llm-execution-record.js";
import type {
  PromptReplayReference,
} from "./prompt-registry-models.js";

/**
 * Canonical replay domain models for the LLM Replay Policy.
 *
 * These models describe policy-owned replay decisions only. They do not
 * implement decision logic, validation behavior, replay execution,
 * regeneration behavior, provider invocation, Prompt Registry integration, or
 * artifact persistence.
 */
export const LLM_REPLAY_POLICY_MODELS_CONTRACT_VERSION =
  "llm-replay-policy-models-v1";

export const REPLAY_MODES = [
  "REPLAY",
  "REGENERATION",
] as const;

export type ReplayMode = typeof REPLAY_MODES[number];

export const REPLAY_DECISION_TYPES = [
  "replay",
  "regenerate",
  "fail",
] as const;

export type ReplayDecisionType = typeof REPLAY_DECISION_TYPES[number];

export const REPLAY_RESULT_STATUSES = [
  "replayed",
  "regeneration_required",
  "failed",
] as const;

export type ReplayResultStatus = typeof REPLAY_RESULT_STATUSES[number];

/**
 * Replay-stable execution context reference.
 */
export interface ReplayContextReference {
  execution_id: string;
  producer: string;
  generated_at: string;
}

/**
 * Policy metadata used to audit replay decisions.
 */
export interface ReplayPolicyMetadata {
  policy_id: string;
  policy_version: string;
}

/**
 * Immutable references required to reproduce governed execution.
 */
export interface ReplayReference {
  artifact_reference: DependencyReference;
  execution_record: LLMExecutionRecord;
  prompt_reference: PromptReplayReference;
  execution_context: ReplayContextReference;
  model: LLMExecutionRecordModel;
  provider: LLMExecutionRecordProvider;
}

/**
 * Request for replay policy evaluation.
 */
export interface ReplayRequest {
  replay_mode: ReplayMode;
  replay_reference: ReplayReference;
  policy_metadata: ReplayPolicyMetadata;
}

/**
 * Explicit request to perform a new governed execution.
 *
 * Regeneration is not replay. This model authorizes no execution by itself; it
 * only records the policy decision payload required by later implementations.
 */
export interface RegenerationRequest {
  replay_reference: ReplayReference;
  reason: string;
  policy_metadata: ReplayPolicyMetadata;
}

export interface ReplayFailure {
  failure_code: string;
  message: string;
  retryable: boolean;
}

export type ReplayDecision =
  | {
    decision_type: "replay";
    replay_reference: ReplayReference;
    policy_metadata: ReplayPolicyMetadata;
  }
  | {
    decision_type: "regenerate";
    regeneration_request: RegenerationRequest;
    policy_metadata: ReplayPolicyMetadata;
  }
  | {
    decision_type: "fail";
    failure: ReplayFailure;
    policy_metadata: ReplayPolicyMetadata;
  };

export type ReplayResult =
  | {
    status: "replayed";
    replay_reference: ReplayReference;
    policy_metadata: ReplayPolicyMetadata;
  }
  | {
    status: "regeneration_required";
    regeneration_request: RegenerationRequest;
    policy_metadata: ReplayPolicyMetadata;
  }
  | {
    status: "failed";
    failure: ReplayFailure;
    policy_metadata: ReplayPolicyMetadata;
  };

export interface ReplayValidationIssue {
  code: string;
  message: string;
}

export interface ReplayValidationResult {
  valid: boolean;
  issues: readonly ReplayValidationIssue[];
}
