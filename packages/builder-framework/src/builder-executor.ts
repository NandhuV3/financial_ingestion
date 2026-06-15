import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactEvaluation } from "../../../contracts/artifacts/artifact-evaluation.js";
import type { ArtifactGovernance } from "../../../contracts/artifacts/artifact-governance.js";
import type { ArtifactLineage, ModelReference, PromptReference } from "../../../contracts/artifacts/artifact-lineage.js";
import type { ArtifactService } from "../../artifact-framework/src/artifact-service.js";
import type { BuilderDependencies, BuilderContext } from "./builder-context.js";
import { BuilderDependencyError, BuilderExecutionError, BuilderValidationError, builderErrorMessage } from "./builder-errors.js";
import type { BuilderObserver } from "./builder-observability.js";
import { NoopBuilderObserver } from "./builder-observability.js";
import type { BuilderRegistry } from "./builder-registry.js";
import { validateBuilderInput, validateBuilderOutput } from "./builder-validator.js";

export type ExecuteBuilderParams<TInput> = {
  builderType: string;
  companyId: string;
  periodId: string;
  executionId: string;
  input: TInput;
  inputHash: string;
  dependencies?: BuilderDependencies;
  generatedAt?: string;
  evaluation?: ArtifactEvaluation;
  governance?: ArtifactGovernance;
};

export class BuilderExecutor {
  constructor(
    private readonly registry: BuilderRegistry,
    private readonly artifactService: ArtifactService,
    private readonly observer: BuilderObserver = new NoopBuilderObserver(),
  ) {}

  async executeBuilder<TInput, TOutput>(
    params: ExecuteBuilderParams<TInput>,
  ): Promise<Artifact<TOutput>> {
    const startedAt = params.generatedAt ?? new Date().toISOString();
    const startTime = Date.now();
    const dependencies = params.dependencies ?? {};
    let promptReference: PromptReference | undefined;
    let modelReference: ModelReference | undefined;

    this.observer.onExecutionStart({
      builderType: params.builderType,
      executionId: params.executionId,
      companyId: params.companyId,
      periodId: params.periodId,
      startedAt,
    });

    try {
      const definition = this.registry.getBuilderDefinition(params.builderType);
      const builder = this.registry.getBuilder<TInput, TOutput>(params.builderType);
      const context: BuilderContext<TInput> = {
        companyId: params.companyId,
        periodId: params.periodId,
        executionId: params.executionId,
        input: params.input,
        dependencies,
        recordPromptReference(reference) {
          promptReference = reference;
        },
        recordModelReference(reference) {
          modelReference = reference;
        },
      };

      validateBuilderInput(context);

      try {
        await builder.validateInput(params.input);
      } catch (error) {
        throw new BuilderValidationError(
          `Builder input validation failed for ${params.builderType}: ${builderErrorMessage(error)}`,
          error,
        );
      }

      let result: Awaited<ReturnType<typeof builder.execute>>;

      try {
        result = await builder.execute(context);
      } catch (error) {
        if (error instanceof BuilderValidationError || error instanceof BuilderDependencyError) {
          throw error;
        }

        throw new BuilderExecutionError(
          `Builder execution failed for ${params.builderType}: ${builderErrorMessage(error)}`,
          error,
        );
      }

      validateBuilderOutput(result);

      const artifact = await this.artifactService.createArtifact<TOutput>({
        artifact_type: definition.artifact_type,
        company_id: params.companyId,
        period_id: params.periodId,
        content: result.content,
        lineage: buildLineage(params.builderType, params.executionId, dependencies, promptReference, modelReference),
        schema_version: definition.schema_version,
        pipeline_version: definition.pipeline_version,
        input_hash: params.inputHash,
        generation_duration_ms: Date.now() - startTime,
        generated_at: params.generatedAt,
        evaluation: params.evaluation,
        governance: params.governance,
      });

      this.observer.onExecutionSuccess({
        builderType: params.builderType,
        executionId: params.executionId,
        companyId: params.companyId,
        periodId: params.periodId,
        startedAt,
        executionTimeMs: Date.now() - startTime,
        artifactId: artifact.identity.artifact_id,
      });

      return artifact;
    } catch (error) {
      const typedError = normalizeBuilderError(error, params.builderType);

      this.observer.onExecutionFailure({
        builderType: params.builderType,
        executionId: params.executionId,
        companyId: params.companyId,
        periodId: params.periodId,
        startedAt,
        executionTimeMs: Date.now() - startTime,
        failureReason: typedError.message,
      });

      throw typedError;
    }
  }
}

function buildLineage(
  builderType: string,
  executionId: string,
  dependencies: BuilderDependencies,
  promptReference?: PromptReference,
  modelReference?: ModelReference,
): ArtifactLineage {
  const lineage: ArtifactLineage = {
    upstream_dependencies: Object.values(dependencies)
      .map((artifact) => ({
        artifact_id: artifact.identity.artifact_id,
        artifact_type: artifact.identity.artifact_type,
        version: artifact.identity.version,
        artifact_hash: artifact.metadata.artifact_hash,
        input_hash: artifact.metadata.input_hash,
      }))
      .sort((left, right) =>
        `${left.artifact_type}:${left.artifact_id}`.localeCompare(`${right.artifact_type}:${right.artifact_id}`)),
    generation_context: {
      builder_type: builderType,
      execution_id: executionId,
    },
  };

  if (promptReference !== undefined) {
    lineage.prompt_reference = promptReference;
  }

  if (modelReference !== undefined) {
    lineage.model_reference = modelReference;
  }

  return lineage;
}

function normalizeBuilderError(error: unknown, builderType: string): BuilderDependencyError | BuilderExecutionError | BuilderValidationError {
  if (error instanceof BuilderDependencyError
    || error instanceof BuilderExecutionError
    || error instanceof BuilderValidationError) {
    return error;
  }

  return new BuilderExecutionError(
    `Builder execution failed for ${builderType}: ${builderErrorMessage(error)}`,
    error,
  );
}
