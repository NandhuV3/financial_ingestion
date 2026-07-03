import type {
  EmbeddingGeneratorReader,
} from "../../contracts/execution/embedding-generator-contract.js";
import type {
  EmbeddingResolverExecutionContext,
} from "../../contracts/execution/embedding-resolver-contract.js";
import type {
  EmbeddingStoreRepository,
} from "../../contracts/execution/embedding-store-contract.js";

export type EmbeddingResolverDependencies = {
  store: EmbeddingStoreRepository;
  generator: EmbeddingGeneratorReader;
  execution_context: EmbeddingResolverExecutionContext;
};
