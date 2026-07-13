import type {
  PromptDependency,
  PromptPlan,
  PromptUnit,
  PromptUnitId,
} from "../../../contracts/execution/prompt-framework-models.js";
import type {
  PromptExecutionPlan,
  PromptExecutionPlanStep,
} from "./types.js";
import { PromptFrameworkOrchestrationError } from "./errors.js";
import { assertValidPromptPlan } from "./validation.js";

/**
 * Builds the deterministic execution plan for a validated PromptPlan.
 *
 * The planner resolves dependencies and execution order only. It does not
 * resolve prompt packages, call the LLM Execution Framework, or assemble
 * business outputs.
 */
export function buildPromptExecutionPlan(
  plan: PromptPlan,
): PromptExecutionPlan {
  assertValidPromptPlan(plan);

  const unitsById = new Map<PromptUnitId, PromptUnit>(
    plan.execution_graph.units.map((unit) => [unit.unit_id, unit]),
  );
  const dependenciesByUnitId = dependenciesByUnit(
    plan.execution_graph.dependencies,
  );

  const steps: PromptExecutionPlanStep[] =
    plan.execution_graph.execution_order.unit_ids.map((unitId) => {
      const unit = unitsById.get(unitId);

      if (unit === undefined) {
        throw new PromptFrameworkOrchestrationError(
          `Prompt execution plan contains unknown PromptUnit '${unitId}'.`,
        );
      }

      return {
        unit_id: unitId,
        unit,
        dependency_unit_ids: dependenciesByUnitId.get(unitId) ?? [],
      };
    });

  return {
    plan_id: plan.plan_id,
    plan_version: plan.plan_version,
    steps,
  };
}

function dependenciesByUnit(
  dependencies: readonly PromptDependency[],
): Map<PromptUnitId, readonly PromptUnitId[]> {
  const dependencyMap = new Map<PromptUnitId, PromptUnitId[]>();

  for (const dependency of dependencies) {
    const currentDependencies = dependencyMap.get(dependency.unit_id) ?? [];
    currentDependencies.push(dependency.depends_on_unit_id);
    dependencyMap.set(dependency.unit_id, currentDependencies);
  }

  for (const [unitId, dependencyUnitIds] of dependencyMap.entries()) {
    dependencyMap.set(unitId, [...dependencyUnitIds].sort());
  }

  return dependencyMap;
}
