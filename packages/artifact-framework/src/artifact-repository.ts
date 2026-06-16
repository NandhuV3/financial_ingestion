import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactLookup } from "./artifact-types.js";

export interface ArtifactRepository {
  create<T>(artifact: Artifact<T>): Promise<void>;

  getById<T>(artifactId: string): Promise<Artifact<T> | null>;

  getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null>;

  getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]>;
}

