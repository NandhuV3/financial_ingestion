import {
  TRUST_SIGNALS_CALIBRATION_VERSION,
} from "./calibration-contract.js";
import {
  TRUST_SIGNALS_RULE_VERSION,
  TRUST_SIGNALS_SCHEMA_VERSION,
} from "./contract.js";
import type {
  DepthIndicator,
  EnrichmentStatus,
  TrustSignal,
  TrustSignalsEvaluationHooks,
  TrustSignalsReplayabilityMetadata,
} from "./types.js";

export function buildTrustSignalsReplayability(input: {
  generatedAt: string;
  signals: TrustSignal[];
  enrichmentStatus: EnrichmentStatus;
  depthIndicator: DepthIndicator;
  evaluationHooks: TrustSignalsEvaluationHooks;
}): TrustSignalsReplayabilityMetadata {
  const sourcePairs = Object.values(input.enrichmentStatus)
    .filter((status) => status.available)
    .map((status) => ({
      ref: status.artifact_ref!,
      version: status.artifact_version!,
    }))
    .sort(
    (left, right) =>
      left.ref.localeCompare(right.ref) || left.version - right.version,
  );

  return {
    schema_version: TRUST_SIGNALS_SCHEMA_VERSION,
    generated_at: input.generatedAt,
    source_artifact_references: sourcePairs.map(({ ref }) => ref),
    source_artifact_versions: sourcePairs.map(({ version }) => version),
    source_record_references: sortedUnique(
      input.signals.flatMap((signal) => signal.source_record_refs),
    ),
    evidence_references: sortedUnique(
      input.signals.flatMap((signal) => signal.evidence_refs),
    ),
    enrichment_status: structuredClone(input.enrichmentStatus),
    depth_indicators: structuredClone(input.depthIndicator),
    evaluation_hooks: structuredClone(input.evaluationHooks),
    calibration_version: TRUST_SIGNALS_CALIBRATION_VERSION,
    rule_version: TRUST_SIGNALS_RULE_VERSION,
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
