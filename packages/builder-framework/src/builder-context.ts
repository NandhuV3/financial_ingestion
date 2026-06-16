import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ModelReference, PromptReference } from "../../../contracts/artifacts/artifact-lineage.js";

export type BuilderDependencies = Record<string, Artifact<unknown>>;

export type BuilderContext<TInput> = {
  companyId: string;
  periodId: string;
  executionId: string;
  input: TInput;
  dependencies: BuilderDependencies;
  recordPromptReference(reference: PromptReference): void;
  recordModelReference(reference: ModelReference): void;
};
