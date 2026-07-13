import type {
  ExecutionService,
  LLMExecutionFramework,
} from "../../../contracts/execution/llm-execution-framework-contract.js";
import type {
  ExecutionContextReference,
  ExecutionError,
  ExecutionErrorType,
  ExecutionRequest,
  ExecutionResult,
} from "../../../contracts/execution/llm-execution-models.js";
import {
  LLMExecutionEngineError,
  llmExecutionErrorMessage,
} from "./errors.js";
import type {
  ProviderIntegration,
} from "./provider-integration.js";
import {
  validateExecutionMetadata,
  validateExecutionRequest,
  validateExecutionResult,
} from "./validation.js";

export class ExecutionEngine<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TProviderRequest,
  TProviderResponse,
  TStructuredOutput,
> implements
    LLMExecutionFramework<
      ExecutionRequest<
        TPromptPackage,
        TExecutionContext,
        TProviderConfiguration
      >,
      ExecutionResult<TStructuredOutput>
    >,
    ExecutionService<
      ExecutionRequest<
        TPromptPackage,
        TExecutionContext,
        TProviderConfiguration
      >,
      ExecutionResult<TStructuredOutput>
    > {
  constructor(
    private readonly integration: ProviderIntegration<
      TPromptPackage,
      TExecutionContext,
      TProviderConfiguration,
      TProviderRequest,
      TProviderResponse,
      TStructuredOutput
    >,
  ) {}

  async execute(
    request: ExecutionRequest<
      TPromptPackage,
      TExecutionContext,
      TProviderConfiguration
    >,
  ): Promise<ExecutionResult<TStructuredOutput>> {
    validateExecutionRequest(request);

    const metadata =
      this.integration.execution_metadata_factory.buildExecutionMetadata(
        request,
      );

    validateExecutionMetadata(metadata);

    const providerRequest = this.buildProviderRequest(request, metadata);

    if (!providerRequest.succeeded) {
      return providerRequest.result;
    }

    const providerResponse = await this.invokeProvider(
      providerRequest.request,
      metadata,
    );

    if (!providerResponse.succeeded) {
      return providerResponse.result;
    }

    try {
      const output =
        this.integration.provider_response_parser.parseProviderResponse(
          providerResponse.response,
        );
      const result: ExecutionResult<TStructuredOutput> = {
        status: "succeeded",
        output,
        metadata,
      };

      validateExecutionResult(result);

      return result;
    } catch (error) {
      return validatedFailure(
        metadata,
        "structured_output_validation_failure",
        error,
      );
    }
  }

  private buildProviderRequest(
    request: ExecutionRequest<
      TPromptPackage,
      TExecutionContext,
      TProviderConfiguration
    >,
    metadata: ExecutionResult<TStructuredOutput>["metadata"],
  ):
    | {
      succeeded: true;
      request: TProviderRequest;
    }
    | {
      succeeded: false;
      result: ExecutionResult<TStructuredOutput>;
    } {
    try {
      return {
        succeeded: true,
        request: this.integration.provider_request_builder.buildProviderRequest(
          request,
        ),
      };
    } catch (error) {
      return {
        succeeded: false,
        result: validatedFailure(
          metadata,
          "framework_failure",
          new LLMExecutionEngineError(
            "Provider request construction failed.",
            { cause: error },
          ),
        ),
      };
    }
  }

  private async invokeProvider(
    providerRequest: TProviderRequest,
    metadata: ExecutionResult<TStructuredOutput>["metadata"],
  ): Promise<
    | {
      succeeded: true;
      response: TProviderResponse;
    }
    | {
      succeeded: false;
      result: ExecutionResult<TStructuredOutput>;
    }
  > {
    try {
      return {
        succeeded: true,
        response: await this.integration.provider_adapter.invoke(providerRequest),
      };
    } catch (error) {
      return {
        succeeded: false,
        result: validatedFailure(
          metadata,
          "provider_invocation_failure",
          error,
        ),
      };
    }
  }
}

function failedExecutionResult<TStructuredOutput>(
  metadata: ExecutionResult<TStructuredOutput>["metadata"],
  errorType: ExecutionErrorType,
  error: unknown,
): ExecutionResult<TStructuredOutput> {
  return {
    status: "failed",
    error: executionError(errorType, error),
    metadata,
  };
}

function executionError(
  errorType: ExecutionErrorType,
  error: unknown,
): ExecutionError {
  return {
    error_type: errorType,
    error_code: error instanceof LLMExecutionEngineError
      ? error.code
      : "LLM_EXECUTION_ENGINE_ERROR",
    message: llmExecutionErrorMessage(error),
  };
}

function validatedFailure<TStructuredOutput>(
  metadata: ExecutionResult<TStructuredOutput>["metadata"],
  errorType: ExecutionErrorType,
  error: unknown,
): ExecutionResult<TStructuredOutput> {
  const failure = failedExecutionResult<TStructuredOutput>(
    metadata,
    errorType,
    error,
  );

  validateExecutionResult(failure);

  return failure;
}
