import { TRUST_SIGNALS_CALIBRATION } from "./calibration-contract.js";
import { buildTrustSignal, sourceRef } from "./signal-factory.js";
import type {
  CommitmentInput,
  TrustSignal,
  TrustSignalBuildContext,
} from "./types.js";

export function buildCommitmentSignals(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.commitmentTrackingArtifact;

  if (artifact === null) {
    return [];
  }

  return [...artifact.content.commitments ?? []]
    .map((commitment) => signalForCommitment(context, commitment))
    .filter((signal): signal is TrustSignal => signal !== null);
}

function signalForCommitment(
  context: TrustSignalBuildContext,
  commitment: CommitmentInput,
): TrustSignal | null {
  const artifact = context.commitmentTrackingArtifact;

  if (artifact === null) {
    return null;
  }

  const ruleRef = ruleForStatus(commitment.status);

  if (ruleRef === null) {
    return null;
  }

  const evidenceRefs = evidenceRefsForCommitment(commitment);

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: ruleRef,
    source_artifact: "commitment_tracking",
    evidence_refs: evidenceRefs,
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [commitment.commitment_id],
    observation: `Commitment status observed: ${commitment.status}.`,
    confidence: averageConfidence([
      commitment.confidence,
      ...[...commitment.evidence ?? []].map((evidence) => evidence.confidence),
    ]),
  });
}

function ruleForStatus(status: CommitmentInput["status"]): string | null {
  switch (status) {
    case "new":
      return "trust_signals.commitment.created";
    case "achieved":
    case "fulfilled":
      return "trust_signals.commitment.fulfilled";
    case "delayed":
      return "trust_signals.commitment.delayed";
    case "overdue":
      return "trust_signals.commitment.overdue";
    case "modified":
      return "trust_signals.commitment.modified";
    case "abandoned":
      return "trust_signals.commitment.abandoned";
    default:
      return null;
  }
}

function evidenceRefsForCommitment(commitment: CommitmentInput): string[] {
  const refs = [...commitment.evidence ?? []].map((evidence) => evidence.evidence_id);

  return refs.length > 0 ? refs : [`commitment:${commitment.commitment_id}`];
}

function averageConfidence(values: Array<number | undefined>): number {
  const validValues = values.filter((value): value is number => Number.isFinite(value));

  if (validValues.length === 0) {
    return TRUST_SIGNALS_CALIBRATION.COMMITMENT_CONFIDENCE_FALLBACK;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
