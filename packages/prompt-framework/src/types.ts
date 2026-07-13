import type {
  PromptPlan,
  PromptUnit,
  PromptUnitId,
  PromptUnitResult,
  PromptValidationResult,
} from "../../../contracts/execution/prompt-framework-models.js";

export type PromptExecutionPlanStep = {
  unit_id: PromptUnitId;
  unit: PromptUnit;
  dependency_unit_ids: readonly PromptUnitId[];
};

export type PromptExecutionPlan = {
  plan_id: string;
  plan_version: string;
  steps: readonly PromptExecutionPlanStep[];
};

export type PromptPlanExecutionResult = {
  plan: PromptPlan;
  execution_plan: PromptExecutionPlan;
  unit_results: readonly PromptUnitResult<unknown>[];
  validation: PromptValidationResult;
  completed: boolean;
};
