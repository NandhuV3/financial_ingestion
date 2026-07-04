import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../../../contracts/execution/embedding-execution-record.js";
import type {
  TopicSignalExecutionRecord,
} from "../../../contracts/execution/topic-signal-execution-record.js";
import {
  EMBEDDING_STORE_SCHEMA_VERSION,
  type EmbeddingStoreSource,
} from "../../../contracts/execution/embedding-store-contract.js";
import { EmbeddingResolverError } from "../../../src/embedding-resolver/index.js";
import {
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../../../src/embedding-generator/index.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import type { ThemesArtifactContent } from "../../themes/contract.js";
import {
  TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
} from "../contract.js";
import { runTopicAssignmentReplay } from "../run-topic-assignment.js";

describe("Topic Assignment replay runner", () => {
  it("executes Builder 012 in replay mode using persisted embeddings only", async () => {
    const paths = await createReplayFixture({ includeTopicRecord: true });

    await runTopicAssignmentReplay([
      "--themes",
      paths.themesPath,
      "--topic-registry",
      paths.topicRegistryPath,
      "--embedding-store",
      paths.embeddingStorePath,
      "--output",
      paths.outputDirectory,
      "--original-execution-id",
      "company-1:2026-q1:topic-assignment-original",
      "--original-generated-at",
      "2026-06-18T00:00:00.000Z",
    ]);

    const topicAssignment = JSON.parse(
      await readFile(join(paths.outputDirectory, "03-topic-assignment.json"), "utf8"),
    ) as Artifact<unknown>;
    const topicSignals = JSON.parse(
      await readFile(join(paths.outputDirectory, "04-topic-signals.json"), "utf8"),
    ) as TopicSignalExecutionRecord[];

    assert.equal(topicAssignment.identity.artifact_type, "topic_assignment");
    assert.equal(topicSignals.length, 1);
    assert.equal(
      topicSignals[0]?.execution_context.execution_id,
      "company-1:2026-q1:topic-assignment-original",
    );
    assert.equal(
      topicSignals[0]?.execution_metadata.generated_at,
      "2026-06-18T00:00:00.000Z",
    );
  });

  it("fails deterministically when replay embeddings are missing", async () => {
    const paths = await createReplayFixture({ includeTopicRecord: false });

    await assert.rejects(
      () => runTopicAssignmentReplay([
        "--themes",
        paths.themesPath,
        "--topic-registry",
        paths.topicRegistryPath,
        "--embedding-store",
        paths.embeddingStorePath,
        "--output",
        paths.outputDirectory,
      ]),
      EmbeddingResolverError,
    );
  });
});

async function createReplayFixture(options: {
  includeTopicRecord: boolean;
}): Promise<{
  themesPath: string;
  topicRegistryPath: string;
  embeddingStorePath: string;
  outputDirectory: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "topic-assignment-replay-"));
  const outputDirectory = join(directory, "output");
  const themesPath = join(directory, "02-themes.json");
  const topicRegistryPath = join(directory, "topics.json");
  const embeddingStorePath = join(directory, "embedding-store.json");

  await writeJson(themesPath, themesArtifact());
  await writeJson(topicRegistryPath, legacyTopicRegistry());
  await writeJson(embeddingStorePath, embeddingStoreSource(options));

  return {
    themesPath,
    topicRegistryPath,
    embeddingStorePath,
    outputDirectory,
  };
}

function themesArtifact(): Artifact<ThemesArtifactContent> {
  return {
    identity: {
      artifact_id: "themes:company-1:2026-q1:1",
      artifact_type: "themes",
      company_id: "company-1",
      period_id: "2026-q1",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "themes-artifact-v4",
      pipeline_version: "themes-pipeline-v4",
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: "themes-artifact-hash",
      input_hash: "themes-input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "themes",
      },
    },
    content: {
      company_id: "company-1",
      period_id: "2026-q1",
      filing_id: "filing-1",
      themes: [{
        theme_id: "theme-a",
        title: "Cloud",
        summary: "Cloud.",
        category: "technology",
        evidence: [{ evidence_ref: "evidence:1" }],
        evidence_count: 1,
        extraction_confidence: 1,
      }],
    },
  };
}

function legacyTopicRegistry(): unknown {
  return {
    version: "1.0.0",
    topics: [{
      topic_id: "topic:cloud",
      topic_name: "Cloud",
      description: "Cloud definition.",
      theme_variants: ["Cloud example"],
    }],
  };
}

function embeddingStoreSource(options: {
  includeTopicRecord: boolean;
}): EmbeddingStoreSource {
  const records = [
    embeddingRecord({
      source_type: "topic_assignment_theme",
      source_id: "theme-a",
      source_text: [
        "Theme: Cloud",
        "Category: technology",
        "Summary: Cloud.",
      ].join("\n"),
      vector: [1, 0],
    }),
  ];

  if (options.includeTopicRecord) {
    records.push(embeddingRecord({
      source_type: "topic_assignment_topic",
      source_id: "topic:cloud",
      source_text: [
        "Topic: Cloud",
        "Definition: Cloud definition.",
        "Aliases: Cloud example",
        "Examples: Cloud example",
      ].join("\n"),
      vector: [1, 0],
    }));
  }

  return {
    schema_version: EMBEDDING_STORE_SCHEMA_VERSION,
    records,
  };
}

function embeddingRecord(input: {
  source_type: string;
  source_id: string;
  source_text: string;
  vector: number[];
}): EmbeddingExecutionRecord {
  const identityInput = {
    source_type: input.source_type,
    source_id: input.source_id,
    source_hash: stableHash(input.source_text),
    model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
    vector: input.vector,
  };

  return {
    schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "embedding",
    record_id: embeddingExecutionRecordId(identityInput),
    record_hash: embeddingExecutionRecordHash(identityInput),
    producer: "embedding-generator-test",
    execution_id: "embedding-execution-test",
    source: {
      source_type: input.source_type,
      source_id: input.source_id,
      source_hash: identityInput.source_hash,
    },
    embedding: {
      model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      dimensions: input.vector.length,
      vector: [...input.vector],
    },
  };
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
