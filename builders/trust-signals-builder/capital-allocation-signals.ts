import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { TRUST_SIGNALS_CALIBRATION } from "./calibration-contract.js";
import { buildTrustSignal, sourceRef } from "./signal-factory.js";
import type {
  CapitalAllocationGapInput,
  TrustSignal,
  TrustSignalBuildContext,
} from "./types.js";

export function buildCapitalAllocationSignals(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.capitalAllocationTrackingArtifact;

  if (artifact === null) {
    return [];
  }

  return artifact.content.gaps
    .map((gap) => signalForGap(context, gap))
    .filter((signal): signal is TrustSignal => signal !== null);
}

function signalForGap(
  context: TrustSignalBuildContext,
  gap: CapitalAllocationGapInput,
): TrustSignal | null {
  const artifact = context.capitalAllocationTrackingArtifact;

  if (artifact === null) {
    throw new BuilderValidationError("Capital Allocation Tracking artifact is required for capital allocation signals.");
  }

  if (gap.evidence_refs.length === 0) {
    return null;
  }

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: ruleForGap(gap.gap_type),
    source_artifact: "capital_allocation_tracking",
    evidence_refs: gap.evidence_refs,
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [gap.gap_id],
    observation: `Capital allocation gap observed: ${gap.gap_type}.`,
    confidence: confidenceForGap(gap),
  });
}

function ruleForGap(gapType: CapitalAllocationGapInput["gap_type"]): string {
  switch (gapType) {
    case "aligned":
      return "trust_signals.capital_allocation.aligned";
    case "under_supported":
      return "trust_signals.capital_allocation.under_supported";
    case "unsupported_deployment":
      return "trust_signals.capital_allocation.unsupported_deployment";
    case "insufficient_evidence":
      return "trust_signals.capital_allocation.insufficient_evidence";
  }
}

function confidenceForGap(gap: CapitalAllocationGapInput): number {
  if (gap.evidence_refs.length >= TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_MULTI_EVIDENCE_MIN_REFS) {
    return TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_MULTI_EVIDENCE_CONFIDENCE;
  }

  if (gap.evidence_refs.length === TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_SINGLE_EVIDENCE_REFS) {
    return TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_SINGLE_EVIDENCE_CONFIDENCE;
  }

  return TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_NO_EVIDENCE_CONFIDENCE;
}
