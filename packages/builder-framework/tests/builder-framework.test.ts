import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../artifact-framework/src/artifact-types.js";
import type { Builder } from "../src/builder.js";
import type { BuilderContext } from "../src/builder-context.js";
import type { BuilderDefinition } from "../src/builder-definition.js";
import {
  BuilderDependencyError,
  BuilderExecutionError,
  BuilderValidationError,
} from "../src/builder-errors.js";
import { BuilderExecutor } from "../src/builder-executor.js";
import type {
  BuilderExecutionFailureEvent,
  BuilderExecutionStartEvent,
  BuilderExecutionSuccessEvent,
  BuilderObserver,
} from "../src/builder-observability.js";
import { BuilderRegistry } from "../src/builder-registry.js";
import type { BuilderResult } from "../src/builder-result.js";

describe("builder framework", () => {
  it("registers builder definitions and lists metadata without instantiating builders", () => {
    const registry = new BuilderRegistry();
    let instantiations = 0;

    registry.registerBuilder(definition("themes-builder", "themes"), () => {
      instantiations += 1;
      return new TestBuilder("themes-builder");
    });

    assert.deepEqual(registry.listBuilders(), [definition("themes-builder", "themes")]);
    assert.equal(instantiations, 0);

    const builder = registry.getBuilder("themes-builder");

    assert.equal(builder.builderType(), "themes-builder");
    assert.equal(instantiations, 1);
  });

  it("rejects duplicate and missing builders with typed dependency errors", () => {
    const registry = new BuilderRegistry();

    registry.registerBuilder(definition("themes-builder", "themes"), () => new TestBuilder("themes-builder"));

    assert.throws(
      () => registry.registerBuilder(definition("themes-builder", "themes"), () => new TestBuilder("themes-builder")),
      BuilderDependencyError,
    );
    assert.throws(
      () => registry.getBuilder("missing-builder"),
      BuilderDependencyError,
    );
  });

  it("executes a builder, creates an artifact, persists it, and returns the persisted artifact", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const observer = new RecordingBuilderObserver();
    const executor = new BuilderExecutor(registry, new ArtifactService(repository), observer);
    const dependency = dependencyArtifact();

    registry.registerBuilder(definition("themes-builder", "themes"), () => new TestBuilder("themes-builder"));

    const artifact = await executor.executeBuilder<{ filing: string }, { themes: string[] }>({
      builderType: "themes-builder",
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: { filing: "filing text" },
      inputHash: "input-hash-1",
      dependencies: {
        filing: dependency,
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(artifact.identity.artifact_type, "themes");
    assert.equal(artifact.identity.company_id, "MSFT");
    assert.equal(artifact.identity.period_id, "2026-Q2");
    assert.equal(artifact.identity.version, 1);
    assert.deepEqual(artifact.content, { themes: ["cloud growth"] });
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), artifact);
    assert.deepEqual(artifact.lineage.upstream_dependencies, [
      {
        artifact_id: dependency.identity.artifact_id,
        artifact_type: dependency.identity.artifact_type,
        version: dependency.identity.version,
        artifact_hash: dependency.metadata.artifact_hash,
        input_hash: dependency.metadata.input_hash,
      },
    ]);
    assert.equal(artifact.lineage.generation_context.builder_type, "themes-builder");
    assert.equal(artifact.lineage.generation_context.execution_id, "execution-1");
    assert.equal(observer.starts.length, 1);
    assert.equal(observer.successes.length, 1);
    assert.equal(observer.failures.length, 0);
    assert.equal(observer.successes[0]?.artifactId, artifact.identity.artifact_id);
  });

  it("increments artifact versions through the artifact service", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const executor = new BuilderExecutor(registry, new ArtifactService(repository));

    registry.registerBuilder(definition("themes-builder", "themes"), () => new TestBuilder("themes-builder"));

    const first = await executor.executeBuilder({
      builderType: "themes-builder",
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: { filing: "first" },
      inputHash: "input-hash-1",
    });
    const second = await executor.executeBuilder({
      builderType: "themes-builder",
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-2",
      input: { filing: "second" },
      inputHash: "input-hash-2",
    });

    assert.equal(first.identity.version, 1);
    assert.equal(second.identity.version, 2);
    assert.deepEqual(await repository.getHistory({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), [first, second]);
  });

  it("fails fast with typed validation errors before artifact persistence", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const observer = new RecordingBuilderObserver();
    const executor = new BuilderExecutor(registry, new ArtifactService(repository), observer);

    registry.registerBuilder(definition("themes-builder", "themes"), () => new ValidationFailureBuilder());

    await assert.rejects(
      () => executor.executeBuilder({
        builderType: "themes-builder",
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: { filing: "" },
        inputHash: "input-hash-1",
      }),
      BuilderValidationError,
    );

    assert.equal(repository.createCalls, 0);
    assert.equal(observer.failures.length, 1);
  });

  it("wraps builder execution failures in typed execution errors", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const executor = new BuilderExecutor(registry, new ArtifactService(repository));

    registry.registerBuilder(definition("themes-builder", "themes"), () => new ExecutionFailureBuilder());

    await assert.rejects(
      () => executor.executeBuilder({
        builderType: "themes-builder",
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: { filing: "text" },
        inputHash: "input-hash-1",
      }),
      BuilderExecutionError,
    );

    assert.equal(repository.createCalls, 0);
  });

  it("rejects invalid builder output before artifact persistence", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const executor = new BuilderExecutor(registry, new ArtifactService(repository));

    registry.registerBuilder(definition("themes-builder", "themes"), () => new InvalidOutputBuilder());

    await assert.rejects(
      () => executor.executeBuilder({
        builderType: "themes-builder",
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: { filing: "text" },
        inputHash: "input-hash-1",
      }),
      BuilderValidationError,
    );

    assert.equal(repository.createCalls, 0);
  });
});

function definition(builderType: string, artifactType: ArtifactType): BuilderDefinition {
  return {
    builder_type: builderType,
    artifact_type: artifactType,
    version: "builder-v1",
    schema_version: "schema-v1",
    pipeline_version: "pipeline-v1",
  };
}

class TestBuilder implements Builder<{ filing: string }, { themes: string[] }> {
  constructor(private readonly type: string) {}

  builderType(): string {
    return this.type;
  }

  async validateInput(input: { filing: string }): Promise<void> {
    if (!input.filing) {
      throw new Error("filing is required");
    }
  }

  async execute(_context: BuilderContext<{ filing: string }>): Promise<BuilderResult<{ themes: string[] }>> {
    return {
      content: {
        themes: ["cloud growth"],
      },
      confidence: 0.9,
    };
  }
}

class ValidationFailureBuilder extends TestBuilder {
  constructor() {
    super("themes-builder");
  }

  override async validateInput(): Promise<void> {
    throw new Error("invalid input");
  }
}

class ExecutionFailureBuilder extends TestBuilder {
  constructor() {
    super("themes-builder");
  }

  override async execute(): Promise<BuilderResult<{ themes: string[] }>> {
    throw new Error("model unavailable");
  }
}

class InvalidOutputBuilder extends TestBuilder {
  constructor() {
    super("themes-builder");
  }

  override async execute(): Promise<BuilderResult<{ themes: string[] }>> {
    return {} as BuilderResult<{ themes: string[] }>;
  }
}

class RecordingBuilderObserver implements BuilderObserver {
  readonly starts: BuilderExecutionStartEvent[] = [];
  readonly successes: BuilderExecutionSuccessEvent[] = [];
  readonly failures: BuilderExecutionFailureEvent[] = [];

  onExecutionStart(event: BuilderExecutionStartEvent): void {
    this.starts.push(event);
  }

  onExecutionSuccess(event: BuilderExecutionSuccessEvent): void {
    this.successes.push(event);
  }

  onExecutionFailure(event: BuilderExecutionFailureEvent): void {
    this.failures.push(event);
  }
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

function dependencyArtifact(): Artifact<{ filing_id: string }> {
  return {
    identity: {
      artifact_id: "filing-artifact-1",
      artifact_type: "structured_intelligence",
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 3,
    },
    metadata: {
      version: 3,
      schema_version: "schema-v1",
      pipeline_version: "pipeline-v1",
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: "dependency-artifact-hash",
      input_hash: "dependency-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "structured-intelligence-builder",
        execution_id: "dependency-execution",
      },
    },
    content: {
      filing_id: "filing-1",
    },
  };
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifact: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
}

