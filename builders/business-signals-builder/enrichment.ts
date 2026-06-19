import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { DepthIndicator, EnrichmentInputStatus, EnrichmentStatus } from "./types.js";

export function buildEnrichmentStatus(dependencies: {
  quarter_change?: Artifact<unknown>;
  topic_evolution?: Artifact<unknown>;
  transcript_signals?: Artifact<unknown>;
  market_context?: Artifact<unknown>;
  industry_context?: Artifact<unknown>;
}): EnrichmentStatus {
  return {
    quarter_change: statusFor(dependencies.quarter_change, "Quarter Change enrichment was not provided."),
    topic_evolution: statusFor(dependencies.topic_evolution, "Topic Evolution enrichment was not provided."),
    transcript_signals: statusFor(dependencies.transcript_signals, "Transcript Signals enrichment was not provided."),
    market_context: statusFor(dependencies.market_context, "Market Context enrichment was not provided."),
    industry_context: statusFor(dependencies.industry_context, "Industry Context enrichment was not provided."),
  };
}

export function buildDepthIndicator(enrichmentStatus: EnrichmentStatus): DepthIndicator {
  const quarterChangeAvailable = enrichmentStatus.quarter_change.available;
  const topicEvolutionAvailable = enrichmentStatus.topic_evolution.available;

  if (!quarterChangeAvailable && !topicEvolutionAvailable) {
    return {
      overall: "base",
    };
  }

  if (quarterChangeAvailable && topicEvolutionAvailable) {
    return {
      overall: "full",
    };
  }

  return {
    overall: "standard",
  };
}

function statusFor(artifact: Artifact<unknown> | undefined, absentReason: string): EnrichmentInputStatus {
  if (artifact === undefined) {
    return {
      available: false,
      artifact_ref: null,
      artifact_version: null,
      absent_reason: absentReason,
    };
  }

  return {
    available: true,
    artifact_ref: artifact.identity.artifact_id,
    artifact_version: artifact.identity.version,
    absent_reason: null,
  };
}
