/**
 * Embedding Resolver policy implementation.
 *
 * This module is the single embedding resolution entry point for builders.
 * It enforces original-execution versus replay behavior and never computes
 * similarity, persists records, orchestrates replay, or calls providers
 * directly.
 */
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingResolverReader,
  EmbeddingResolverRequest,
  EmbeddingResolutionMode,
} from "../../contracts/execution/embedding-resolver-contract.js";
import {
  EMBEDDING_RESOLUTION_MODES,
} from "../../contracts/execution/embedding-resolver-contract.js";
import {
  ConfigurationError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";
import {
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../embedding-generator/index.js";
import { createLogger } from "../shared/logger.js";
import type {
  EmbeddingResolverDependencies,
} from "./types.js";

const logger = createLogger("embedding-resolver");

export class EmbeddingResolverError extends ConfigurationError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the embedding resolver request, store contents, or generator output.",
      ...options,
    });
    this.name = "EmbeddingResolverError";
  }
}

export class EmbeddingResolver implements EmbeddingResolverReader {
  constructor(private readonly dependencies: EmbeddingResolverDependencies) {
    validateExecutionContext(dependencies.execution_context);
  }

  async resolve(
    request: EmbeddingResolverRequest,
  ): Promise<EmbeddingExecutionRecord> {
    validateResolverRequest(request);

    logger.info("Embedding resolution started.", logContext(request));

    const storedRecord = this.dependencies.store.lookupRecord({
      source_type: request.source_type,
      source_id: request.source_id,
      source_hash: request.source_hash,
      embedding_model_version: request.embedding_model_version,
    });

    if (storedRecord !== undefined) {
      logger.info("Embedding Store lookup hit.", {
        ...logContext(request),
        record_id: storedRecord.record_id,
      });

      validateResolvedRecord(storedRecord, request, "stored_record");

      logger.info("Embedding resolution succeeded.", {
        ...logContext(request),
        record_id: storedRecord.record_id,
        resolution_source: "store",
      });

      return clone(storedRecord);
    }

    logger.info("Embedding Store lookup missed.", logContext(request));

    if (request.execution_mode === "REPLAY") {
      logger.error("Embedding replay failed because record is missing.", {
        ...logContext(request),
      });

      throw new EmbeddingResolverError(
        "Embedding Execution Record is required during replay but was not found.",
      );
    }

    logger.info("Invoking Embedding Generator.", logContext(request));

    const generatedRecord = await this.dependencies.generator.generate({
      execution_context: this.dependencies.execution_context,
      source: {
        source_type: request.source_type,
        source_id: request.source_id,
        source_hash: request.source_hash,
      },
      input_text: request.source_text,
    });

    validateResolvedRecord(generatedRecord, request, "generated_record");

    logger.info("Embedding resolution succeeded.", {
      ...logContext(request),
      record_id: generatedRecord.record_id,
      resolution_source: "generator",
    });

    return clone(generatedRecord);
  }
}

function validateResolverRequest(
  request: unknown,
): asserts request is EmbeddingResolverRequest {
  requireObject(request, "embedding_resolver_request");

  if (!isEmbeddingResolutionMode(request.execution_mode)) {
    throw new EmbeddingResolverError("execution_mode is invalid.");
  }

  requireNonEmptyString(request.source_type, "source_type");
  requireNonEmptyString(request.source_id, "source_id");
  requireNonEmptyString(request.source_hash, "source_hash");
  requireNonEmptyString(request.embedding_model, "embedding_model");
  requireNonEmptyString(
    request.embedding_model_version,
    "embedding_model_version",
  );
  requireNonEmptyString(request.source_text, "source_text");
}

function validateExecutionContext(
  context: unknown,
): asserts context is EmbeddingResolverDependencies["execution_context"] {
  requireObject(context, "execution_context");
  requireNonEmptyString(context.execution_id, "execution_context.execution_id");
  requireNonEmptyString(context.producer, "execution_context.producer");
}

function validateResolvedRecord(
  record: unknown,
  request: EmbeddingResolverRequest,
  field: string,
): asserts record is EmbeddingExecutionRecord {
  requireObject(record, field);

  if (record.schema_version !== EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION) {
    throw new EmbeddingResolverError(`${field}.schema_version is invalid.`);
  }

  if (record.record_type !== "embedding") {
    throw new EmbeddingResolverError(`${field}.record_type is invalid.`);
  }

  requireNonEmptyString(record.record_id, `${field}.record_id`);
  requireNonEmptyString(record.record_hash, `${field}.record_hash`);
  requireNonEmptyString(record.producer, `${field}.producer`);
  requireNonEmptyString(record.execution_id, `${field}.execution_id`);
  requireObject(record.source, `${field}.source`);
  requireNonEmptyString(record.source.source_type, `${field}.source.source_type`);
  requireNonEmptyString(record.source.source_id, `${field}.source.source_id`);
  requireNonEmptyString(record.source.source_hash, `${field}.source.source_hash`);
  requireObject(record.embedding, `${field}.embedding`);
  requireNonEmptyString(record.embedding.model, `${field}.embedding.model`);
  requireNonEmptyString(
    record.embedding.model_version,
    `${field}.embedding.model_version`,
  );
  requirePositiveInteger(
    record.embedding.dimensions,
    `${field}.embedding.dimensions`,
  );

  if (
    !Array.isArray(record.embedding.vector)
      || record.embedding.vector.length === 0
  ) {
    throw new EmbeddingResolverError(
      `${field}.embedding.vector must be a non-empty array.`,
    );
  }

  record.embedding.vector.forEach((value, index) => {
    requireFiniteNumber(value, `${field}.embedding.vector[${index}]`);
  });

  if (record.embedding.vector.length !== record.embedding.dimensions) {
    throw new EmbeddingResolverError(
      `${field}.embedding.vector length must equal dimensions.`,
    );
  }

  if (
    record.source.source_type !== request.source_type
      || record.source.source_id !== request.source_id
      || record.source.source_hash !== request.source_hash
  ) {
    throw new EmbeddingResolverError(
      `${field}.source does not match the resolver request.`,
    );
  }

  if (record.embedding.model !== request.embedding_model) {
    throw new EmbeddingResolverError(
      `${field}.embedding.model does not match the resolver request.`,
    );
  }

  if (record.embedding.model_version !== request.embedding_model_version) {
    throw new EmbeddingResolverError(
      `${field}.embedding.model_version does not match the resolver request.`,
    );
  }

  const identityInput = {
    source_type: record.source.source_type,
    source_id: record.source.source_id,
    source_hash: record.source.source_hash,
    model_version: record.embedding.model_version,
    vector: record.embedding.vector,
  };
  const expectedRecordId = embeddingExecutionRecordId(identityInput);
  const expectedRecordHash = embeddingExecutionRecordHash(identityInput);

  if (record.record_id !== expectedRecordId) {
    throw new EmbeddingResolverError(
      `${field}.record_id does not match deterministic identity.`,
    );
  }

  if (record.record_hash !== expectedRecordHash) {
    throw new EmbeddingResolverError(
      `${field}.record_hash does not match deterministic integrity hash.`,
    );
  }
}

function isEmbeddingResolutionMode(
  value: unknown,
): value is EmbeddingResolutionMode {
  return typeof value === "string"
    && EMBEDDING_RESOLUTION_MODES.includes(value as EmbeddingResolutionMode);
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new EmbeddingResolverError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new EmbeddingResolverError(`${field} must be a non-empty string.`);
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (
    typeof value !== "number"
      || !Number.isInteger(value)
      || value <= 0
  ) {
    throw new EmbeddingResolverError(`${field} must be a positive integer.`);
  }
}

function requireFiniteNumber(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EmbeddingResolverError(`${field} must be a finite number.`);
  }
}

function logContext(request: EmbeddingResolverRequest): Record<string, string> {
  return {
    execution_mode: request.execution_mode,
    source_type: request.source_type,
    source_id: request.source_id,
    source_hash: request.source_hash,
    embedding_model: request.embedding_model,
    embedding_model_version: request.embedding_model_version,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
