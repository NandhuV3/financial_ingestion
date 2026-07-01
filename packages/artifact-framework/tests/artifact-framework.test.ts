import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactLineage } from "../../../contracts/artifacts/artifact-lineage.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ExecutionRecordReference } from "../../../contracts/framework/execution-record-reference.js";
import { EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION } from "../../../contracts/framework/execution-record-reference.js";
import type { ArtifactRepository } from "../src/artifact-repository.js";
import { ArtifactPostgresRepository, type PostgresQueryClient } from "../src/artifact-postgres-repository.js";
import { ArtifactService, calculateArtifactHash } from "../src/artifact-service.js";
import type { ArtifactLookup } from "../src/artifact-types.js";
import { validateArtifact } from "../src/artifact-validation.js";

describe("artifact framework", () => {
  it("creates and persists a validated artifact with metadata and lineage", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);
    const artifact = await service.createArtifact({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
      content: { themes: ["cloud growth"] },
      lineage: lineage(),
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-1",
      generation_duration_ms: 10,
      generated_at: "2026-06-15T00:00:00.000Z",
      evaluation: {
        evaluation_version: "placeholder-v1",
        structural_passed: true,
        confidence_score: 1,
        warnings: [],
        evaluation_timestamp: "2026-06-15T00:00:00.000Z",
      },
      governance: {
        review_required: false,
        review_status: "not_required",
        governance_flags: [],
      },
    });

    assert.equal(artifact.identity.version, 1);
    assert.equal(artifact.metadata.version, 1);
    assert.equal(artifact.metadata.status, ArtifactStatus.ACTIVE);
    assert.equal(artifact.metadata.artifact_hash, calculateArtifactHash({ themes: ["cloud growth"] }));
    assert.deepEqual(await service.getArtifact(artifact.identity.artifact_id), artifact);
  });

  it("increments versions from the current pointer and preserves artifact history", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);
    const lookup: ArtifactLookup = {
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    };

    const first = await service.createArtifact({
      ...lookup,
      content: { themes: ["cloud growth"] },
      lineage: lineage(),
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-1",
      generation_duration_ms: 10,
      generated_at: "2026-06-15T00:00:00.000Z",
    });
    const second = await service.createArtifact({
      ...lookup,
      content: { themes: ["cloud growth", "ai demand"] },
      lineage: lineage(first),
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-2",
      generation_duration_ms: 11,
      generated_at: "2026-06-15T00:01:00.000Z",
    });

    assert.equal(second.identity.version, 2);
    assert.deepEqual(await service.getCurrentArtifact(lookup), second);
    assert.deepEqual(await service.getArtifactHistory(lookup), [first, second]);
  });

  it("blocks invalid artifacts before persistence", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);

    await assert.rejects(
      () => service.createArtifact({
        artifact_type: "themes",
        company_id: "MSFT",
        period_id: "2026-Q2",
        content: { themes: [] },
        lineage: {
          upstream_dependencies: [],
          generation_context: {
            builder_type: "",
          },
        },
        schema_version: "themes-schema-v1",
        pipeline_version: "themes-pipeline-v1",
        input_hash: "input-hash",
        generation_duration_ms: 1,
      }),
      /lineage.generation_context.builder_type/,
    );

    assert.equal(repository.createCalls, 0);
  });

  it("rejects artifact identity and metadata version drift", () => {
    const artifact: Artifact<{ value: string }> = {
      identity: {
        artifact_id: "artifact-1",
        artifact_type: "themes",
        company_id: "MSFT",
        period_id: "2026-Q2",
        version: 2,
      },
      metadata: {
        version: 1,
        schema_version: "themes-schema-v1",
        pipeline_version: "themes-pipeline-v1",
        generated_at: "2026-06-15T00:00:00.000Z",
        artifact_hash: "hash",
        input_hash: "input-hash",
        generation_duration_ms: 1,
        status: ArtifactStatus.ACTIVE,
      },
      lineage: lineage(),
      content: { value: "test" },
    };

    assert.throws(() => validateArtifact(artifact), /identity version must match metadata version/);
  });

  it("keeps stored artifacts immutable by returning defensive clones", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);
    const artifact = await service.createArtifact({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
      content: { themes: ["cloud growth"] },
      lineage: lineage(),
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-1",
      generation_duration_ms: 10,
      generated_at: "2026-06-15T00:00:00.000Z",
    });
    const loaded = await service.getArtifact<{ themes: string[] }>(artifact.identity.artifact_id);

    assert.ok(loaded);
    loaded.content.themes.push("mutated");

    const reloaded = await service.getArtifact<{ themes: string[] }>(artifact.identity.artifact_id);

    assert.deepEqual(reloaded?.content.themes, ["cloud growth"]);
  });

  it("preserves execution record references separately from artifact dependencies", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);
    const executionReferences: ExecutionRecordReference[] = [
      {
        schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
        record_type: "topic_signal",
        record_id: "topic-signal:2",
        record_hash: "signal-hash-2",
        producer: "topic-assignment-builder",
        execution_id: "execution-2",
      },
      {
        schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
        record_type: "topic_signal",
        record_id: "topic-signal:1",
        record_hash: "signal-hash-1",
        producer: "topic-assignment-builder",
        execution_id: "execution-1",
      },
    ];
    const artifact = await service.createArtifact({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
      content: { themes: ["cloud growth"] },
      lineage: {
        upstream_dependencies: [],
        execution_references: executionReferences,
        generation_context: {
          builder_type: "themes-builder",
        },
      },
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-1",
      generation_duration_ms: 10,
      generated_at: "2026-06-15T00:00:00.000Z",
    });

    assert.deepEqual(artifact.lineage.upstream_dependencies, []);
    assert.deepEqual(artifact.lineage.execution_references, executionReferences);
    assert.equal(
      artifact.metadata.artifact_hash,
      calculateArtifactHash({ themes: ["cloud growth"] }),
    );

    const loaded = await service.getArtifact<{ themes: string[] }>(
      artifact.identity.artifact_id,
    );

    assert.deepEqual(loaded?.lineage.execution_references, executionReferences);
  });

  it("allows empty execution record references without changing artifact hash", async () => {
    const repository = new TestArtifactRepository();
    const service = new ArtifactService(repository);
    const artifact = await service.createArtifact({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
      content: { themes: ["cloud growth"] },
      lineage: {
        upstream_dependencies: [],
        execution_references: [],
        generation_context: {
          builder_type: "themes-builder",
        },
      },
      schema_version: "themes-schema-v1",
      pipeline_version: "themes-pipeline-v1",
      input_hash: "input-hash-1",
      generation_duration_ms: 10,
      generated_at: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(
      artifact.metadata.artifact_hash,
      calculateArtifactHash({ themes: ["cloud growth"] }),
    );
    assert.deepEqual(artifact.lineage.execution_references, []);
  });

  it("rejects malformed execution record references", () => {
    const artifact: Artifact<{ value: string }> = {
      identity: {
        artifact_id: "artifact-1",
        artifact_type: "themes",
        company_id: "MSFT",
        period_id: "2026-Q2",
        version: 1,
      },
      metadata: {
        version: 1,
        schema_version: "themes-schema-v1",
        pipeline_version: "themes-pipeline-v1",
        generated_at: "2026-06-15T00:00:00.000Z",
        artifact_hash: "hash",
        input_hash: "input-hash",
        generation_duration_ms: 1,
        status: ArtifactStatus.ACTIVE,
      },
      lineage: {
        upstream_dependencies: [],
        execution_references: [
          {
            schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
            record_type: "topic_signal",
            record_id: "",
            record_hash: "signal-hash",
            producer: "topic-assignment-builder",
            execution_id: "execution-1",
          },
        ],
        generation_context: {
          builder_type: "themes-builder",
        },
      },
      content: { value: "test" },
    };

    assert.throws(
      () => validateArtifact(artifact),
      /lineage\.execution_references\[\]\.record_id/,
    );
  });

  it("Postgres repository resolves current through artifact_current_pointer", async () => {
    const client = new RecordingPostgresClient();
    const repository = new ArtifactPostgresRepository(client);

    await repository.getCurrent({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    });

    assert.match(client.statements.join("\n"), /artifact_current_pointer/);
    assert.doesNotMatch(client.statements.join("\n"), /MAX\s*\(/i);
  });
});

function lineage(parent?: Artifact<unknown>): ArtifactLineage {
  return {
    upstream_dependencies: parent
      ? [
          {
            artifact_id: parent.identity.artifact_id,
            artifact_type: parent.identity.artifact_type,
            version: parent.identity.version,
            artifact_hash: parent.metadata.artifact_hash,
            input_hash: parent.metadata.input_hash,
          },
        ]
      : [],
    generation_context: {
      builder_type: "themes-builder",
    },
  };
}

class TestArtifactRepository implements ArtifactRepository {
  createCalls = 0;
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    this.createCalls += 1;
    const stored = cloneArtifact(artifact);

    this.artifacts.set(artifact.identity.artifact_id, stored);
    this.current.set(lookupKey(artifact.identity), artifact.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact ? cloneArtifact(artifact) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) => left.identity.version - right.identity.version)
      .map((artifact) => cloneArtifact(artifact) as Artifact<T>);
  }
}

class RecordingPostgresClient implements PostgresQueryClient {
  readonly statements: string[] = [];

  async query<Row = unknown>(sql: string): Promise<{ rows: Row[] }> {
    this.statements.push(sql);

    return { rows: [] };
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifact: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
}
