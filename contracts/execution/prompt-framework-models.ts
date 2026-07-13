/**
 * Canonical execution domain models for the Prompt Framework.
 *
 * These models describe prompt organization only. They do not implement prompt
 * orchestration, prompt registry lookup, LLM execution, business validation, or
 * artifact persistence.
 */
export const PROMPT_FRAMEWORK_MODELS_CONTRACT_VERSION =
  "prompt-framework-models-v1";

export const PROMPT_UNIT_STATUSES = [
  "succeeded",
  "failed",
] as const;

export type PromptUnitStatus = typeof PROMPT_UNIT_STATUSES[number];

export const PROMPT_ASSEMBLY_STATUSES = [
  "succeeded",
  "failed",
] as const;

export type PromptAssemblyStatus = typeof PROMPT_ASSEMBLY_STATUSES[number];

export type PromptUnitId = string;

/**
 * One governed reasoning task in a prompt plan.
 *
 * Prompt units identify the governed prompt to request later. They do not carry
 * prompt text and do not embed Prompt Registry behavior.
 */
export interface PromptUnit {
  unit_id: PromptUnitId;
  prompt_id: string;
  required: boolean;
  expected_output_schema_id: string;
}

/**
 * Deterministic dependency edge between prompt units.
 */
export interface PromptDependency {
  unit_id: PromptUnitId;
  depends_on_unit_id: PromptUnitId;
}

/**
 * Deterministic unit execution order for a prompt plan.
 */
export interface PromptExecutionOrder {
  unit_ids: readonly PromptUnitId[];
}

/**
 * Complete dependency graph for a prompt plan.
 */
export interface PromptExecutionGraph {
  units: readonly PromptUnit[];
  dependencies: readonly PromptDependency[];
  execution_order: PromptExecutionOrder;
}

/**
 * Deterministic assembly definition for combining prompt unit outputs.
 *
 * The definition describes assembly ownership only. It does not implement
 * assembly behavior and does not perform business interpretation.
 */
export interface PromptAssemblyDefinition {
  assembly_id: string;
  required_unit_ids: readonly PromptUnitId[];
  output_schema_id: string;
}

/**
 * Complete prompt organization plan supplied by an LLM-native intelligence
 * layer and executed by the Prompt Framework.
 */
export interface PromptPlan {
  plan_id: string;
  plan_version: string;
  execution_graph: PromptExecutionGraph;
  assembly: PromptAssemblyDefinition;
}

export interface PromptValidationIssue {
  code: string;
  message: string;
  unit_id?: PromptUnitId;
}

/**
 * Framework-level validation result.
 *
 * Business validation is intentionally excluded from this model.
 */
export interface PromptValidationResult {
  valid: boolean;
  issues: readonly PromptValidationIssue[];
}

export interface PromptUnitError {
  code: string;
  message: string;
}

export interface SuccessfulPromptUnitResult<TUnitOutput> {
  unit_id: PromptUnitId;
  status: "succeeded";
  output: TUnitOutput;
  validation: PromptValidationResult;
}

export interface FailedPromptUnitResult {
  unit_id: PromptUnitId;
  status: "failed";
  error: PromptUnitError;
  validation: PromptValidationResult;
}

/**
 * Atomic result for one prompt unit.
 */
export type PromptUnitResult<TUnitOutput> =
  | SuccessfulPromptUnitResult<TUnitOutput>
  | FailedPromptUnitResult;

export interface SuccessfulPromptAssemblyResult<TStructuredResult> {
  status: "succeeded";
  output: TStructuredResult;
  unit_results: readonly PromptUnitResult<unknown>[];
  validation: PromptValidationResult;
}

export interface FailedPromptAssemblyResult {
  status: "failed";
  unit_results: readonly PromptUnitResult<unknown>[];
  validation: PromptValidationResult;
}

/**
 * Atomic Prompt Framework assembly result.
 *
 * Partial business artifacts are intentionally not represented.
 */
export type PromptAssemblyResult<TStructuredResult> =
  | SuccessfulPromptAssemblyResult<TStructuredResult>
  | FailedPromptAssemblyResult;
