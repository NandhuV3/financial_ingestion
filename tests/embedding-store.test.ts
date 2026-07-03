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
