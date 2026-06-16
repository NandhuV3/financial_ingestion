import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
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

  return [...artifact.content.gaps ?? []].map((gap) => signalForGap(context, gap));
}

function signalForGap(context: TrustSignalBuildContext, gap: CapitalAllocationGapInput): TrustSignal {
  const artifact = context.capitalAllocationTrackingArtifact;

  if (artifact === null) {
    throw new BuilderValidationError("Capital Allocation Tracking artifact is required for capital allocation signals.");
  }

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: ruleForGap(gap.gap_type),
    source_artifact: "capital_allocation_tracking",
    evidence_refs: gap.evidence_refs.length > 0 ? gap.evidence_refs : [`capital_allocation_gap:${gap.gap_id}`],
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
  if (gap.evidence_refs.length >= 2) {
    return 0.85;
  }

  if (gap.evidence_refs.length === 1) {
    return 0.7;
  }

  return 0.5;
}
