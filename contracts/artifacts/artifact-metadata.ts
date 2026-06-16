import type { ArtifactStatus } from "./artifact-status.js";

export type ArtifactMetadata = {
  version: number;
  schema_version: string;
  pipeline_version: string;
  generated_at: string;
  artifact_hash: string;
  input_hash: string;
  generation_duration_ms: number;
  status: ArtifactStatus;
};

