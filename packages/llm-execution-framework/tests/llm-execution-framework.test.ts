import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  ProviderAdapter,
} from "../../../contracts/execution/llm-execution-framework-contract.js";
import type {
  ExecutionContextReference,
  ExecutionMetadata,
  ExecutionRequest,
} from "../../../contracts/execution/llm-execution-models.js";
import type {
  LLMExecutionRecord,
} from "../../../contracts/execution/llm-execution-record.js";
import type {
  LLMPromptPackage,
} from "../../../contracts/execution/llm-prompt-package.js";
import {
  ExecutionEngine,
  IntegratedLLMExecutionService,
  LLMExecutionValidationError,
  validateExecutionResult,
  type LLMExecutionRecordSink,
  type ProviderIntegration,
} from "../src/index.js";

type TestProviderConfiguration = {
  provider_id: string;
  model_id: string;
  model_version: string;
};

type TestProviderRequest = {
  model: string;
  messages: string[];
};

type TestProviderResponse = {
  output: string;
};

type TestStructuredOutput = {
  value: string;
};

describe("LLM Execution Framework", () => {
  it("executes provider-agnostic requests and returns validated structured output", async () => {
    const adapter = new RecordingProviderAdapter({
      output: JSON.stringify({ value: "structured" }),
    });
    const engine = newTestEngine(adapter);
    const result = await engine.execute(executionRequest());

    assert.equal(result.status, "succeeded");

    if (result.status !== "succeeded") {
      assert.fail("Expected successful execution result.");
    }

    assert.deepEqual(result.output, { value: "structured" });
    assert.deepEqual(adapter.requests, [{
      model: "test-model",
      messages: ["system", "user"],
    }]);
    assert.equal(result.metadata.prompt_id, "prompt-1");
    assert.equal(result.metadata.provider_id, "provider-1");
  });

  it("rejects invalid execution requests before provider invocation", async () => {
    const adapter = new RecordingProviderAdapter({
      output: JSON.stringify({ value: "structured" }),
    });
    const engine = newTestEngine(adapter);
    const invalidRequest = {
      ...executionRequest(),
      execution_context: {
        ...executionContext(),
        execution_id: "",
      },
    };

    await assert.rejects(
      () => engine.execute(invalidRequest),
      LLMExecutionValidationError,
    );
    assert.deepEqual(adapter.requests, []);
  });

  it("returns failed execution result when provider invocation fails", async () => {
    const engine = newTestEngine(new FailingProviderAdapter());
    const result = await engine.execute(executionRequest());

    assert.equal(result.status, "failed");

    if (result.status !== "failed") {
      assert.fail("Expected failed execution result.");
    }

    assert.equal(result.error.error_type, "provider_invocation_failure");
    assert.equal(result.metadata.execution_id, "execution-1");
  });

  it("returns failed execution result when structured output validation fails", async () => {
    const engine = newTestEngine(new RecordingProviderAdapter({
      output: "not-json",
    }));
    const result = await engine.execute(executionRequest());

    assert.equal(result.status, "failed");

    if (result.status !== "failed") {
      assert.fail("Expected failed execution result.");
    }

    assert.equal(
      result.error.error_type,
      "structured_output_validation_failure",
    );
  });

  it("validates execution result contracts only", () => {
    assert.throws(
      () => validateExecutionResult({
        status: "succeeded",
        output: undefined,
        metadata: executionMetadata(),
      }),
      LLMExecutionValidationError,
    );
    assert.doesNotThrow(
      () => validateExecutionResult({
        status: "succeeded",
        output: {
          arbitrary_business_shape: true,
        },
        metadata: executionMetadata(),
      }),
    );
  });

  it("produces immutable operational execution records during original execution", async () => {
    const adapter = new RecordingProviderAdapter({
      output: JSON.stringify({ value: "structured" }),
    });
    const sink = new RecordingExecutionRecordSink();
    const service = new IntegratedLLMExecutionService(
      newTestEngine(adapter),
      sink,
    );
    const response = await service.execute({
      execution_request: executionRequest(),
      replay_decision: {
        execution_mode: "ORIGINAL_EXECUTION",
      },
    });

    assert.equal(response.result.status, "succeeded");
    assert.equal(sink.records.length, 1);
    assert.equal(response.execution_record.record_type, "llm_execution");
    assert.equal(
      response.execution_record.prompt.render_hash,
      "render-hash-1",
    );
    assert.equal(
      response.execution_record_reference.record_id,
      response.execution_record.record_id,
    );
    assert.equal(
      response.execution_record_reference.record_hash,
      response.execution_record.record_hash,
    );
    assert.deepEqual(adapter.requests, [{
      model: "test-model",
      messages: ["system", "user"],
    }]);
  });

  it("replays supplied execution records without invoking the provider", async () => {
    const adapter = new RecordingProviderAdapter({
      output: JSON.stringify({ value: "original" }),
    });
    const sink = new RecordingExecutionRecordSink();
    const service = new IntegratedLLMExecutionService(
      newTestEngine(adapter),
      sink,
    );
    const original = await service.execute({
      execution_request: executionRequest(),
      replay_decision: {
        execution_mode: "ORIGINAL_EXECUTION",
      },
    });
    const replayService = new IntegratedLLMExecutionService(
      newTestEngine(new FailingProviderAdapter()),
      new RecordingExecutionRecordSink(),
    );
    const replayRequest = {
      ...executionRequest(),
      execution_context: {
        ...executionContext(),
        execution_mode: "REPLAY" as const,
      },
    };
    const replayed = await replayService.execute({
      execution_request: replayRequest,
      replay_decision: {
        execution_mode: "REPLAY",
        original_result: original.result,
        original_execution_record: original.execution_record,
      },
    });

    assert.deepEqual(replayed.result, original.result);
    assert.deepEqual(replayed.execution_record, original.execution_record);
    assert.deepEqual(
      replayed.execution_record_reference,
      original.execution_record_reference,
    );
  });
});

function newTestEngine(
  adapter: ProviderAdapter<TestProviderRequest, TestProviderResponse>,
): ExecutionEngine<
  LLMPromptPackage,
  ExecutionContextReference,
  TestProviderConfiguration,
  TestProviderRequest,
  TestProviderResponse,
  TestStructuredOutput
> {
  return new ExecutionEngine(integration(adapter));
}

function integration(
  adapter: ProviderAdapter<TestProviderRequest, TestProviderResponse>,
): ProviderIntegration<
  LLMPromptPackage,
  ExecutionContextReference,
  TestProviderConfiguration,
  TestProviderRequest,
  TestProviderResponse,
  TestStructuredOutput
> {
  return {
    provider_adapter: adapter,
    provider_request_builder: {
      buildProviderRequest(request) {
        return {
          model: request.provider_configuration.model_id,
          messages: [
            request.prompt_package.system_prompt,
            request.prompt_package.user_prompt,
          ],
        };
      },
    },
    provider_response_parser: {
      parseProviderResponse(response) {
        const parsed = JSON.parse(response.output) as unknown;

        if (!isStructuredOutput(parsed)) {
          throw new Error("Provider response does not contain structured output.");
        }

        return parsed;
      },
    },
    execution_metadata_factory: {
      buildExecutionMetadata(request) {
        return {
          execution_id: request.execution_context.execution_id,
          execution_mode: request.execution_context.execution_mode,
          producer: request.execution_context.producer,
          generated_at: request.execution_context.generated_at,
          prompt_id: request.prompt_package.prompt_id,
          prompt_version: request.prompt_package.prompt_version,
          model_id: request.provider_configuration.model_id,
          model_version: request.provider_configuration.model_version,
          provider_id: request.provider_configuration.provider_id,
        };
      },
    },
  };
}

function executionRequest(): ExecutionRequest<
  LLMPromptPackage,
  ExecutionContextReference,
  TestProviderConfiguration
> {
  return {
    prompt_package: {
      prompt_id: "prompt-1",
      prompt_version: "v1",
      activation_id: "activation-1",
      system_prompt: "system",
      user_prompt: "user",
      render_hash: "render-hash-1",
      source: "filesystem",
    },
    execution_context: executionContext(),
    provider_configuration: {
      provider_id: "provider-1",
      model_id: "test-model",
      model_version: "test-model-v1",
    },
  };
}

function executionContext(): ExecutionContextReference {
  return {
    execution_id: "execution-1",
    execution_mode: "ORIGINAL_EXECUTION",
    producer: "llm-execution-framework-test",
    generated_at: "2026-07-13T00:00:00.000Z",
  };
}

function executionMetadata(): ExecutionMetadata {
  return {
    execution_id: "execution-1",
    execution_mode: "ORIGINAL_EXECUTION",
    producer: "llm-execution-framework-test",
    generated_at: "2026-07-13T00:00:00.000Z",
    prompt_id: "prompt-1",
    prompt_version: "v1",
    model_id: "test-model",
    model_version: "test-model-v1",
    provider_id: "provider-1",
  };
}

function isStructuredOutput(value: unknown): value is TestStructuredOutput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { value?: unknown }).value === "string";
}

class RecordingProviderAdapter
  implements ProviderAdapter<TestProviderRequest, TestProviderResponse> {
  readonly requests: TestProviderRequest[] = [];

  constructor(private readonly response: TestProviderResponse) {}

  async invoke(request: TestProviderRequest): Promise<TestProviderResponse> {
    this.requests.push(request);
    return this.response;
  }
}

class FailingProviderAdapter
  implements ProviderAdapter<TestProviderRequest, TestProviderResponse> {
  async invoke(
    _request: TestProviderRequest,
  ): Promise<TestProviderResponse> {
    throw new Error("provider unavailable");
  }
}

class RecordingExecutionRecordSink implements LLMExecutionRecordSink {
  readonly records: LLMExecutionRecord[] = [];

  async record(record: LLMExecutionRecord): Promise<LLMExecutionRecord> {
    this.records.push(record);
    return record;
  }
}
