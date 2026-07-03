import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
} from "../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingGeneratorInput,
  EmbeddingProvider,
  EmbeddingProviderInput,
  EmbeddingProviderResult,
} from "../contracts/execution/embedding-generator-contract.js";
import {
  EmbeddingGenerator,
  EmbeddingGeneratorError,
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../src/embedding-generator/index.js";

describe("Embedding Generator", () => {
  it("invokes the provider and constructs one Embedding Execution Record", async () => {
    const provider = new RecordingProvider(providerResult());
    const generator = new EmbeddingGenerator(provider);
    const record = await generator.generate(input());

    assert.equal(provider.calls.length, 1);
    assert.deepEqual(provider.calls[0], { input_text: "Revenue increased." });
    assert.equal(
      record.schema_version,
      EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    );
    assert.equal(record.record_type, "embedding");
    assert.equal(record.producer, "embedding-generator-test");
    assert.equal(record.execution_id, "embedding-execution-test");
    assert.deepEqual(record.source, input().source);
    assert.deepEqual(record.embedding, providerResult());
  });

  it("computes deterministic record identity from source, model version, and vector", async () => {
    const generator = new EmbeddingGenerator(
      new RecordingProvider(providerResult()),
    );

    const first = await generator.generate(input({
      execution_context: {
        execution_id: "execution-a",
        producer: "producer-a",
      },
    }));
    const second = await generator.generate(input({
      execution_context: {
        execution_id: "execution-b",
        producer: "producer-b",
      },
    }));

    assert.equal(first.record_id, second.record_id);
    assert.equal(first.record_hash, second.record_hash);
    assert.equal(first.record_id, embeddingExecutionRecordId({
      source_type: "theme",
      source_id: "theme-1",
      source_hash: "source-hash-1",
      model_version: "embedding-model-v1",
      vector: [0.1, -0.2, 0.3],
    }));
    assert.equal(first.record_hash, embeddingExecutionRecordHash({
      source_type: "theme",
      source_id: "theme-1",
      source_hash: "source-hash-1",
      model_version: "embedding-model-v1",
      vector: [0.1, -0.2, 0.3],
    }));
  });

  it("changes record identity when the provider vector changes", async () => {
    const first = await new EmbeddingGenerator(
      new RecordingProvider(providerResult({ vector: [0.1, -0.2, 0.3] })),
    ).generate(input());
    const second = await new EmbeddingGenerator(
      new RecordingProvider(providerResult({ vector: [0.1, -0.2, 0.4] })),
    ).generate(input());

    assert.notEqual(first.record_id, second.record_id);
    assert.notEqual(first.record_hash, second.record_hash);
  });

  it("changes record identity when model version changes", async () => {
    const first = await new EmbeddingGenerator(
      new RecordingProvider(providerResult({ model_version: "v1" })),
    ).generate(input());
    const second = await new EmbeddingGenerator(
      new RecordingProvider(providerResult({ model_version: "v2" })),
    ).generate(input());

    assert.notEqual(first.record_id, second.record_id);
    assert.notEqual(first.record_hash, second.record_hash);
  });

  it("returns a record that does not share mutable vector references", async () => {
    const result = providerResult();
    const generator = new EmbeddingGenerator(new RecordingProvider(result));
    const record = await generator.generate(input());

    result.vector[0] = 999;

    assert.deepEqual(record.embedding.vector, [0.1, -0.2, 0.3]);
  });

  it("rejects invalid generator inputs before provider invocation", async () => {
    const provider = new RecordingProvider(providerResult());
    const generator = new EmbeddingGenerator(provider);
    const invalidInput: EmbeddingGeneratorInput = {
      ...input(),
      source: {
        ...input().source,
        source_hash: "",
      },
    };

    await assert.rejects(
      () => generator.generate(invalidInput),
      EmbeddingGeneratorError,
    );
    assert.equal(provider.calls.length, 0);
  });

  it("rejects empty provider vectors", async () => {
    const generator = new EmbeddingGenerator(
      new RecordingProvider(providerResult({
        dimensions: 0,
        vector: [],
      })),
    );

    await assert.rejects(
      () => generator.generate(input()),
      EmbeddingGeneratorError,
    );
  });

  it("rejects vectors whose length does not equal dimensions", async () => {
    const generator = new EmbeddingGenerator(
      new RecordingProvider(providerResult({
        dimensions: 4,
        vector: [0.1, -0.2, 0.3],
      })),
    );

    await assert.rejects(
      () => generator.generate(input()),
      EmbeddingGeneratorError,
    );
  });

  it("wraps provider failures as EmbeddingGeneratorError", async () => {
    const provider: EmbeddingProvider = {
      async generateEmbedding(): Promise<EmbeddingProviderResult> {
        throw new Error("provider unavailable");
      },
    };
    const generator = new EmbeddingGenerator(provider);

    await assert.rejects(
      () => generator.generate(input()),
      EmbeddingGeneratorError,
    );
  });
});

class RecordingProvider implements EmbeddingProvider {
  readonly calls: EmbeddingProviderInput[] = [];

  constructor(private readonly result: EmbeddingProviderResult) {}

  async generateEmbedding(
    providerInput: EmbeddingProviderInput,
  ): Promise<EmbeddingProviderResult> {
    this.calls.push(structuredClone(providerInput));

    return this.result;
  }
}

function input(
  overrides: Partial<EmbeddingGeneratorInput> = {},
): EmbeddingGeneratorInput {
  return {
    execution_context: {
      execution_id: "embedding-execution-test",
      producer: "embedding-generator-test",
    },
    source: {
      source_type: "theme",
      source_id: "theme-1",
      source_hash: "source-hash-1",
    },
    input_text: "Revenue increased.",
    ...overrides,
  };
}

function providerResult(
  overrides: Partial<EmbeddingProviderResult> = {},
): EmbeddingProviderResult {
  return {
    model: "embedding-model",
    model_version: "embedding-model-v1",
    dimensions: 3,
    vector: [0.1, -0.2, 0.3],
    ...overrides,
  };
}
