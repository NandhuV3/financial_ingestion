import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { buildTrustSignal, sourceRef } from "./signal-factory.js";
import type {
  LanguageShiftInput,
  StrategicPriorityInput,
  TrustSignal,
  TrustSignalBuildContext,
} from "./types.js";

export function buildNarrativeSignals(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.narrativeConsistencyArtifact;

  if (artifact === null) {
    return [];
  }

  return [
    ...[...artifact.content.strategic_priorities ?? []]
      .map((priority) => signalForPriority(context, priority))
      .filter((signal): signal is TrustSignal => signal !== null),
    ...[...artifact.content.language_shifts ?? []].map((shift) => signalForLanguageShift(context, shift)),
    ...stabilitySignals(context),
  ];
}

function signalForPriority(
  context: TrustSignalBuildContext,
  priority: StrategicPriorityInput,
): TrustSignal | null {
  const artifact = context.narrativeConsistencyArtifact;

  if (artifact === null) {
    return null;
  }

  const ruleRef = ruleForPriorityStatus(priority.current_status);

  if (ruleRef === null) {
    return null;
  }

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: ruleRef,
    source_artifact: "narrative_consistency",
    evidence_refs: [`priority:${priority.priority_id}`],
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [priority.priority_id],
    observation: `Strategic priority status observed: ${priority.current_status}.`,
    confidence: priority.confidence ?? artifact.content.confidence?.overall ?? 0.6,
  });
}

function signalForLanguageShift(
  context: TrustSignalBuildContext,
  shift: LanguageShiftInput,
): TrustSignal {
  const artifact = context.narrativeConsistencyArtifact;

  if (artifact === null) {
    throw new BuilderValidationError("Narrative Consistency artifact is required for language shift signals.");
  }

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: `trust_signals.narrative.language_shift_${shift.shift_magnitude}`,
    source_artifact: "narrative_consistency",
    evidence_refs: shift.supporting_evidence?.length ? shift.supporting_evidence : [`language_shift:${shift.shift_id}`],
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [shift.shift_id],
    observation: `Language shift observed: ${shift.shift_magnitude}.`,
    confidence: shift.confidence ?? artifact.content.confidence?.overall ?? 0.6,
  });
}

function stabilitySignals(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.narrativeConsistencyArtifact;

  if (artifact === null) {
    return [];
  }

  const stablePriorityRatio = artifact.content.summary?.stable_priority_ratio;

  if (!Number.isFinite(stablePriorityRatio)) {
    return [];
  }

  if ((stablePriorityRatio as number) >= 0.8) {
    return [buildTrustSignal({
      company_id: context.companyId,
      period_id: context.periodId,
      rule_ref: "trust_signals.narrative.stability_high",
      source_artifact: "narrative_consistency",
      evidence_refs: ["narrative_summary.stable_priority_ratio"],
      source_artifact_refs: [sourceRef(artifact)],
      source_record_refs: ["narrative_summary"],
      observation: "Narrative stability ratio observed as high.",
      confidence: artifact.content.confidence?.overall ?? 0.7,
    })];
  }

  if ((stablePriorityRatio as number) <= 0.4) {
    return [buildTrustSignal({
      company_id: context.companyId,
      period_id: context.periodId,
      rule_ref: "trust_signals.narrative.stability_low",
      source_artifact: "narrative_consistency",
      evidence_refs: ["narrative_summary.stable_priority_ratio"],
      source_artifact_refs: [sourceRef(artifact)],
      source_record_refs: ["narrative_summary"],
      observation: "Narrative stability ratio observed as low.",
      confidence: artifact.content.confidence?.overall ?? 0.7,
    })];
  }

  return [];
}

function ruleForPriorityStatus(status: StrategicPriorityInput["current_status"]): string | null {
  switch (status) {
    case "new":
      return "trust_signals.narrative.priority_created";
    case "dropped":
      return "trust_signals.narrative.priority_dropped";
    case "reintroduced":
      return "trust_signals.narrative.priority_reintroduced";
    default:
      return null;
  }
}
