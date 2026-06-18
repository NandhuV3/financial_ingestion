import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { TRUST_SIGNALS_CALIBRATION } from "./calibration-contract.js";
import type { TrustDimension } from "./contract.js";
import type { DepthIndicator, EnrichmentInputStatus, EnrichmentStatus } from "./types.js";

export function buildTrustEnrichmentStatus(dependencies: {
  commitment_tracking?: Artifact<unknown>;
  narrative_consistency?: Artifact<unknown>;
  accounting_stability?: Artifact<unknown>;
  capital_allocation_tracking?: Artifact<unknown>;
}): EnrichmentStatus {
  return {
    commitment_tracking: statusFor(dependencies.commitment_tracking, "Commitment Tracking pillar was not provided."),
    narrative_consistency: statusFor(dependencies.narrative_consistency, "Narrative Consistency pillar was not provided."),
    accounting_stability: statusFor(dependencies.accounting_stability, "Accounting Stability pillar was not provided."),
    capital_allocation_tracking: statusFor(
      dependencies.capital_allocation_tracking,
      "Capital Allocation Tracking pillar was not provided.",
    ),
  };
}

export function buildTrustDepthIndicator(enrichmentStatus: EnrichmentStatus): DepthIndicator {
  const availableCount = availablePillarCount(enrichmentStatus);

  return {
    overall: availableCount === TRUST_SIGNALS_CALIBRATION.SUPPORTED_PILLAR_COUNT
      ? "full"
      : availableCount >= TRUST_SIGNALS_CALIBRATION.STANDARD_DEPTH_MIN_PILLAR_COUNT ? "standard" : "base",
    commitment_dimension: enrichmentStatus.commitment_tracking.available ? "present" : "absent",
    narrative_dimension: enrichmentStatus.narrative_consistency.available ? "present" : "absent",
    explanation_dimension: enrichmentStatus.narrative_consistency.available ? "present" : "absent",
    accounting_dimension: enrichmentStatus.accounting_stability.available ? "present" : "absent",
    capital_allocation_dimension: enrichmentStatus.capital_allocation_tracking.available ? "present" : "absent",
  };
}

export function buildMissingDimensions(enrichmentStatus: EnrichmentStatus): TrustDimension[] {
  const missing: TrustDimension[] = [];

  if (!enrichmentStatus.commitment_tracking.available) {
    missing.push("commitment_follow_through");
  }

  if (!enrichmentStatus.narrative_consistency.available) {
    missing.push("narrative_consistency", "explanation_quality");
  }

  if (!enrichmentStatus.accounting_stability.available) {
    missing.push("accounting_stability");
  }

  if (!enrichmentStatus.capital_allocation_tracking.available) {
    missing.push("capital_allocation_consistency");
  }

  return missing;
}

export function availablePillarCount(enrichmentStatus: EnrichmentStatus): number {
  return [
    enrichmentStatus.commitment_tracking,
    enrichmentStatus.narrative_consistency,
    enrichmentStatus.accounting_stability,
    enrichmentStatus.capital_allocation_tracking,
  ].filter((status) => status.available).length;
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
