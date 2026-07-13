import type {
  PromptAssembly,
} from "../../../contracts/execution/prompt-framework-contract.js";
import type {
  PromptAssemblyResult,
  PromptPlan,
  PromptUnitId,
  PromptUnitResult,
  PromptValidationIssue,
  PromptValidationResult,
} from "../../../contracts/execution/prompt-framework-models.js";
import { FrameworkPromptValidator } from "./validation.js";

export type PromptStructuredAssemblyOutput = Record<string, unknown>;

/**
 * Deterministically assembles successful PromptUnit object outputs.
 *
 * Assembly combines fields only. It does not reinterpret content, add business
 * reasoning, or perform business schema validation.
 */
export class DeterministicPromptAssembly
  implements PromptAssembly<PromptStructuredAssemblyOutput> {
  private readonly validator = new FrameworkPromptValidator();

  async assemble(
    plan: PromptPlan,
    unitResults: readonly PromptUnitResult<unknown>[],
  ): Promise<PromptAssemblyResult<PromptStructuredAssemblyOutput>> {
    const validation = this.validator.validateAssembly(plan, unitResults);
    const issues = [...validation.issues];

    if (!validation.valid) {
      return failedAssembly(unitResults, issues);
    }

    const assembledOutput: PromptStructuredAssemblyOutput = {};
    const fieldOwners = new Map<string, PromptUnitId>();

    for (const unitId of plan.execution_graph.execution_order.unit_ids) {
      const unitResult = unitResults.find((result) => result.unit_id === unitId);

      if (unitResult === undefined || unitResult.status !== "succeeded") {
        continue;
      }

      if (!isObjectRecord(unitResult.output)) {
        issues.push({
          code: "non_object_unit_output",
          message: `PromptUnit '${unitId}' output must be an object for deterministic assembly.`,
          unit_id: unitId,
        });
        continue;
      }

      for (const fieldName of Object.keys(unitResult.output).sort()) {
        const existingOwner = fieldOwners.get(fieldName);
        if (existingOwner !== undefined) {
          issues.push({
            code: "duplicate_output_field",
            message: `Output field '${fieldName}' is produced by both '${existingOwner}' and '${unitId}'.`,
            unit_id: unitId,
          });
          continue;
        }

        assembledOutput[fieldName] = unitResult.output[fieldName];
        fieldOwners.set(fieldName, unitId);
      }
    }

    if (issues.length > 0) {
      return failedAssembly(unitResults, issues);
    }

    return {
      status: "succeeded",
      output: assembledOutput,
      unit_results: unitResults,
      validation: {
        valid: true,
        issues: [],
      },
    };
  }
}

function failedAssembly(
  unitResults: readonly PromptUnitResult<unknown>[],
  issues: readonly PromptValidationIssue[],
): PromptAssemblyResult<PromptStructuredAssemblyOutput> {
  return {
    status: "failed",
    unit_results: unitResults,
    validation: validationResult(issues),
  };
}

function validationResult(
  issues: readonly PromptValidationIssue[],
): PromptValidationResult {
  return {
    valid: issues.length === 0,
    issues,
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
