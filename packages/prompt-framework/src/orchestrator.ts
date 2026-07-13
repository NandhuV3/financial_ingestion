import type {
  PromptUnitExecutor,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptPlan,
  PromptUnitId,
  PromptUnitResult,
} from "../../../contracts/execution/prompt-framework-models.js";
import { createLogger } from "../../../src/shared/logger.js";
import { PromptFrameworkOrchestrationError } from "./errors.js";
import { buildPromptExecutionPlan } from "./execution-planner.js";
import type {
  PromptExecutionPlan,
  PromptPlanExecutionResult,
} from "./types.js";
import { FrameworkPromptValidator } from "./validation.js";

const logger = createLogger("prompt-framework");

export type PromptUnitExecutorRegistry = ReadonlyMap<
  PromptUnitId,
  PromptUnitExecutor<unknown>
>;

/**
 * Coordinates deterministic PromptUnit execution for one PromptPlan.
 *
 * The orchestrator does not assemble outputs, resolve Prompt Registry entries,
 * invoke providers, manage replay, or persist artifacts.
 */
export class PromptPlanOrchestrator {
  private readonly validator = new FrameworkPromptValidator();

  constructor(
    private readonly unitExecutors: PromptUnitExecutorRegistry,
  ) {}

  buildExecutionPlan(plan: PromptPlan): PromptExecutionPlan {
    return buildPromptExecutionPlan(plan);
  }

  async executePlan(plan: PromptPlan): Promise<PromptPlanExecutionResult> {
    const validation = this.validator.validatePlan(plan);
    if (!validation.valid) {
      logger.error("Prompt plan validation failed.", {
        plan_id: plan.plan_id,
        plan_version: plan.plan_version,
        issue_count: validation.issues.length,
      });
      throw new PromptFrameworkOrchestrationError(
        validation.issues.map((issue) => issue.message).join(" "),
      );
    }

    logger.info("Prompt plan orchestration started.", {
      plan_id: plan.plan_id,
      plan_version: plan.plan_version,
    });

    const executionPlan = buildPromptExecutionPlan(plan);
    const unitResults: PromptUnitResult<unknown>[] = [];

    for (const step of executionPlan.steps) {
      validateCompletedDependencies(step.dependency_unit_ids, unitResults);

      const executor = this.unitExecutors.get(step.unit_id);
      if (executor === undefined) {
        throw new PromptFrameworkOrchestrationError(
          `No PromptUnitExecutor registered for PromptUnit '${step.unit_id}'.`,
        );
      }

      const unitResult = await executor.executeUnit(plan, step.unit_id);
      unitResults.push(unitResult);

      if (step.unit.required && unitResult.status === "failed") {
        logger.error("Required prompt unit failed.", {
          plan_id: plan.plan_id,
          plan_version: plan.plan_version,
          unit_id: step.unit_id,
        });

        return {
          plan,
          execution_plan: executionPlan,
          unit_results: unitResults,
          validation: this.validator.validateAssembly(plan, unitResults),
          completed: false,
        };
      }
    }

    const assemblyValidation = this.validator.validateAssembly(
      plan,
      unitResults,
    );

    logger.info("Prompt plan orchestration completed.", {
      plan_id: plan.plan_id,
      plan_version: plan.plan_version,
      unit_count: unitResults.length,
      completed: assemblyValidation.valid,
    });

    return {
      plan,
      execution_plan: executionPlan,
      unit_results: unitResults,
      validation: assemblyValidation,
      completed: assemblyValidation.valid,
    };
  }
}

function validateCompletedDependencies(
  dependencyUnitIds: readonly PromptUnitId[],
  unitResults: readonly PromptUnitResult<unknown>[],
): void {
  for (const dependencyUnitId of dependencyUnitIds) {
    const dependencyResult = unitResults.find((unitResult) =>
      unitResult.unit_id === dependencyUnitId
    );

    if (dependencyResult === undefined) {
      throw new PromptFrameworkOrchestrationError(
        `PromptUnit dependency '${dependencyUnitId}' has not completed.`,
      );
    }

    if (dependencyResult.status !== "succeeded") {
      throw new PromptFrameworkOrchestrationError(
        `PromptUnit dependency '${dependencyUnitId}' did not succeed.`,
      );
    }
  }
}
