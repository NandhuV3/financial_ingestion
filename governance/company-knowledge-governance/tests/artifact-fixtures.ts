import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";

export function artifact<T>(artifactId: string, artifactType: ArtifactType, content: T): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: `${artifactType}-artifact-hash`,
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
      },
    },
    content,
  };
}

export class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifactValue: Artifact<T>): Promise<void> {
    this.artifacts.set(artifactValue.identity.artifact_id, cloneArtifact(artifactValue));
    this.current.set(lookupKey(artifactValue.identity), artifactValue.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifactValue = this.artifacts.get(artifactId);

    return artifactValue ? cloneArtifact(artifactValue) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifactValue) =>
        artifactValue.identity.artifact_type === lookup.artifact_type
        && artifactValue.identity.company_id === lookup.company_id
        && artifactValue.identity.period_id === lookup.period_id)
      .map((artifactValue) => cloneArtifact(artifactValue) as Artifact<T>);
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifactValue: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifactValue)) as Artifact<T>;
}

