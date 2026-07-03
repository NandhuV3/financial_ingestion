/**
 * Read-only Embedding Store implementation.
 *
 * This module validates immutable Embedding Execution Record source content
 * and exposes deterministic lookup APIs. It never generates embeddings,
 * modifies vectors, performs similarity computation, or contacts providers.
 */
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../../contracts/execution/embedding-execution-record.js";
import {
  EMBEDDING_STORE_SCHEMA_VERSION,
  type EmbeddingStoreLookupRequest,
  type EmbeddingStoreReader,
  type EmbeddingStoreSource,
} from "../../contracts/execution/embedding-store-contract.js";
import {
  ConfigurationError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";

export class EmbeddingStoreError extends ConfigurationError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the Embedding Store source and retry loading the store.",
      ...options,
    });
    this.name = "EmbeddingStoreError";
  }
}

export class EmbeddingStore implements EmbeddingStoreReader {
  private readonly recordsById = new Map<string, EmbeddingExecutionRecord>();
  private readonly recordsByLookupKey = new Map<string, EmbeddingExecutionRecord>();
  private readonly recordIds: string[];

  constructor(source: EmbeddingStoreSource) {
    validateEmbeddingStoreSource(source);

    for (const record of source.records) {
      this.recordsById.set(record.record_id, clone(record));
      this.recordsByLookupKey.set(lookupKeyFromRecord(record), clone(record));
    }

    this.recordIds = [...this.recordsById.keys()]
      .sort((left, right) => left.localeCompare(right));
  }

  getRecord(recordId: string): EmbeddingExecutionRecord {
    requireNonEmptyString(recordId, "record_id");

    const record = this.recordsById.get(recordId);

    if (record === undefined) {
      throw new EmbeddingStoreError(
        `Embedding Execution Record not found: ${recordId}`,
      );
    }

    return clone(record);
  }

  hasRecord(recordId: string): boolean {
    requireNonEmptyString(recordId, "record_id");

    return this.recordsById.has(recordId);
  }

  listRecordIds(): string[] {
    return [...this.recordIds];
  }

  lookupRecord(
    request: EmbeddingStoreLookupRequest,
  ): EmbeddingExecutionRecord | undefined {
    validateLookupRequest(request);

    const record = this.recordsByLookupKey.get(lookupKey(request));

    return record === undefined ? undefined : clone(record);
  }
}

export function validateEmbeddingStoreSource(
  source: unknown,
): asserts source is EmbeddingStoreSource {
  requireObject(source, "embedding_store");

  if (source.schema_version !== EMBEDDING_STORE_SCHEMA_VERSION) {
    throw new EmbeddingStoreError(
      "Embedding Store schema_version is invalid.",
    );
  }

  if (!Array.isArray(source.records)) {
    throw new EmbeddingStoreError(
      "Embedding Store records must be an array.",
    );
  }

  const recordIds = new Set<string>();
  const recordHashes = new Set<string>();
  const lookupKeys = new Set<string>();

  source.records.forEach((record, index) => {
    validateEmbeddingExecutionRecord(record, `records[${index}]`);

    if (recordIds.has(record.record_id)) {
      throw new EmbeddingStoreError(
        `records[${index}].record_id duplicates another record.`,
      );
    }

    if (recordHashes.has(record.record_hash)) {
      throw new EmbeddingStoreError(
        `records[${index}].record_hash duplicates another record.`,
      );
    }

    const deterministicLookupKey = lookupKeyFromRecord(record);

    if (lookupKeys.has(deterministicLookupKey)) {
      throw new EmbeddingStoreError(
        `records[${index}] duplicates another deterministic lookup key.`,
      );
    }

    recordIds.add(record.record_id);
    recordHashes.add(record.record_hash);
    lookupKeys.add(deterministicLookupKey);
  });
}

function validateLookupRequest(
  request: unknown,
): asserts request is EmbeddingStoreLookupRequest {
  requireObject(request, "embedding_store_lookup_request");
  requireNonEmptyString(request.source_type, "source_type");
  requireNonEmptyString(request.source_id, "source_id");
  requireNonEmptyString(request.source_hash, "source_hash");
  requireNonEmptyString(
    request.embedding_model_version,
    "embedding_model_version",
  );
}

function validateEmbeddingExecutionRecord(
  record: unknown,
  field: string,
): asserts record is EmbeddingExecutionRecord {
  requireObject(record, field);

  if (record.schema_version !== EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION) {
    throw new EmbeddingStoreError(`${field}.schema_version is invalid.`);
  }

  if (record.record_type !== "embedding") {
    throw new EmbeddingStoreError(`${field}.record_type is invalid.`);
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
    throw new EmbeddingStoreError(
      `${field}.embedding.vector must be a non-empty array.`,
    );
  }

  record.embedding.vector.forEach((value, index) => {
    requireFiniteNumber(value, `${field}.embedding.vector[${index}]`);
  });

  if (record.embedding.vector.length !== record.embedding.dimensions) {
    throw new EmbeddingStoreError(
      `${field}.embedding.vector length must equal embedding dimensions.`,
    );
  }
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new EmbeddingStoreError(`${field} must be an object.`);
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new EmbeddingStoreError(`${field} must be a non-empty string.`);
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (
    typeof value !== "number"
      || !Number.isInteger(value)
      || value <= 0
  ) {
    throw new EmbeddingStoreError(`${field} must be a positive integer.`);
  }
}

function requireFiniteNumber(value: unknown, field: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EmbeddingStoreError(`${field} must be a finite number.`);
  }
}

function lookupKeyFromRecord(record: EmbeddingExecutionRecord): string {
  return lookupKey({
    source_type: record.source.source_type,
    source_id: record.source.source_id,
    source_hash: record.source.source_hash,
    embedding_model_version: record.embedding.model_version,
  });
}

function lookupKey(request: EmbeddingStoreLookupRequest): string {
  return [
    request.source_type,
    request.source_id,
    request.source_hash,
    request.embedding_model_version,
  ].join("\u001f");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
