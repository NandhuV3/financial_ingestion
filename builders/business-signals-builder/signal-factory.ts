import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type {
  BusinessSignal,
  SourceArtifactReference,
} from "./types.js";

export function sourceRef(
  artifact: Artifact<CompanyKnowledgeArtifactContent>,
): SourceArtifactReference;
export function sourceRef(
  artifact: Artifact<unknown>,
): SourceArtifactReference;
export function sourceRef(artifact: Artifact<unknown>): SourceArtifactReference {
  const artifactType = artifact.identity.artifact_type;

  if (artifactType !== "company_knowledge"
    && artifactType !== "quarter_change"
    && artifactType !== "topic_evolution") {
    throw new BuilderValidationError(`Unsupported Business Signal source artifact: ${artifactType}`);
  }

  return {
    artifact_id: artifact.identity.artifact_id,
    artifact_type: artifactType,
    artifact_version: artifact.identity.version,
  };
}

export function buildSignal(params: Omit<BusinessSignal, "signal_id">): BusinessSignal {
  return {
    ...params,
    signal_id: stableSignalId(params),
  };
}

function stableSignalId(signal: Omit<BusinessSignal, "signal_id">): string {
  return [
    signal.company_id,
    signal.period_id,
    signal.rule_ref,
    signal.signal_type,
    signal.company_knowledge_refs.join("."),
    signal.topic_refs.join("."),
  ]
    .map((part) => normalizeIdPart(part))
    .filter(Boolean)
    .join(":");
}

function normalizeIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
