import type { Artifact } from "../../../contracts/artifacts/artifact.js";

export type BuilderDependencies = Record<string, Artifact<unknown>>;

export type BuilderContext<TInput> = {
  companyId: string;
  periodId: string;
  executionId: string;
  input: TInput;
  dependencies: BuilderDependencies;
};

