import type { ArtifactType } from "./artifact-type.js";
import type { ExecutionRecordReference } from "../framework/execution-record-reference.js";

export type DependencyReference = {
  artifact_id: string;
  artifact_type: ArtifactType;
  version: number;
  artifact_hash: string;
  input_hash: string;
};

export type PromptReference = {
  prompt_id: string;
  prompt_version: string;
  activation_id: string | null;
};

export type ModelReference = {
  provider: string;
  model_name: string;
  model_version: string;
  temperature: number;
};

export type GenerationContext = {
  builder_type: string;
  execution_id?: string;
};

export type ArtifactLineage = {
  upstream_dependencies: DependencyReference[];
  execution_references?: ExecutionRecordReference[];
  prompt_reference?: PromptReference;
  model_reference?: ModelReference;
  generation_context: GenerationContext;
};
