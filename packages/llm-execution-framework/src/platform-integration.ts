import type {
  ExecutionRecordReference,
} from "../../../contracts/framework/execution-record-reference.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import type {
  ExecutionContextReference,
  ExecutionRequest,
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  ExecutionService,
} from "../../../contracts/execution/llm-execution-framework-contract.js";
import {
  createLLMExecutionRecord,
  llmExecutionRecordReference,
  validateLLMExecutionRecord,
} from "./execution-record.js";
import { LLMExecutionValidationError } from "./errors.js";
import {
  validateExecutionRequest,
  validateExecutionResult,
} from "./validation.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";

export type LLMExecutionReplayDecision<TStructuredOutput> =
  | {
    execution_mode: "ORIGINAL_EXECUTION";
  }
  | {
    execution_mode: "REPLAY";
    original_result: ExecutionResult<TStructuredOutput>;
    original_execution_record: LLMExecutionRecord;
  };

export type LLMExecutionRecordSink = {
  record(record: LLMExecutionRecord): Promise<LLMExecutionRecord>;
};

export type IntegratedLLMExecutionRequest<
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TStructuredOutput,
> = {
  execution_request: ExecutionRequest<
    LLMPromptPackage,
    TExecutionContext,
    TProviderConfiguration
  >;
  replay_decision: LLMExecutionReplayDecision<TStructuredOutput>;
};

export type IntegratedLLMExecutionResult<TStructuredOutput> = {
  result: ExecutionResult<TStructuredOutput>;
  execution_record: LLMExecutionRecord;
  execution_record_reference: ExecutionRecordReference;
};

export class IntegratedLLMExecutionService<
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TStructuredOutput,
> {
  constructor(
    private readonly executionService: ExecutionService<
      ExecutionRequest<LLMPromptPackage, TExecutionContext, TProviderConfiguration>,
      ExecutionResult<TStructuredOutput>
    >,
    private readonly recordSink: LLMExecutionRecordSink,
  ) {}

  async execute(
    request: IntegratedLLMExecutionRequest<
      TExecutionContext,
      TProviderConfiguration,
      TStructuredOutput
    >,
  ): Promise<IntegratedLLMExecutionResult<TStructuredOutput>> {
    validateExecutionRequest(request.execution_request);
    validatePromptPackage(request.execution_request.prompt_package);

    if (
      request.execution_request.execution_context.execution_mode
        !== request.replay_decision.execution_mode
    ) {
      throw new LLMExecutionValidationError(
        "Replay decision execution_mode must match Execution Context.",
      );
    }

    if (request.replay_decision.execution_mode === "REPLAY") {
      return replayExecution(request.replay_decision);
    }

    const result = await this.executionService.execute(
      request.execution_request,
    );

    validateExecutionResult(result);

    const record = await this.recordSink.record(
      createLLMExecutionRecord({
        prompt_package: request.execution_request.prompt_package,
        result,
      }),
    );

    validateLLMExecutionRecord(record);

    return {
      result,
      execution_record: record,
      execution_record_reference: llmExecutionRecordReference(record),
    };
  }
}

function replayExecution<TStructuredOutput>(
  decision: Extract<
    LLMExecutionReplayDecision<TStructuredOutput>,
    { execution_mode: "REPLAY" }
  >,
): IntegratedLLMExecutionResult<TStructuredOutput> {
  validateExecutionResult(decision.original_result);
  validateLLMExecutionRecord(decision.original_execution_record);
  validateReplayRecordMatchesResult(
    decision.original_execution_record,
    decision.original_result,
  );

  return {
    result: decision.original_result,
    execution_record: decision.original_execution_record,
    execution_record_reference: llmExecutionRecordReference(
      decision.original_execution_record,
    ),
  };
}

function validateReplayRecordMatchesResult<TStructuredOutput>(
  record: LLMExecutionRecord,
  result: ExecutionResult<TStructuredOutput>,
): void {
  const metadata = result.metadata;

  if (
    record.execution_id !== metadata.execution_id
      || record.producer !== metadata.producer
      || record.execution.execution_mode !== metadata.execution_mode
      || record.execution.generated_at !== metadata.generated_at
      || record.prompt.prompt_id !== metadata.prompt_id
      || record.prompt.prompt_version !== metadata.prompt_version
      || record.model.model_id !== metadata.model_id
      || record.model.model_version !== metadata.model_version
      || record.provider.provider_id !== metadata.provider_id
      || record.result.status !== result.status
  ) {
    throw new LLMExecutionValidationError(
      "Replay execution record does not match original execution result.",
    );
  }

  const outputHash = result.status === "succeeded"
    ? stableHash(result.output)
    : null;

  if (record.result.output_hash !== outputHash) {
    throw new LLMExecutionValidationError(
      "Replay execution record output_hash does not match original result.",
    );
  }

  if (
    result.status === "failed"
      && stableHash(record.result.error) !== stableHash(result.error)
  ) {
    throw new LLMExecutionValidationError(
      "Replay execution record error does not match original result.",
    );
  }
}

function validatePromptPackage(promptPackage: LLMPromptPackage): void {
  requireText(promptPackage.prompt_id, "LLMPromptPackage.prompt_id");
  requireText(promptPackage.prompt_version, "LLMPromptPackage.prompt_version");
  requireText(promptPackage.system_prompt, "LLMPromptPackage.system_prompt");
  requireText(promptPackage.user_prompt, "LLMPromptPackage.user_prompt");
  requireText(promptPackage.render_hash, "LLMPromptPackage.render_hash");
}

function requireText(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new LLMExecutionValidationError(`${fieldName} is required.`);
  }
}
