import type { PromptValidator } from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptDependency,
  PromptPlan,
  PromptUnit,
  PromptUnitId,
  PromptUnitResult,
  PromptValidationIssue,
  PromptValidationResult,
} from "../../../contracts/execution/prompt-framework-models.js";
import { PromptFrameworkValidationError } from "./errors.js";

export class FrameworkPromptValidator implements PromptValidator {
  validatePlan(plan: PromptPlan): PromptValidationResult {
    return validatePromptPlan(plan);
  }

  validateAssembly(
    plan: PromptPlan,
    unitResults: readonly PromptUnitResult<unknown>[],
  ): PromptValidationResult {
    const planValidation = validatePromptPlan(plan);
    const issues = [...planValidation.issues];
    const resultUnitIds = new Set<PromptUnitId>();

    for (const result of unitResults) {
      if (resultUnitIds.has(result.unit_id)) {
        issues.push(issue(
          "duplicate_unit_result",
          `PromptUnitResult for '${result.unit_id}' is duplicated.`,
          result.unit_id,
        ));
      }

      resultUnitIds.add(result.unit_id);
    }

    for (const unitId of plan.assembly.required_unit_ids) {
      const result = unitResults.find((unitResult) =>
        unitResult.unit_id === unitId
      );

      if (result === undefined) {
        issues.push(issue(
          "missing_required_unit_result",
          `Required PromptUnit '${unitId}' has no result.`,
          unitId,
        ));
      } else if (result.status !== "succeeded") {
        issues.push(issue(
          "required_unit_failed",
          `Required PromptUnit '${unitId}' did not succeed.`,
          unitId,
        ));
      }
    }

    return validationResult(issues);
  }
}

export function assertValidPromptPlan(plan: PromptPlan): void {
  const validation = validatePromptPlan(plan);

  if (!validation.valid) {
    throw new PromptFrameworkValidationError(
      validation.issues.map((validationIssue) => validationIssue.message).join(
        " ",
      ),
    );
  }
}

export function validatePromptPlan(plan: PromptPlan): PromptValidationResult {
  if (!isObject(plan)) {
    return validationResult([
      issue("invalid_plan", "PromptPlan must be an object."),
    ]);
  }

  const issues: PromptValidationIssue[] = [];
  requireNonEmptyText(plan.plan_id, "PromptPlan.plan_id", issues);
  requireNonEmptyText(plan.plan_version, "PromptPlan.plan_version", issues);

  if (!isObject(plan.execution_graph)) {
    issues.push(issue(
      "invalid_execution_graph",
      "PromptPlan.execution_graph must be an object.",
    ));
    return validationResult(issues);
  }

  if (!Array.isArray(plan.execution_graph.units)) {
    issues.push(issue(
      "invalid_units",
      "PromptExecutionGraph.units must be an array.",
    ));
    return validationResult(issues);
  }

  if (plan.execution_graph.units.length === 0) {
    issues.push(issue(
      "missing_units",
      "PromptExecutionGraph.units must contain at least one PromptUnit.",
    ));
  }

  const unitIds = validateUnits(plan.execution_graph.units, issues);
  validateDependencies(plan.execution_graph.dependencies, unitIds, issues);
  validateExecutionOrder(
    plan.execution_graph.execution_order?.unit_ids,
    unitIds,
    plan.execution_graph.dependencies,
    issues,
  );
  validateAssembly(plan, unitIds, issues);

  return validationResult(issues);
}

function validateUnits(
  units: readonly PromptUnit[],
  issues: PromptValidationIssue[],
): Set<PromptUnitId> {
  const unitIds = new Set<PromptUnitId>();

  for (const unit of units) {
    if (!isObject(unit)) {
      issues.push(issue("invalid_unit", "PromptUnit must be an object."));
      continue;
    }

    requireNonEmptyText(unit.unit_id, "PromptUnit.unit_id", issues);
    requireNonEmptyText(unit.prompt_id, "PromptUnit.prompt_id", issues, unit.unit_id);
    requireNonEmptyText(
      unit.expected_output_schema_id,
      "PromptUnit.expected_output_schema_id",
      issues,
      unit.unit_id,
    );

    if (typeof unit.required !== "boolean") {
      issues.push(issue(
        "invalid_required_flag",
        `PromptUnit '${unit.unit_id}' required flag must be boolean.`,
        unit.unit_id,
      ));
    }

    if (unitIds.has(unit.unit_id)) {
      issues.push(issue(
        "duplicate_unit",
        `PromptUnit '${unit.unit_id}' is duplicated.`,
        unit.unit_id,
      ));
    }

    unitIds.add(unit.unit_id);
  }

  return unitIds;
}

function validateDependencies(
  dependencies: readonly PromptDependency[],
  unitIds: ReadonlySet<PromptUnitId>,
  issues: PromptValidationIssue[],
): void {
  if (!Array.isArray(dependencies)) {
    issues.push(issue(
      "invalid_dependencies",
      "PromptExecutionGraph.dependencies must be an array.",
    ));
    return;
  }

  const dependencyKeys = new Set<string>();

  for (const dependency of dependencies) {
    if (!isObject(dependency)) {
      issues.push(issue(
        "invalid_dependency",
        "PromptDependency must be an object.",
      ));
      continue;
    }

    const unitId = textValue(dependency.unit_id);
    const dependsOnUnitId = textValue(dependency.depends_on_unit_id);
    requireNonEmptyText(
      dependency.unit_id,
      "PromptDependency.unit_id",
      issues,
      unitId,
    );
    requireNonEmptyText(
      dependency.depends_on_unit_id,
      "PromptDependency.depends_on_unit_id",
      issues,
      unitId,
    );

    if (unitId === undefined || dependsOnUnitId === undefined) {
      continue;
    }

    if (!unitIds.has(unitId)) {
      issues.push(issue(
        "unknown_dependency_unit",
        `PromptDependency unit '${unitId}' is not defined.`,
        unitId,
      ));
    }

    if (!unitIds.has(dependsOnUnitId)) {
      issues.push(issue(
        "unknown_dependency_target",
        `PromptDependency target '${dependsOnUnitId}' is not defined.`,
        unitId,
      ));
    }

    if (unitId === dependsOnUnitId) {
      issues.push(issue(
        "self_dependency",
        `PromptUnit '${unitId}' cannot depend on itself.`,
        unitId,
      ));
    }

    const dependencyKey = `${unitId}\u0000${dependsOnUnitId}`;
    if (dependencyKeys.has(dependencyKey)) {
      issues.push(issue(
        "duplicate_dependency",
        `PromptDependency '${unitId}' -> '${dependsOnUnitId}' is duplicated.`,
        unitId,
      ));
    }

    dependencyKeys.add(dependencyKey);
  }
}

function validateExecutionOrder(
  orderedUnitIds: readonly PromptUnitId[] | undefined,
  unitIds: ReadonlySet<PromptUnitId>,
  dependencies: readonly PromptDependency[],
  issues: PromptValidationIssue[],
): void {
  if (!Array.isArray(orderedUnitIds)) {
    issues.push(issue(
      "invalid_execution_order",
      "PromptExecutionOrder.unit_ids must be an array.",
    ));
    return;
  }

  const orderedIds = new Set<PromptUnitId>();

  for (const unitId of orderedUnitIds) {
    if (orderedIds.has(unitId)) {
      issues.push(issue(
        "duplicate_execution_order_unit",
        `PromptExecutionOrder includes '${unitId}' more than once.`,
        unitId,
      ));
    }

    if (!unitIds.has(unitId)) {
      issues.push(issue(
        "unknown_execution_order_unit",
        `PromptExecutionOrder includes unknown PromptUnit '${unitId}'.`,
        unitId,
      ));
    }

    orderedIds.add(unitId);
  }

  for (const unitId of unitIds) {
    if (!orderedIds.has(unitId)) {
      issues.push(issue(
        "missing_execution_order_unit",
        `PromptExecutionOrder is missing PromptUnit '${unitId}'.`,
        unitId,
      ));
    }
  }

  const orderIndex = new Map<PromptUnitId, number>();
  orderedUnitIds.forEach((unitId, index) => orderIndex.set(unitId, index));

  for (const dependency of dependencies) {
    const unitIndex = orderIndex.get(dependency.unit_id);
    const dependencyIndex = orderIndex.get(dependency.depends_on_unit_id);

    if (
      unitIndex !== undefined
        && dependencyIndex !== undefined
        && dependencyIndex >= unitIndex
    ) {
      issues.push(issue(
        "dependency_order_violation",
        `PromptUnit '${dependency.unit_id}' must execute after '${dependency.depends_on_unit_id}'.`,
        dependency.unit_id,
      ));
    }
  }
}

function validateAssembly(
  plan: PromptPlan,
  unitIds: ReadonlySet<PromptUnitId>,
  issues: PromptValidationIssue[],
): void {
  if (!isObject(plan.assembly)) {
    issues.push(issue("invalid_assembly", "PromptPlan.assembly must be an object."));
    return;
  }

  requireNonEmptyText(plan.assembly.assembly_id, "PromptAssembly.assembly_id", issues);
  requireNonEmptyText(
    plan.assembly.output_schema_id,
    "PromptAssembly.output_schema_id",
    issues,
  );

  if (!Array.isArray(plan.assembly.required_unit_ids)) {
    issues.push(issue(
      "invalid_required_unit_ids",
      "PromptAssembly.required_unit_ids must be an array.",
    ));
    return;
  }

  const requiredUnitIds = new Set<PromptUnitId>();
  const unitsById = new Map(
    plan.execution_graph.units.map((unit) => [unit.unit_id, unit]),
  );

  for (const unitId of plan.assembly.required_unit_ids) {
    if (requiredUnitIds.has(unitId)) {
      issues.push(issue(
        "duplicate_required_unit",
        `PromptAssembly required unit '${unitId}' is duplicated.`,
        unitId,
      ));
    }

    if (!unitIds.has(unitId)) {
      issues.push(issue(
        "unknown_required_unit",
        `PromptAssembly required unit '${unitId}' is not defined.`,
        unitId,
      ));
    }

    const unit = unitsById.get(unitId);
    if (unit !== undefined && !unit.required) {
      issues.push(issue(
        "assembly_requires_optional_unit",
        `PromptAssembly required unit '${unitId}' must be a required PromptUnit.`,
        unitId,
      ));
    }

    requiredUnitIds.add(unitId);
  }

  for (const unit of plan.execution_graph.units) {
    if (unit.required && !requiredUnitIds.has(unit.unit_id)) {
      issues.push(issue(
        "required_unit_missing_from_assembly",
        `Required PromptUnit '${unit.unit_id}' must be included in PromptAssembly.required_unit_ids.`,
        unit.unit_id,
      ));
    }
  }
}

function validationResult(
  issues: readonly PromptValidationIssue[],
): PromptValidationResult {
  return {
    valid: issues.length === 0,
    issues,
  };
}

function issue(
  code: string,
  message: string,
  unitId?: PromptUnitId,
): PromptValidationIssue {
  return unitId === undefined
    ? { code, message }
    : { code, message, unit_id: unitId };
}

function requireNonEmptyText(
  value: unknown,
  fieldName: string,
  issues: PromptValidationIssue[],
  unitId?: PromptUnitId,
): void {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(issue(
      "missing_required_field",
      `${fieldName} is required.`,
      unitId,
    ));
  }
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value
    : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
