export const LLM_REPLAY_POLICY_ERROR_CODES = [
  "LLM_REPLAY_POLICY_VALIDATION_ERROR",
  "LLM_REPLAY_POLICY_DECISION_ERROR",
] as const;

export type LLMReplayPolicyErrorCode =
  typeof LLM_REPLAY_POLICY_ERROR_CODES[number];

export type LLMReplayPolicyErrorOptions = {
  cause?: unknown;
};

export class LLMReplayPolicyError extends Error {
  readonly code: LLMReplayPolicyErrorCode;

  constructor(
    message: string,
    code: LLMReplayPolicyErrorCode,
    options: LLMReplayPolicyErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "LLMReplayPolicyError";
    this.code = code;
  }
}

export class LLMReplayPolicyValidationError extends LLMReplayPolicyError {
  constructor(message: string, options: LLMReplayPolicyErrorOptions = {}) {
    super(message, "LLM_REPLAY_POLICY_VALIDATION_ERROR", options);
    this.name = "LLMReplayPolicyValidationError";
  }
}

export class LLMReplayPolicyDecisionError extends LLMReplayPolicyError {
  constructor(message: string, options: LLMReplayPolicyErrorOptions = {}) {
    super(message, "LLM_REPLAY_POLICY_DECISION_ERROR", options);
    this.name = "LLMReplayPolicyDecisionError";
  }
}
