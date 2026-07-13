/**
 * Public contract surface for the LLM Execution Framework.
 *
 * These interfaces define framework ownership boundaries only. Concrete
 * request, result, metadata, replay, and provider models are owned by later
 * LLM Execution Framework work orders.
 */
export const LLM_EXECUTION_FRAMEWORK_CONTRACT_VERSION =
  "llm-execution-framework-v1";

/**
 * Canonical entry point consumed by LLM-native intelligence layers.
 *
 * Implementations own governed LLM execution. Callers own business inputs,
 * business validation, and artifact creation.
 */
export interface LLMExecutionFramework<TExecutionRequest, TExecutionResult> {
  execute(request: TExecutionRequest): Promise<TExecutionResult>;
}

/**
 * Framework service responsible for executing one governed LLM execution.
 *
 * Implementations may coordinate prompt resolution, provider invocation,
 * execution recording, and replay according to the locked framework
 * architecture. This contract intentionally does not define those models.
 */
export interface ExecutionService<TExecutionRequest, TExecutionResult> {
  execute(request: TExecutionRequest): Promise<TExecutionResult>;
}

/**
 * Provider boundary owned by the LLM Execution Framework.
 *
 * Business layers must never call provider adapters directly. Provider
 * adapters remain provider-agnostic at this contract layer.
 */
export interface ProviderAdapter<TProviderRequest, TProviderResponse> {
  invoke(request: TProviderRequest): Promise<TProviderResponse>;
}
