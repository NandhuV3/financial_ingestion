import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingGeneratorInput,
  EmbeddingGeneratorReader,
} from "../contracts/execution/embedding-generator-contract.js";
import type {
  EmbeddingResolverRequest,
} from "../contracts/execution/embedding-resolver-contract.js";
import type {
  EmbeddingStoreLookupRequest,
  EmbeddingStoreReader,
} from "../contracts/execution/embedding-store-contract.js";
import {
  EmbeddingResolver,
  EmbeddingResolverError,
} from "../src/embedding-resolver/index.js";
import {
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../src/embedding-generator/index.js";

describe("Embedding Resolver", () => {
  it("returns a persisted record on original execution store hit", async () => {
    const storedRecord = record();
    const store = new MemoryStore([storedRecord]);
    const generator = new RecordingGenerator(record({ vector: [0.7, 0.8] }));
    const resolver = resolverWith(store, generator);

    const resolved = await resolver.resolve(request({
      execution_mode: "ORIGINAL_EXECUTION",
    }));

    assert.deepEqual(resolved, storedRecord);
    assert.equal(generator.calls.length, 0);
    assert.deepEqual(store.lookupRequests, [{
      source_type: "theme",
      source_id: "theme-1",
      source_hash: "source-hash-1",
      embedding_model_version: "model-v1",
    }]);
  });

  it("invokes the generator on original execution store miss", async () => {
    const generatedRecord = record({
      execution_id: "resolver-execution",
      producer: "embedding-resolver",
    });
    const store = new MemoryStore([]);
    const generator = new RecordingGenerator(generatedRecord);
    const resolver = resolverWith(store, generator);

    const resolved = await resolver.resolve(request({
      execution_mode: "ORIGINAL_EXECUTION",
    }));

    assert.deepEqual(resolved, generatedRecord);
    assert.equal(generator.calls.length, 1);
    assert.deepEqual(generator.calls[0], {
      execution_context: {
        execution_id: "resolver-execution",
        producer: "embedding-resolver",
      },
      source: {
        source_type: "theme",
        source_id: "theme-1",
        source_hash: "source-hash-1",
      },
      input_text: "Revenue increased.",
    });
  });

  it("fails deterministically on replay store miss without invoking generator", async () => {
    const store = new MemoryStore([]);
    const generator = new RecordingGenerator(record());
    const resolver = resolverWith(store, generator);

    await assert.rejects(
      () => resolver.resolve(request({ execution_mode: "REPLAY" })),
      EmbeddingResolverError,
    );
    assert.equal(generator.calls.length, 0);
  });

  it("returns a persisted record on replay store hit", async () => {
    const storedRecord = record();
    const resolver = resolverWith(
      new MemoryStore([storedRecord]),
      new RecordingGenerator(record({ vector: [0.7, 0.8] })),
    );

    const resolved = await resolver.resolve(request({
      execution_mode: "REPLAY",
    }));

    assert.deepEqual(resolved, storedRecord);
  });

  it("returns defensive copies", async () => {
    const storedRecord = record();
    const resolver = resolverWith(
      new MemoryStore([storedRecord]),
      new RecordingGenerator(record({ vector: [0.7, 0.8] })),
    );
    const resolved = await resolver.resolve(request({
      execution_mode: "REPLAY",
    }));

    resolved.embedding.vector[0] = 999;

    const resolvedAgain = await resolver.resolve(request({
      execution_mode: "REPLAY",
    }));

    assert.deepEqual(resolvedAgain.embedding.vector, [0.1, 0.2]);
  });

  it("rejects invalid execution modes", async () => {
    const resolver = resolverWith(
      new MemoryStore([]),
      new RecordingGenerator(record()),
    );

    await assert.rejects(
      () => resolver.resolve({
        ...request({ execution_mode: "REPLAY" }),
        execution_mode: "INVALID",
      } as EmbeddingResolverRequest),
      EmbeddingResolverError,
    );
  });

  it("rejects invalid execution context during construction", () => {
    assert.throws(
      () => new EmbeddingResolver({
        store: new MemoryStore([]),
        generator: new RecordingGenerator(record()),
        execution_context: {
          execution_id: "",
          producer: "embedding-resolver",
        },
      }),
      EmbeddingResolverError,
    );
  });

  it("rejects stored records with mismatched embedding models", async () => {
    const storedRecord = record({ model: "other-model" });
    const resolver = resolverWith(
      new MemoryStore([storedRecord]),
      new RecordingGenerator(record()),
    );

    await assert.rejects(
      () => resolver.resolve(request({
        execution_mode: "REPLAY",
      })),
      EmbeddingResolverError,
    );
  });

  it("rejects generated records with mismatched source identity", async () => {
    const resolver = resolverWith(
      new MemoryStore([]),
      new RecordingGenerator(record({ source_id: "theme-2" })),
    );

    await assert.rejects(
      () => resolver.resolve(request({ execution_mode: "ORIGINAL_EXECUTION" })),
      EmbeddingResolverError,
    );
  });

  it("rejects records with invalid deterministic hashes", async () => {
    const resolver = resolverWith(
      new MemoryStore([{
        ...record(),
        record_hash: "invalid-hash",
      }]),
      new RecordingGenerator(record()),
    );

    await assert.rejects(
      () => resolver.resolve(request({ execution_mode: "REPLAY" })),
      EmbeddingResolverError,
    );
  });
});

class MemoryStore implements EmbeddingStoreReader {
  readonly lookupRequests: EmbeddingStoreLookupRequest[] = [];
  private readonly recordsById = new Map<string, EmbeddingExecutionRecord>();

  constructor(records: EmbeddingExecutionRecord[]) {
    for (const entry of records) {
      this.recordsById.set(entry.record_id, structuredClone(entry));
    }
  }

  getRecord(recordId: string): EmbeddingExecutionRecord {
    const entry = this.recordsById.get(recordId);

    if (entry === undefined) {
      throw new Error(`Record not found: ${recordId}`);
    }

    return structuredClone(entry);
  }

  hasRecord(recordId: string): boolean {
    return this.recordsById.has(recordId);
  }

  listRecordIds(): string[] {
    return [...this.recordsById.keys()].sort((left, right) =>
      left.localeCompare(right));
  }

  lookupRecord(
    lookupRequest: EmbeddingStoreLookupRequest,
  ): EmbeddingExecutionRecord | undefined {
    this.lookupRequests.push(structuredClone(lookupRequest));

    for (const entry of this.recordsById.values()) {
      if (
        entry.source.source_type === lookupRequest.source_type
          && entry.source.source_id === lookupRequest.source_id
          && entry.source.source_hash === lookupRequest.source_hash
          && entry.embedding.model_version
            === lookupRequest.embedding_model_version
      ) {
        return structuredClone(entry);
      }
    }

    return undefined;
  }
}

class RecordingGenerator implements EmbeddingGeneratorReader {
  readonly calls: EmbeddingGeneratorInput[] = [];

  constructor(private readonly response: EmbeddingExecutionRecord) {}

  async generate(
    input: EmbeddingGeneratorInput,
  ): Promise<EmbeddingExecutionRecord> {
    this.calls.push(structuredClone(input));

    return structuredClone(this.response);
  }
}

function resolverWith(
  store: EmbeddingStoreReader,
  generator: EmbeddingGeneratorReader,
): EmbeddingResolver {
  return new EmbeddingResolver({
    store,
    generator,
    execution_context: {
      execution_id: "resolver-execution",
      producer: "embedding-resolver",
    },
  });
}

function request(
  overrides: Partial<EmbeddingResolverRequest> = {},
): EmbeddingResolverRequest {
  return {
    execution_mode: "ORIGINAL_EXECUTION",
    source_type: "theme",
    source_id: "theme-1",
    source_hash: "source-hash-1",
    embedding_model: "model",
    embedding_model_version: "model-v1",
    source_text: "Revenue increased.",
    ...overrides,
  };
}

function record(
  overrides: Partial<{
    source_type: string;
    source_id: string;
    source_hash: string;
    model: string;
    model_version: string;
    vector: number[];
    execution_id: string;
    producer: string;
  }> = {},
): EmbeddingExecutionRecord {
  const source_type = overrides.source_type ?? "theme";
  const source_id = overrides.source_id ?? "theme-1";
  const source_hash = overrides.source_hash ?? "source-hash-1";
  const model = overrides.model ?? "model";
  const model_version = overrides.model_version ?? "model-v1";
  const vector = overrides.vector ?? [0.1, 0.2];
  const identityInput = {
    source_type,
    source_id,
    source_hash,
    model_version,
    vector,
  };

  return {
    schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "embedding",
    record_id: embeddingExecutionRecordId(identityInput),
    record_hash: embeddingExecutionRecordHash(identityInput),
    producer: overrides.producer ?? "embedding-generator",
    execution_id: overrides.execution_id ?? "embedding-execution",
    source: {
      source_type,
      source_id,
      source_hash,
    },
    embedding: {
      model,
      model_version,
      dimensions: vector.length,
      vector: [...vector],
    },
  };
}
