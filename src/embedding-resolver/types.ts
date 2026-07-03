import type {
  EmbeddingGeneratorReader,
} from "../../contracts/execution/embedding-generator-contract.js";
import type {
  EmbeddingResolverExecutionContext,
} from "../../contracts/execution/embedding-resolver-contract.js";
import type {
  EmbeddingStoreReader,
} from "../../contracts/execution/embedding-store-contract.js";

export type EmbeddingResolverDependencies = {
  store: EmbeddingStoreReader;
  generator: EmbeddingGeneratorReader;
  execution_context: EmbeddingResolverExecutionContext;
};
