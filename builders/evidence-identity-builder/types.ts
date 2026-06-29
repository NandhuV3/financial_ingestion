import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";

export type EvidenceIdentityBuilderInput = {
  filing_artifact: FilingArtifactContent;
};

export type EvidenceIdentityDependencies = {
  filing: Artifact<FilingArtifactContent>;
};
