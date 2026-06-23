import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../contracts/artifacts/filing-artifact-content.js";

export type EvidenceCatalogBuilderInput = {
  filing_artifact: FilingArtifactContent;
};

export type EvidenceCatalogDependencies = {
  filing: Artifact<FilingArtifactContent>;
};
