import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../contracts/execution/embedding-execution-record.js";
import {
  EMBEDDING_STORE_SCHEMA_VERSION,
  type EmbeddingStoreSource,
} from "../contracts/execution/embedding-store-contract.js";
import {
  EmbeddingStore,
  EmbeddingStoreError,
  loadEmbeddingStore,
} from "../src/embedding-store/index.js";
import {
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../src/embedding-generator/index.js";

describe("Embedding Store", () => {
  it("loads the default static store and exposes deterministic record lookup", async () => {
    const store = await loadEmbeddingStore();
    const recordIds = store.listRecordIds();

    assert.deepEqual(recordIds, ["embedding-record-bootstrap-001"]);
    assert.equal(store.hasRecord("embedding-record-bootstrap-001"), true);

    const record = store.getRecord("embedding-record-bootstrap-001");

    assert.equal(
      record.schema_version,
      EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    );
    assert.equal(record.record_type, "embedding");
    assert.equal(record.embedding.dimensions, record.embedding.vector.length);
  });

  it("returns defensive copies from the read-only API", () => {
    const store = new EmbeddingStore(source());
    const record = store.getRecord("embedding-record-2");

    record.record_hash = "mutated";
    record.source.source_hash = "mutated";
    record.embedding.vector[0] = 999;

    const original = store.getRecord("embedding-record-2");

    assert.equal(original.record_hash, "record-hash-2");
    assert.equal(
      original.source.source_hash,
      "source-hash-embedding-record-2",
    );
    assert.deepEqual(original.embedding.vector, [0.4, 0.5]);
  });

  it("supports deterministic lookup by source identity and model version", () => {
    const store = new EmbeddingStore(source());
    const record = store.lookupRecord({
      source_type: "test_source",
      source_id: "source-embedding-record-2",
      source_hash: "source-hash-embedding-record-2",
      embedding_model_version: "test-v1",
    });

    assert.equal(record?.record_id, "embedding-record-2");
  });

  it("returns undefined when deterministic lookup has no match", () => {
    const store = new EmbeddingStore(source());
    const record = store.lookupRecord({
      source_type: "test_source",
      source_id: "source-embedding-record-2",
      source_hash: "source-hash-embedding-record-2",
      embedding_model_version: "test-v2",
    });

    assert.equal(record, undefined);
  });

  it("returns defensive copies from deterministic lookup", () => {
    const store = new EmbeddingStore(source());
    const record = store.lookupRecord({
      source_type: "test_source",
      source_id: "source-embedding-record-2",
      source_hash: "source-hash-embedding-record-2",
      embedding_model_version: "test-v1",
    });

    assert.ok(record);
    record.embedding.vector[0] = 999;

    const original = store.lookupRecord({
      source_type: "test_source",
      source_id: "source-embedding-record-2",
      source_hash: "source-hash-embedding-record-2",
      embedding_model_version: "test-v1",
    });

    assert.deepEqual(original?.embedding.vector, [0.4, 0.5]);
  });

  it("persists newly generated records with deterministic lookup support", () => {
    const store = new EmbeddingStore(source());
    const generatedRecord = deterministicRecord({
      source_id: "source-new",
      source_hash: "source-hash-new",
      vector: [0.2, 0.3],
    });

    const persisted = store.persistRecord(generatedRecord);

    assert.deepEqual(persisted, generatedRecord);
    assert.equal(store.hasRecord(generatedRecord.record_id), true);
    assert.deepEqual(store.listRecordIds(), [
      "embedding-record-2",
      generatedRecord.record_id,
    ].sort((left, right) => left.localeCompare(right)));

    const resolved = store.lookupRecord({
      source_type: "test_source",
      source_id: "source-new",
      source_hash: "source-hash-new",
      embedding_model_version: "test-v1",
    });

    assert.deepEqual(resolved, generatedRecord);
  });

  it("returns defensive copies from persisted records", () => {
    const store = new EmbeddingStore(source());
    const generatedRecord = deterministicRecord({
      source_id: "source-new",
      source_hash: "source-hash-new",
    });

    const persisted = store.persistRecord(generatedRecord);
    persisted.embedding.vector[0] = 999;

    const stored = store.getRecord(generatedRecord.record_id);

    assert.deepEqual(stored.embedding.vector, generatedRecord.embedding.vector);
  });

  it("does not duplicate an already persisted record", () => {
    const store = new EmbeddingStore(source());
    const generatedRecord = deterministicRecord({
      source_id: "source-new",
      source_hash: "source-hash-new",
    });

    store.persistRecord(generatedRecord);
    const duplicate = store.persistRecord(generatedRecord);

    assert.deepEqual(duplicate, generatedRecord);
    assert.equal(
      store.listRecordIds().filter((recordId) =>
        recordId === generatedRecord.record_id).length,
      1,
    );
  });

  it("rejects persisted records with invalid deterministic identity", () => {
    const store = new EmbeddingStore(source());
    const generatedRecord = {
      ...deterministicRecord({
        source_id: "source-new",
        source_hash: "source-hash-new",
      }),
      record_id: "embedding:invalid",
    };

    assert.throws(
      () => store.persistRecord(generatedRecord),
      EmbeddingStoreError,
    );
  });

  it("rejects persisted records that collide on deterministic lookup key", () => {
    const store = new EmbeddingStore(source());
    const firstRecord = deterministicRecord({
      source_id: "source-new",
      source_hash: "source-hash-new",
      vector: [0.2, 0.3],
    });
    const secondRecord = deterministicRecord({
      source_id: "source-new",
      source_hash: "source-hash-new",
      vector: [0.8, 0.9],
    });

    store.persistRecord(firstRecord);

    assert.throws(
      () => store.persistRecord(secondRecord),
      EmbeddingStoreError,
    );
  });

  it("returns sorted record IDs for deterministic listing", () => {
    const store = new EmbeddingStore({
      ...source(),
      records: [
        record({ record_id: "embedding-record-b", record_hash: "hash-b" }),
        record({ record_id: "embedding-record-a", record_hash: "hash-a" }),
      ],
    });

    assert.deepEqual(store.listRecordIds(), [
      "embedding-record-a",
      "embedding-record-b",
    ]);
  });

  it("loads a store from an explicit path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "embedding-store-"));
    const path = join(directory, "embedding-execution-records.json");

    await writeFile(path, `${JSON.stringify(source(), null, 2)}\n`, "utf8");

    const store = await loadEmbeddingStore(path);

    assert.equal(store.hasRecord("embedding-record-2"), true);
  });

  it("rejects invalid store schema versions", () => {
    const invalidSource = {
      ...source(),
      schema_version: "embedding-store-v0",
    } as EmbeddingStoreSource;

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects invalid embedding execution record schema versions", () => {
    const invalidSource = source();

    invalidSource.records[0] = {
      ...invalidSource.records[0]!,
      schema_version: "embedding-execution-record-v0",
    } as EmbeddingExecutionRecord;

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects duplicate record IDs", () => {
    const invalidSource = source();

    invalidSource.records.push(record({
      record_id: "embedding-record-2",
      record_hash: "record-hash-3",
    }));

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects duplicate record hashes", () => {
    const invalidSource = source();

    invalidSource.records.push(record({
      record_id: "embedding-record-3",
      record_hash: "record-hash-2",
    }));

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects duplicate deterministic lookup keys", () => {
    const invalidSource = source();

    invalidSource.records.push({
      ...record({
        record_id: "embedding-record-3",
        record_hash: "record-hash-3",
      }),
      source: {
        source_type: "test_source",
        source_id: "source-embedding-record-2",
        source_hash: "source-hash-embedding-record-2",
      },
      embedding: {
        model: "different-model-name",
        model_version: "test-v1",
        dimensions: 2,
        vector: [0.6, 0.7],
      },
    });

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects empty vectors", () => {
    const invalidSource = source();

    invalidSource.records[0] = {
      ...invalidSource.records[0]!,
      embedding: {
        ...invalidSource.records[0]!.embedding,
        vector: [],
      },
    };

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects non-positive dimensions", () => {
    const invalidSource = source();

    invalidSource.records[0] = {
      ...invalidSource.records[0]!,
      embedding: {
        ...invalidSource.records[0]!.embedding,
        dimensions: 0,
      },
    };

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });

  it("rejects vectors whose length does not equal dimensions", () => {
    const invalidSource = source();

    invalidSource.records[0] = {
      ...invalidSource.records[0]!,
      embedding: {
        ...invalidSource.records[0]!.embedding,
        dimensions: 3,
        vector: [0.4, 0.5],
      },
    };

    assert.throws(
      () => new EmbeddingStore(invalidSource),
      EmbeddingStoreError,
    );
  });
});

function source(): EmbeddingStoreSource {
  return {
    schema_version: EMBEDDING_STORE_SCHEMA_VERSION,
    records: [
      record({
        record_id: "embedding-record-2",
        record_hash: "record-hash-2",
      }),
    ],
  };
}

function record(input: {
  record_id: string;
  record_hash: string;
}): EmbeddingExecutionRecord {
  return {
    schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "embedding",
    record_id: input.record_id,
    record_hash: input.record_hash,
    producer: "embedding-generator",
    execution_id: `execution-${input.record_id}`,
    source: {
      source_type: "test_source",
      source_id: `source-${input.record_id}`,
      source_hash: `source-hash-${input.record_id}`,
    },
    embedding: {
      model: "test-embedding-model",
      model_version: "test-v1",
      dimensions: 2,
      vector: [0.4, 0.5],
    },
  };
}

function deterministicRecord(
  overrides: Partial<{
    source_type: string;
    source_id: string;
    source_hash: string;
    model: string;
    model_version: string;
    vector: number[];
  }> = {},
): EmbeddingExecutionRecord {
  const source_type = overrides.source_type ?? "test_source";
  const source_id = overrides.source_id ?? "source-deterministic";
  const source_hash = overrides.source_hash ?? "source-hash-deterministic";
  const model = overrides.model ?? "test-embedding-model";
  const model_version = overrides.model_version ?? "test-v1";
  const vector = overrides.vector ?? [0.4, 0.5];
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
    producer: "embedding-generator",
    execution_id: `execution-${source_id}`,
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
