import type {
  Artifact,
} from "../../../contracts/artifacts/artifact.js";
import type {
  ArtifactLineage,
  ModelReference,
  PromptReference,
} from "../../../contracts/artifacts/artifact-lineage.js";
import type {
  DependencyReference,
} from "../../../contracts/artifacts/artifact-lineage.js";
import type {
  ReplayReference,
} from "../../../contracts/execution/llm-replay-policy-models.js";
import type {
  ExecutionRecordReference,
} from "../../../contracts/framework/execution-record-reference.js";
import type {
  StructuredIntelligence,
  StructuredIntelligenceInput,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import type {
  ArtifactService,
} from "../../artifact-framework/src/artifact-service.js";
import {
  calculateArtifactHash,
} from "../../artifact-framework/src/artifact-service.js";
import type {
  ReservedArtifactId,
} from "../../artifact-framework/src/artifact-types.js";
import {
  BuilderValidationError,
} from "../../builder-framework/src/builder-errors.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
} from "../../../contracts/company-intelligence/structured-intelligence-contract.js";
import {
  validateStructuredIntelligenceOutput,
} from "./validation.js";

export const STRUCTURED_INTELLIGENCE_PIPELINE_VERSION =
  "structured-intelligence-pipeline-v1";

export interface StructuredIntelligenceArtifactAssemblyRequest {
  input: StructuredIntelligenceInput;
  content: StructuredIntelligence;
  artifactService: ArtifactService;
  execution_id: string;
  prompt_reference: PromptReference;
  model_reference: ModelReference;
  execution_references: readonly ExecutionRecordReference[];
  replay_reference: ReplayReference | null;
  generated_at?: string;
  generation_duration_ms: number;
  artifact_id?: ReservedArtifactId;
}

export interface StructuredIntelligenceArtifactAssemblyResult {
  artifact: Artifact<StructuredIntelligence>;
  replay_reference: ReplayReference | null;
}

/**
 * Assembles the immutable Structured Intelligence artifact through the Artifact
 * Framework.
 *
 * Artifact identity, hashing, versioning, validation, and persistence remain
 * owned by ArtifactService. This module only supplies Structured
 * Intelligence-owned content and framework-owned references.
 */
export async function assembleStructuredIntelligenceArtifact(
  request: StructuredIntelligenceArtifactAssemblyRequest,
): Promise<StructuredIntelligenceArtifactAssemblyResult> {
  validateStructuredIntelligenceOutput(request.content);
  validateAssemblyRequest(request);

  const artifact = await request.artifactService.createArtifact({
    artifact_id: request.artifact_id,
    artifact_type: "structured_intelligence",
    company_id: request.input.company_id,
    period_id: request.input.period_id,
    content: request.content,
    lineage: structuredIntelligenceLineage(request),
    schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
    pipeline_version: STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
    input_hash: structuredIntelligenceInputHash(request.input),
    generation_duration_ms: request.generation_duration_ms,
    generated_at: request.generated_at,
  });

  return {
    artifact,
    replay_reference: request.replay_reference,
  };
}

export function structuredIntelligenceInputHash(
  input: StructuredIntelligenceInput,
): string {
  return calculateArtifactHash({
    company_id: input.company_id,
    period_id: input.period_id,
    filing_id: input.filing_id,
    inputs: input.inputs,
  });
}

export function structuredIntelligenceLineage(
  request: Pick<
    StructuredIntelligenceArtifactAssemblyRequest,
    | "input"
    | "execution_id"
    | "prompt_reference"
    | "model_reference"
    | "execution_references"
  >,
): ArtifactLineage {
  return {
    upstream_dependencies: upstreamDependencies(request.input),
    prompt_reference: request.prompt_reference,
    model_reference: request.model_reference,
    execution_references: [...request.execution_references],
    generation_context: {
      builder_type: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      execution_id: request.execution_id,
    },
  };
}

function upstreamDependencies(
  input: StructuredIntelligenceInput,
): DependencyReference[] {
  return [
    input.inputs.filing_artifact,
    input.inputs.themes_artifact,
  ].sort((left, right) =>
    `${left.artifact_type}:${left.artifact_id}`
      .localeCompare(`${right.artifact_type}:${right.artifact_id}`));
}

function validateAssemblyRequest(
  request: StructuredIntelligenceArtifactAssemblyRequest,
): void {
  if (request.content.company_id !== request.input.company_id) {
    throw new BuilderValidationError(
      "Structured Intelligence artifact content company_id must match input.",
    );
  }

  if (request.content.period_id !== request.input.period_id) {
    throw new BuilderValidationError(
      "Structured Intelligence artifact content period_id must match input.",
    );
  }

  if (request.content.filing_id !== request.input.filing_id) {
    throw new BuilderValidationError(
      "Structured Intelligence artifact content filing_id must match input.",
    );
  }

  if (request.model_reference.temperature !== 0) {
    throw new BuilderValidationError(
      "Structured Intelligence model reference temperature must be 0 for replay compatibility.",
    );
  }

  if (request.replay_reference !== null) {
    validateReplayReferenceCompatibility(request);
  }
}

function validateReplayReferenceCompatibility(
  request: StructuredIntelligenceArtifactAssemblyRequest,
): void {
  const replayReference = request.replay_reference;

  if (replayReference === null) {
    return;
  }

  if (
    replayReference.prompt_reference.prompt_id
      !== request.prompt_reference.prompt_id
    || replayReference.prompt_reference.prompt_version
      !== request.prompt_reference.prompt_version
  ) {
    throw new BuilderValidationError(
      "Structured Intelligence replay reference prompt identity must match artifact prompt reference.",
    );
  }

  if (replayReference.execution_context.execution_id !== request.execution_id) {
    throw new BuilderValidationError(
      "Structured Intelligence replay reference execution_id must match artifact assembly execution_id.",
    );
  }
}
