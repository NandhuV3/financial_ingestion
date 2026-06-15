import type { ArtifactEvaluation } from "./artifact-evaluation.js";
import type { ArtifactGovernance } from "./artifact-governance.js";
import type { ArtifactIdentity } from "./artifact-identity.js";
import type { ArtifactLineage } from "./artifact-lineage.js";
import type { ArtifactMetadata } from "./artifact-metadata.js";

export type Artifact<T> = {
  identity: ArtifactIdentity;
  metadata: ArtifactMetadata;
  lineage: ArtifactLineage;
  content: T;
  evaluation?: ArtifactEvaluation;
  governance?: ArtifactGovernance;
};

