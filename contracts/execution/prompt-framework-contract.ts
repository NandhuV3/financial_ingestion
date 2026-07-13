import type {
  PromptAssemblyResult,
  PromptPlan,
  PromptUnitId,
  PromptUnitResult,
  PromptValidationResult,
} from "./prompt-framework-models.js";

/**
 * Public contract surface for the Prompt Framework.
 *
 * These interfaces define prompt organization ownership only. Concrete
 * orchestration, sequencing, registry lookup, LLM execution, replay, and
 * artifact persistence are owned by later implementation packages or adjacent
 * Platform Foundation frameworks.
 */
export const PROMPT_FRAMEWORK_CONTRACT_VERSION =
  "prompt-framework-v1";

/**
 * Canonical entry point consumed by LLM-native intelligence layers.
 *
 * Implementations own prompt organization. Callers own business schemas,
 * business validation, and artifact creation.
 */
export interface PromptFramework<TStructuredResult> {
  execute(plan: PromptPlan): Promise<PromptAssemblyResult<TStructuredResult>>;
}

/**
 * Framework boundary for executing one prompt unit.
 *
 * Implementations coordinate with the LLM Execution Framework. They must not
 * invoke providers directly.
 */
export interface PromptUnitExecutor<TUnitOutput> {
  executeUnit(
    plan: PromptPlan,
    unit_id: PromptUnitId,
  ): Promise<PromptUnitResult<TUnitOutput>>;
}

/**
 * Framework boundary for deterministic prompt output assembly.
 *
 * Assembly combines completed unit outputs. It must not introduce business
 * reasoning or reinterpret prompt unit content.
 */
export interface PromptAssembly<TStructuredResult> {
  assemble(
    plan: PromptPlan,
    unit_results: readonly PromptUnitResult<unknown>[],
  ): Promise<PromptAssemblyResult<TStructuredResult>>;
}

/**
 * Framework boundary for prompt-level validation.
 *
 * This validates Prompt Framework execution contracts only. Business validation
 * remains owned by the consuming intelligence layer.
 */
export interface PromptValidator {
  validatePlan(plan: PromptPlan): PromptValidationResult;
  validateAssembly(
    plan: PromptPlan,
    unit_results: readonly PromptUnitResult<unknown>[],
  ): PromptValidationResult;
}
