import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { DepthIndicator as QuarterUnderstandingDepthIndicator } from "../quarter-understanding-builder/types.js";
import type { DepthIndicator, EnrichmentInputStatus, EnrichmentStatus } from "./types.js";

export function buildInvestorEnrichmentStatus(dependencies: {
  business_signals?: Artifact<unknown>;
  trust_signals?: Artifact<unknown>;
  commitment_tracking?: Artifact<unknown>;
  topic_evolution?: Artifact<unknown>;
  prior_investor_intelligence?: Artifact<unknown>;
  market_data?: Artifact<unknown>;
}): EnrichmentStatus {
  return {
    business_signals: statusFor(dependencies.business_signals, "Business Signals enrichment was not provided."),
    trust_signals: statusFor(dependencies.trust_signals, "Trust Signals enrichment was not provided."),
    commitment_tracking: statusFor(dependencies.commitment_tracking, "Commitment Tracking enrichment was not provided."),
    topic_evolution: statusFor(dependencies.topic_evolution, "Topic Evolution enrichment was not provided."),
    prior_investor_intelligence: statusFor(
      dependencies.prior_investor_intelligence,
      "Prior Investor Intelligence enrichment was not provided.",
    ),
    market_data: statusFor(dependencies.market_data, "Market Data enrichment is not integrated in Sprint 11."),
  };
}

export function buildInvestorDepthIndicator(
  enrichmentStatus: EnrichmentStatus,
  quarterUnderstandingDepth: QuarterUnderstandingDepthIndicator,
): DepthIndicator {
  const availableCount = Object.values(enrichmentStatus).filter((status) => status.available).length;

  return {
    overall: depthLevel(availableCount),
    trust_dimension: quarterUnderstandingDepth.trust_dimension,
    longitudinal_dimension: quarterUnderstandingDepth.longitudinal_dimension,
  };
}

function depthLevel(availableCount: number): DepthIndicator["overall"] {
  if (availableCount === 0) {
    return "base";
  }

  if (availableCount === 6) {
    return "full";
  }

  return "standard";
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
