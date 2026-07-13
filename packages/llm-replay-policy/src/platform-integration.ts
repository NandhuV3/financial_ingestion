import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import type {
  DependencyReference,
} from "../../../contracts/artifacts/artifact-lineage.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  ReplayDecision,
  ReplayRequest,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import type {
  PromptReplayReference,
  PromptResolutionResult,
} from "../../../contracts/execution/prompt-registry-models.js";
import type {
  PromptRegistry,
} from "../../../contracts/execution/prompt-registry-contract.js";
import type {
  LLMExecutionReplayDecision,
} from "../../llm-execution-framework/src/index.js";
import { LLMReplayPolicyDecisionError } from "./errors.js";
import { DeterministicReplayDecisionEngine } from "./policy-engine.js";

export interface ReplayArtifactLookup<TArtifactContent> {
  getArtifact(
    reference: DependencyReference,
  ): Promise<Artifact<TArtifactContent> | null>;
}

export interface ReplayExecutionRecordLookup {
  getExecutionRecord(recordId: string): Promise<LLMExecutionRecord | null>;
}

export type ReplayPromptPackageLookup = Pick<PromptRegistry, "resolveReplay">;

export type ReplayResolvedResources<TArtifactContent> = {
  artifact: Artifact<TArtifactContent>;
  execution_record: LLMExecutionRecord;
  prompt_resolution: PromptResolutionResult;
};

export type ReplayCoordinationResult<TArtifactContent> =
  | {
    status: "replay_ready";
    decision: Extract<ReplayDecision, { decision_type: "replay" }>;
    resources: ReplayResolvedResources<TArtifactContent>;
  }
  | {
    status: "regeneration_required";
    decision: Extract<ReplayDecision, { decision_type: "regenerate" }>;
  }
  | {
    status: "failed";
    decision: Extract<ReplayDecision, { decision_type: "fail" }>;
  };

/**
 * Coordinates replay resource lookup through injected platform boundaries.
 *
 * The coordinator does not resolve resources itself, execute replay, execute
 * regeneration, invoke providers, or create artifacts.
 */
export class ReplayResolutionCoordinator<TArtifactContent> {
  constructor(
    private readonly artifactLookup: ReplayArtifactLookup<TArtifactContent>,
    private readonly executionRecordLookup: ReplayExecutionRecordLookup,
    private readonly promptPackageLookup: ReplayPromptPackageLookup,
    private readonly decisionEngine = new DeterministicReplayDecisionEngine(),
  ) {}

  async coordinate(
    request: ReplayRequest,
  ): Promise<ReplayCoordinationResult<TArtifactContent>> {
    const decision = await this.decisionEngine.decide(request);

    if (decision.decision_type === "fail") {
      return {
        status: "failed",
        decision,
      };
    }

    if (decision.decision_type === "regenerate") {
      return {
        status: "regeneration_required",
        decision,
      };
    }

    return this.coordinateReplay(decision);
  }

  private async coordinateReplay(
    decision: Extract<ReplayDecision, { decision_type: "replay" }>,
  ): Promise<ReplayCoordinationResult<TArtifactContent>> {
    const reference = decision.replay_reference;
    const artifact = await this.artifactLookup.getArtifact(
      reference.artifact_reference,
    );

    if (artifact === null) {
      return failedCoordination(
        "REPLAY_ARTIFACT_NOT_FOUND",
        "Referenced replay artifact could not be resolved.",
        decision.policy_metadata,
      );
    }

    const executionRecord = await this.executionRecordLookup.getExecutionRecord(
      reference.execution_record.record_id,
    );

    if (executionRecord === null) {
      return failedCoordination(
        "REPLAY_EXECUTION_RECORD_NOT_FOUND",
        "Referenced replay execution record could not be resolved.",
        decision.policy_metadata,
      );
    }

    const promptResolution = await this.resolvePrompt(reference.prompt_reference);

    return {
      status: "replay_ready",
      decision,
      resources: {
        artifact,
        execution_record: executionRecord,
        prompt_resolution: promptResolution,
      },
    };
  }

  private async resolvePrompt(
    reference: PromptReplayReference,
  ): Promise<PromptResolutionResult> {
    try {
      return await this.promptPackageLookup.resolveReplay(reference);
    } catch (error) {
      throw new LLMReplayPolicyDecisionError(
        "Referenced replay Prompt Package could not be resolved.",
        { cause: error },
      );
    }
  }
}

export class LLMExecutionReplayDecisionAdapter {
  toExecutionFrameworkDecision<TStructuredOutput>(
    decision: ReplayDecision,
    originalResult?: ExecutionResult<TStructuredOutput>,
  ): LLMExecutionReplayDecision<TStructuredOutput> {
    if (decision.decision_type === "regenerate") {
      return {
        execution_mode: "ORIGINAL_EXECUTION",
      };
    }

    if (decision.decision_type === "fail") {
      throw new LLMReplayPolicyDecisionError(
        decision.failure.message,
      );
    }

    if (originalResult === undefined) {
      throw new LLMReplayPolicyDecisionError(
        "Original ExecutionResult is required to provide replay decisions to the LLM Execution Framework.",
      );
    }

    return {
      execution_mode: "REPLAY",
      original_result: originalResult,
      original_execution_record: decision.replay_reference.execution_record,
    };
  }
}

function failedCoordination<TArtifactContent>(
  failureCode: string,
  message: string,
  policyMetadata: ReplayDecision["policy_metadata"],
): ReplayCoordinationResult<TArtifactContent> {
  return {
    status: "failed",
    decision: {
      decision_type: "fail",
      failure: {
        failure_code: failureCode,
        message,
        retryable: false,
      },
      policy_metadata: policyMetadata,
    },
  };
}
