import type {
  ProviderAdapter,
} from "../../../contracts/execution/llm-execution-framework-contract.js";
import type {
  ExecutionContextReference,
  ExecutionMetadata,
  ExecutionRequest,
} from "../../../contracts/execution/llm-execution-models.js";

export type ProviderRequestBuilder<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TProviderRequest,
> = {
  buildProviderRequest(
    request: ExecutionRequest<
      TPromptPackage,
      TExecutionContext,
      TProviderConfiguration
    >,
  ): TProviderRequest;
};

export type ProviderResponseParser<
  TProviderResponse,
  TStructuredOutput,
> = {
  parseProviderResponse(response: TProviderResponse): TStructuredOutput;
};

export type ExecutionMetadataFactory<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
> = {
  buildExecutionMetadata(
    request: ExecutionRequest<
      TPromptPackage,
      TExecutionContext,
      TProviderConfiguration
    >,
  ): ExecutionMetadata;
};

export type ProviderIntegration<
  TPromptPackage,
  TExecutionContext extends ExecutionContextReference,
  TProviderConfiguration,
  TProviderRequest,
  TProviderResponse,
  TStructuredOutput,
> = {
  provider_adapter: ProviderAdapter<TProviderRequest, TProviderResponse>;
  provider_request_builder: ProviderRequestBuilder<
    TPromptPackage,
    TExecutionContext,
    TProviderConfiguration,
    TProviderRequest
  >;
  provider_response_parser: ProviderResponseParser<
    TProviderResponse,
    TStructuredOutput
  >;
  execution_metadata_factory: ExecutionMetadataFactory<
    TPromptPackage,
    TExecutionContext,
    TProviderConfiguration
  >;
};
