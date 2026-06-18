import type { Artifact } from "../../contracts/artifacts/artifact.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { TRUST_SIGNALS_CALIBRATION } from "./calibration-contract.js";
import type { TrustPillarArtifactType } from "./contract.js";
import { ruleByRef } from "./rules.js";
import type {
  SourceArtifactReference,
  TrustSignal,
} from "./types.js";

export function sourceRef(artifact: Artifact<unknown>): SourceArtifactReference {
  const artifactType = artifact.identity.artifact_type;

  if (artifactType !== "commitment_tracking"
    && artifactType !== "narrative_consistency"
    && artifactType !== "accounting_stability"
    && artifactType !== "capital_allocation_tracking") {
    throw new BuilderValidationError(`Unsupported Trust Signal source artifact: ${artifactType}`);
  }

  return {
    artifact_id: artifact.identity.artifact_id,
    artifact_type: artifactType,
    artifact_version: artifact.identity.version,
  };
}

export function buildTrustSignal(params: {
  company_id: string;
  period_id: string;
  rule_ref: string;
  source_artifact: TrustPillarArtifactType;
  evidence_refs: string[];
  source_artifact_refs: SourceArtifactReference[];
  source_record_refs: string[];
  observation: string;
  confidence: number;
}): TrustSignal {
  const rule = ruleByRef(params.rule_ref);

  if (rule === null) {
    throw new BuilderValidationError(`Unknown Trust Signal rule: ${params.rule_ref}`);
  }

  if (rule.source_artifact !== params.source_artifact) {
    throw new BuilderValidationError(`Trust Signal rule ${params.rule_ref} cannot use ${params.source_artifact}.`);
  }

  const signal: Omit<TrustSignal, "signal_id"> = {
    signal_type: rule.signal_type,
    company_id: params.company_id,
    period_id: params.period_id,
    dimension: rule.dimension,
    severity: rule.severity,
    direction: rule.direction,
    observation: params.observation,
    evidence_refs: [...new Set(params.evidence_refs)],
    source_artifact_refs: params.source_artifact_refs,
    source_record_refs: [...new Set(params.source_record_refs)],
    source_artifact: params.source_artifact,
    rule_ref: params.rule_ref,
    confidence: clampConfidence(params.confidence),
    lifecycle: {
      status: rule.direction === "positive" ? "resolved" : rule.severity === "high" ? "escalated" : "active",
      first_seen_period: params.period_id,
      last_seen_period: params.period_id,
    },
  };

  return {
    ...signal,
    signal_id: stableSignalId(signal),
  };
}

function stableSignalId(signal: Omit<TrustSignal, "signal_id">): string {
  return [
    signal.company_id,
    signal.period_id,
    signal.rule_ref,
    signal.signal_type,
    signal.source_record_refs.join("."),
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

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return TRUST_SIGNALS_CALIBRATION.NON_FINITE_CONFIDENCE_FALLBACK;
  }

  return Math.max(0, Math.min(1, Number(value.toFixed(
    TRUST_SIGNALS_CALIBRATION.CONFIDENCE_ROUNDING_DECIMAL_PLACES,
  ))));
}
