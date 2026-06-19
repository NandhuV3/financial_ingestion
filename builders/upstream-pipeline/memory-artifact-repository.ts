import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { ArtifactRepository } from "../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../packages/artifact-framework/src/artifact-types.js";

export class MemoryArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly currentPointers = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    const stored = clone(artifact);
    this.artifacts.set(stored.identity.artifact_id, stored);
    this.currentPointers.set(
      lookupKey(stored.identity),
      stored.identity.artifact_id,
    );
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact === undefined
      ? null
      : clone(artifact) as Artifact<T>;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.currentPointers.get(lookupKey(lookup));

    return artifactId === undefined
      ? null
      : this.getById<T>(artifactId);
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) =>
        left.identity.version - right.identity.version)
      .map((artifact) => clone(artifact) as Artifact<T>);
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return [
    lookup.artifact_type,
    lookup.company_id ?? "",
    lookup.period_id ?? "",
  ].join(":");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
