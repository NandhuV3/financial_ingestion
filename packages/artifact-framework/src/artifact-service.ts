import { createHash } from "node:crypto";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactRepository } from "./artifact-repository.js";
import type { ArtifactLookup, CreateArtifactParams, ReservedArtifactId } from "./artifact-types.js";
import { createArtifactId, nextArtifactVersion } from "./artifact-versioning.js";
import { validateArtifact } from "./artifact-validation.js";

export class ArtifactService {
  constructor(private readonly repository: ArtifactRepository) {}

  reserveArtifactId(): ReservedArtifactId {
    return createArtifactId() as ReservedArtifactId;
  }

  async createArtifact<T>(params: CreateArtifactParams<T>): Promise<Artifact<T>> {
    const current = await this.repository.getCurrent<unknown>(params);
    const version = nextArtifactVersion(current);
    const artifact: Artifact<T> = {
      identity: {
        artifact_id: params.artifact_id ?? createArtifactId(),
        artifact_type: params.artifact_type,
        company_id: params.company_id,
        period_id: params.period_id,
        version,
      },
      metadata: {
        version,
        schema_version: params.schema_version,
        pipeline_version: params.pipeline_version,
        generated_at: params.generated_at ?? new Date().toISOString(),
        artifact_hash: calculateArtifactHash(params.content),
        input_hash: params.input_hash,
        generation_duration_ms: params.generation_duration_ms,
        status: ArtifactStatus.ACTIVE,
      },
      lineage: params.lineage,
      content: params.content,
    };

    if (params.evaluation !== undefined) {
      artifact.evaluation = params.evaluation;
    }

    if (params.governance !== undefined) {
      artifact.governance = params.governance;
    }

    validateArtifact(artifact);
    await this.repository.create(artifact);

    return artifact;
  }

  async getArtifact<T>(artifactId: string): Promise<Artifact<T> | null> {
    return this.repository.getById<T>(artifactId);
  }

  async getCurrentArtifact<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    return this.repository.getCurrent<T>(lookup);
  }

  async getArtifactHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return this.repository.getHistory<T>(lookup);
  }
}

export function calculateArtifactHash(content: unknown): string {
  return createHash("sha256")
    .update(stableStringify(content), "utf8")
    .digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
