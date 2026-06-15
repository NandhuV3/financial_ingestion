import type { BuilderContext } from "./builder-context.js";
import type { BuilderResult } from "./builder-result.js";

export interface Builder<TInput, TOutput> {
  builderType(): string;

  validateInput(input: TInput): Promise<void>;

  execute(context: BuilderContext<TInput>): Promise<BuilderResult<TOutput>>;
}

export type BuilderFactory<TInput = unknown, TOutput = unknown> =
  () => Builder<TInput, TOutput>;

