import type {
  PromptUnitExecutor,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  ExecutionContextReference,
  ExecutionRequest,
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  LLMExecutionReplayDecision,
} from "../../llm-execution-framework/src/index.js";
import type {
  PromptPlan,
  PromptUnitId,
  PromptUnitResult,
} from "../../../contracts/execution/prompt-framework-models.js";
import {
  IntegratedLLMExecutionService,
} from "../../llm-execution-framework/src/index.js";
import { PromptFrameworkOrchestrationError } from "./errors.js";

export interface PromptPackageResolver {
  render<TContext>(
    promptId: string,
    context: TContext,
    version?: string,
  ): LLMPromptPackage;
}

export type PromptUnitExecutionInputs<
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TStructuredOutput,
> = {
  unit_contexts: ReadonlyMap<PromptUnitId, unknown>;
  execution_contexts: ReadonlyMap<PromptUnitId, TExecutionContext>;
  provider_configurations: ReadonlyMap<PromptUnitId, TProviderConfiguration>;
  replay_decisions: ReadonlyMap<
    PromptUnitId,
    LLMExecutionReplayDecision<TStructuredOutput>
  >;
};

/**
 * PromptUnitExecutor backed by the LLM Execution Framework.
 *
 * It resolves governed prompt packages through the supplied resolver and
 * delegates execution to the LLM Execution Framework. It does not invoke
 * providers directly and does not implement replay policy.
 */
export class LLMExecutionPromptUnitExecutor<
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TStructuredOutput,
> implements PromptUnitExecutor<TStructuredOutput> {
  constructor(
    private readonly promptPackageResolver: PromptPackageResolver,
    private readonly llmExecutionService: IntegratedLLMExecutionService<
      TExecutionContext,
      TProviderConfiguration,
      TStructuredOutput
    >,
    private readonly inputs: PromptUnitExecutionInputs<
      TExecutionContext,
      TProviderConfiguration,
      TStructuredOutput
    >,
  ) {}

  async executeUnit(
    plan: PromptPlan,
    unitId: PromptUnitId,
  ): Promise<PromptUnitResult<TStructuredOutput>> {
    const unit = plan.execution_graph.units.find((promptUnit) =>
      promptUnit.unit_id === unitId
    );

    if (unit === undefined) {
      throw new PromptFrameworkOrchestrationError(
        `PromptUnit '${unitId}' is not defined in PromptPlan '${plan.plan_id}'.`,
      );
    }

    const replayDecision = requiredMapValue(
      this.inputs.replay_decisions,
      unitId,
      "replay_decisions",
    );

    validateReplayDecision(unit.prompt_id, replayDecision);

    const executionRequest: ExecutionRequest<
      LLMPromptPackage,
      TExecutionContext,
      TProviderConfiguration
    > = {
      prompt_package: this.promptPackageResolver.render(
        unit.prompt_id,
        requiredMapValue(this.inputs.unit_contexts, unitId, "unit_contexts"),
        replayDecision.execution_mode === "REPLAY"
          ? replayDecision.original_execution_record.prompt.prompt_version
          : undefined,
      ),
      execution_context: requiredMapValue(
        this.inputs.execution_contexts,
        unitId,
        "execution_contexts",
      ),
      provider_configuration: requiredMapValue(
        this.inputs.provider_configurations,
        unitId,
        "provider_configurations",
      ),
    };

    const execution = await this.llmExecutionService.execute({
      execution_request: executionRequest,
      replay_decision: replayDecision,
    });

    return unitResultFromExecution(unitId, execution.result);
  }
}

function unitResultFromExecution<TStructuredOutput>(
  unitId: PromptUnitId,
  result: ExecutionResult<TStructuredOutput>,
): PromptUnitResult<TStructuredOutput> {
  if (result.status === "succeeded") {
    return {
      unit_id: unitId,
      status: "succeeded",
      output: result.output,
      validation: {
        valid: true,
        issues: [],
      },
    };
  }

  return {
    unit_id: unitId,
    status: "failed",
    error: {
      code: result.error.error_code,
      message: result.error.message,
    },
    validation: {
      valid: false,
      issues: [
        {
          code: result.error.error_type,
          message: result.error.message,
          unit_id: unitId,
        },
      ],
    },
  };
}

function validateReplayDecision<TStructuredOutput>(
  promptId: string,
  replayDecision: LLMExecutionReplayDecision<TStructuredOutput>,
): void {
  if (
    replayDecision.execution_mode === "REPLAY"
      && replayDecision.original_execution_record.prompt.prompt_id !== promptId
  ) {
    throw new PromptFrameworkOrchestrationError(
      `Replay execution record prompt_id '${replayDecision.original_execution_record.prompt.prompt_id}' does not match PromptUnit prompt_id '${promptId}'.`,
    );
  }
}

function requiredMapValue<TKey, TValue>(
  map: ReadonlyMap<TKey, TValue>,
  key: TKey,
  fieldName: string,
): TValue {
  const value = map.get(key);

  if (value === undefined) {
    throw new PromptFrameworkOrchestrationError(
      `PromptUnit '${String(key)}' is missing required ${fieldName} entry.`,
    );
  }

  return value;
}
