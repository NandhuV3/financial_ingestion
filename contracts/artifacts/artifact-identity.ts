import type { ArtifactType } from "./artifact-type.js";

export type ArtifactIdentity = {
  artifact_id: string;
  artifact_type: ArtifactType;
  company_id: string | null;
  period_id: string | null;
  version: number;
};

