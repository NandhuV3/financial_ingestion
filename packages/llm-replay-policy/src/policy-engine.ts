import type {
  ReplayDecisionEngine,
  ReplayPolicy,
  ReplayResultFactory,
} from "../../../contracts/execution/llm-replay-policy-contract.js";
import type {
  ReplayDecision,
  ReplayRequest,
  ReplayResult,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import { DeterministicReplayRequestValidator } from "./validation.js";

export class DeterministicReplayDecisionEngine
  implements ReplayDecisionEngine {
  private readonly validator = new DeterministicReplayRequestValidator();

  async decide(request: ReplayRequest): Promise<ReplayDecision> {
    const validation = this.validator.validate(request);

    if (!validation.valid) {
      return {
        decision_type: "fail",
        failure: {
          failure_code: "REPLAY_REQUEST_INVALID",
          message: validation.issues.map((issue) => issue.message).join(" "),
          retryable: false,
        },
        policy_metadata: request.policy_metadata,
      };
    }

    if (request.replay_mode === "REGENERATION") {
      return {
        decision_type: "regenerate",
        regeneration_request: {
          replay_reference: request.replay_reference,
          reason: "Replay request mode requires a new governed execution.",
          policy_metadata: request.policy_metadata,
        },
        policy_metadata: request.policy_metadata,
      };
    }

    return {
      decision_type: "replay",
      replay_reference: request.replay_reference,
      policy_metadata: request.policy_metadata,
    };
  }
}

export class DeterministicReplayPolicy implements ReplayPolicy {
  constructor(
    private readonly decisionEngine: ReplayDecisionEngine =
      new DeterministicReplayDecisionEngine(),
  ) {}

  async evaluate(request: ReplayRequest): Promise<ReplayDecision> {
    return this.decisionEngine.decide(request);
  }
}

export class DeterministicReplayResultFactory
  implements ReplayResultFactory {
  createResult(decision: ReplayDecision): ReplayResult {
    if (decision.decision_type === "replay") {
      return {
        status: "replayed",
        replay_reference: decision.replay_reference,
        policy_metadata: decision.policy_metadata,
      };
    }

    if (decision.decision_type === "regenerate") {
      return {
        status: "regeneration_required",
        regeneration_request: decision.regeneration_request,
        policy_metadata: decision.policy_metadata,
      };
    }

    return {
      status: "failed",
      failure: decision.failure,
      policy_metadata: decision.policy_metadata,
    };
  }
}
