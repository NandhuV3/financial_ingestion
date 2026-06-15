import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactEvaluation } from "../../../contracts/artifacts/artifact-evaluation.js";
import type { ArtifactGovernance } from "../../../contracts/artifacts/artifact-governance.js";
import type { ArtifactLineage } from "../../../contracts/artifacts/artifact-lineage.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";

export type ArtifactLookup = {
  artifact_type: ArtifactType;
  company_id: string | null;
  period_id: string | null;
};

export type CreateArtifactParams<T> = ArtifactLookup & {
  content: T;
  lineage: ArtifactLineage;
  schema_version: string;
  pipeline_version: string;
  input_hash: string;
  generation_duration_ms: number;
  generated_at?: string;
  evaluation?: ArtifactEvaluation;
  governance?: ArtifactGovernance;
};

export type ArtifactRecord<T = unknown> = Artifact<T>;

