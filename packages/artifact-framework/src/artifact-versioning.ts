import { randomUUID } from "node:crypto";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";

export function nextArtifactVersion(current: Artifact<unknown> | null): number {
  if (current === null) {
    return 1;
  }

  return current.identity.version + 1;
}

export function createArtifactId(): string {
  return randomUUID();
}

