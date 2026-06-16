import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { DepthIndicator, EnrichmentInputStatus, EnrichmentStatus } from "./types.js";

export function buildQuarterUnderstandingEnrichmentStatus(dependencies: {
  trust_signals?: Artifact<unknown>;
  topic_evolution?: Artifact<unknown>;
  concept_registry?: Artifact<unknown>;
}): EnrichmentStatus {
  return {
    trust_signals: statusFor(dependencies.trust_signals, "Trust Signals enrichment was not provided."),
    topic_evolution: statusFor(dependencies.topic_evolution, "Topic Evolution enrichment was not provided."),
    concept_registry: statusFor(dependencies.concept_registry, "Concept Registry enrichment was not provided."),
  };
}

export function buildQuarterUnderstandingDepthIndicator(enrichmentStatus: EnrichmentStatus): DepthIndicator {
  const enrichmentCount = [
    enrichmentStatus.trust_signals,
    enrichmentStatus.topic_evolution,
    enrichmentStatus.concept_registry,
  ].filter((status) => status.available).length;

  return {
    overall: enrichmentCount === 0 ? "base" : enrichmentCount === 3 ? "full" : "standard",
    trust_dimension: enrichmentStatus.trust_signals.available ? "present" : "absent",
    longitudinal_dimension: enrichmentStatus.topic_evolution.available ? "present" : "absent",
  };
}

function statusFor(artifact: Artifact<unknown> | undefined, absentReason: string): EnrichmentInputStatus {
  if (artifact === undefined) {
    return {
      available: false,
      artifact_path: null,
      artifact_version: null,
      absent_reason: absentReason,
    };
  }

  return {
    available: true,
    artifact_path: artifact.identity.artifact_id,
    artifact_version: artifact.identity.version,
    absent_reason: null,
  };
}
