import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";

export type BuilderDefinition = {
  builder_type: string;
  artifact_type: ArtifactType;
  version: string;
  schema_version: string;
  pipeline_version: string;
};

