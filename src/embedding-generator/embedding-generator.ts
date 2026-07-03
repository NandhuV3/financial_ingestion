/**
 * Embedding Generator boundary implementation.
 *
 * This module is the exclusive owner of provider invocation for embedding
 * generation. It constructs immutable Embedding Execution Records and never
 * stores records, performs replay, computes similarity, or performs governance.
 */
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
  type EmbeddingExecutionRecordEmbedding,
  type EmbeddingExecutionRecordSource,
} from "../../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingGeneratorInput,
  EmbeddingGeneratorReader,
  EmbeddingProvider,
  EmbeddingProviderResult,
} from "../../contracts/execution/embedding-generator-contract.js";
import {
  ConfigurationError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";
import { createLogger } from "../shared/logger.js";
import { stableHash } from "../shared/hashing/stable-hash.js";
import type {
  EmbeddingRecordIdentityInput,
} from "./types.js";

const logger = createLogger("embedding-generator");

export class EmbeddingGeneratorError extends ConfigurationError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the embedding generation input or provider response.",
      ...options,
    });
    this.name = "EmbeddingGeneratorError";
  }
}

export class EmbeddingGenerator implements EmbeddingGeneratorReader {
  constructor(private readonly provider: EmbeddingProvider) {}

  async generate(
    input: EmbeddingGeneratorInput,
  ): Promise<EmbeddingExecutionRecord> {
    validateEmbeddingGeneratorInput(input);

    logger.info("Generating Embedding Execution Record.", {
      execution_id: input.execution_context.execution_id,
      producer: input.execution_context.producer,
      source_type: input.source.source_type,
      source_id: input.source.source_id,
    });

    try {
      const providerResult = await this.provider.generateEmbedding({
        input_text: input.input_text,
      });

      validateEmbeddingProviderResult(providerResult);

      const embedding = cloneEmbedding(providerResult);
      const identityInput = {
        source_type: input.source.source_type,
        source_id: input.source.source_id,
        source_hash: input.source.source_hash,
        model_version: embedding.model_version,
        vector: embedding.vector,
      };
      const record: EmbeddingExecutionRecord = {
        schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
        record_type: "embedding" as const,
        record_id: embeddingExecutionRecordId(identityInput),
        record_hash: embeddingExecutionRecordHash(identityInput),
        producer: input.execution_context.producer,
        execution_id: input.execution_context.execution_id,
        source: cloneSource(input.source),
        embedding,
      };

      logger.info("Embedding Execution Record generated.", {
        execution_id: input.execution_context.execution_id,
        producer: input.execution_context.producer,
        record_id: record.record_id,
        record_hash: record.record_hash,
        model: record.embedding.model,
        model_version: record.embedding.model_version,
        dimensions: record.embedding.dimensions,
      });

      return record;
    } catch (error) {
      logger.error("Embedding Execution Record generation failed.", {
        execution_id: input.execution_context.execution_id,
        producer: input.execution_context.producer,
        source_type: input.source.source_type,
        source_id: input.source.source_id,
        error_message: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof EmbeddingGeneratorError) {
        throw error;
      }

      throw new EmbeddingGeneratorError(
        "Embedding provider failed to generate an embedding vector.",
        { cause: error },
      );
    }
  }
}

export function embeddingExecutionRecordId(
  input: EmbeddingRecordIdentityInput,
): string {
  validateIdentityInput(input);

  return `embedding:${stableHash(input)}`;
}

export function embeddingExecutionRecordHash(
  input: EmbeddingRecordIdentityInput,
): string {
  validateIdentityInput(input);

  return stableHash({
    schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "embedding",
    ...input,
  });
}

function validateEmbeddingGeneratorInput(
  input: unknown,
): asserts input is EmbeddingGeneratorInput {
  requireObject(input, "embedding_generator_input");
  requireObject(input.execution_context, "execution_context");
  requireNonEmptyString(
    input.execution_context.execution_id,
    "execution_context.execution_id",
  );
  requireNonEmptyString(
    input.execution_context.producer,
    "execution_context.producer",
  );
  requireNonEmptyString(input.input_text, "input_text");
  validateSource(input.source, "source");
}

function validateSource(
  source: unknown,
  field: string,
): asserts source is EmbeddingExecutionRecordSource {
  requireObject(source, field);
  requireNonEmptyString(source.source_type, `${field}.source_type`);
  requireNonEmptyString(source.source_id, `${field}.source_id`);
  requireNonEmptyString(source.source_hash, `${field}.source_hash`);
}

function validateEmbeddingProviderResult(
  result: unknown,
): asserts result is EmbeddingProviderResult {
  requireObject(result, "embedding_provider_result");
  requireNonEmptyString(result.model, "embedding_provider_result.model");
  requireNonEmptyString(
    result.model_version,
    "embedding_provider_result.model_version",
  );
  requirePositiveInteger(
    result.dimensions,
    "embedding_provider_result.dimensions",
  );

  if (!Array.isArray(result.vector) || result.vector.length === 0) {
    throw new EmbeddingGeneratorError(
      "embedding_provider_result.vector must be a non-empty array.",
    );
  }

  result.vector.forEach((value, index) => {
    requireFiniteNumber(value, `embedding_provider_result.vector[${index}]`);
  });

  if (result.vector.length !== result.dimensions) {
    throw new EmbeddingGeneratorError(
      "embedding_provider_result.vector length must equal dimensions.",
    );
  }
}

function validateIdentityInput(input: EmbeddingRecordIdentityInput): void {
  requireNonEmptyString(input.source_type, "source_type");
  requireNonEmptyString(input.source_id, "source_id");
  requireNonEmptyString(input.source_hash, "source_hash");
  requireNonEmptyString(input.model_version, "model_version");

  if (!Array.isArray(input.vector) || input.vector.length === 0) {
    throw new EmbeddingGeneratorError(
      "vector must be a non-empty array.",
    );
  }

  input.vector.forEach((value, index) => {
    requireFiniteNumber(value, `vector[${index}]`);
  });
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new EmbeddingGeneratorError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new EmbeddingGeneratorError(`${field} must be a non-empty string.`);
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (
    typeof value !== "number"
      || !Number.isInteger(value)
      || value <= 0
  ) {
    throw new EmbeddingGeneratorError(`${field} must be a positive integer.`);
  }
}

function requireFiniteNumber(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EmbeddingGeneratorError(`${field} must be a finite number.`);
  }
}

function cloneSource(
  source: EmbeddingExecutionRecordSource,
): EmbeddingExecutionRecordSource {
  return structuredClone(source);
}

function cloneEmbedding(
  embedding: EmbeddingExecutionRecordEmbedding,
): EmbeddingExecutionRecordEmbedding {
  return structuredClone(embedding);
}
