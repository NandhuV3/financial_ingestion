import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { buildTrustSignal, sourceRef } from "./signal-factory.js";
import type {
  PolicyChangeInput,
  RestatementInput,
  SegmentChangeInput,
  TrustSignal,
  TrustSignalBuildContext,
} from "./types.js";

export function buildAccountingSignals(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.accountingStabilityArtifact;

  if (artifact === null) {
    return [];
  }

  return [
    ...artifact.content.policy_changes.map((change) => policyChangeSignal(context, change)),
    ...artifact.content.segment_changes.map((change) => segmentChangeSignal(context, change)),
    ...artifact.content.restatements.map((restatement) => restatementSignal(context, restatement)),
    ...nonGaapSignal(context),
  ];
}

function policyChangeSignal(context: TrustSignalBuildContext, change: PolicyChangeInput): TrustSignal {
  const artifact = requireArtifact(context);

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: "trust_signals.accounting.policy_changed",
    source_artifact: "accounting_stability",
    evidence_refs: change.evidence_refs,
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [change.policy_change_id],
    observation: `Accounting policy change observed with ${change.comparability_impact} comparability impact.`,
    confidence: change.confidence,
  });
}

function segmentChangeSignal(context: TrustSignalBuildContext, change: SegmentChangeInput): TrustSignal {
  const artifact = requireArtifact(context);
  const ruleRef = change.change_type === "restructured"
    ? "trust_signals.accounting.segment_restructured"
    : "trust_signals.accounting.segment_redefined";

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: ruleRef,
    source_artifact: "accounting_stability",
    evidence_refs: change.evidence_refs,
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [change.segment_change_id],
    observation: `Segment reporting change observed: ${change.change_type}.`,
    confidence: change.confidence,
  });
}

function restatementSignal(context: TrustSignalBuildContext, restatement: RestatementInput): TrustSignal {
  const artifact = requireArtifact(context);

  return buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: "trust_signals.accounting.restatement_issued",
    source_artifact: "accounting_stability",
    evidence_refs: restatement.evidence_refs,
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: [restatement.restatement_id],
    observation: `Restatement observed with ${restatement.materiality} materiality.`,
    confidence: restatement.confidence,
  });
}

function nonGaapSignal(context: TrustSignalBuildContext): TrustSignal[] {
  const artifact = context.accountingStabilityArtifact;
  const direction = artifact?.content.non_gaap_analysis?.trend_assessment.direction;

  if (artifact === null || artifact === undefined || direction === undefined || direction === "stable") {
    return [];
  }

  return [buildTrustSignal({
    company_id: context.companyId,
    period_id: context.periodId,
    rule_ref: direction === "widening"
      ? "trust_signals.accounting.non_gaap_widening"
      : "trust_signals.accounting.non_gaap_narrowing",
    source_artifact: "accounting_stability",
    evidence_refs: artifact.content.non_gaap_analysis!.periods.flatMap(
      (period) => period.evidence_refs,
    ),
    source_artifact_refs: [sourceRef(artifact)],
    source_record_refs: ["non_gaap_analysis"],
    observation: `Non-GAAP gap trend observed as ${direction}.`,
    confidence: artifact.content.non_gaap_analysis!.confidence,
  })];
}

function requireArtifact(context: TrustSignalBuildContext) {
  if (context.accountingStabilityArtifact === null) {
    throw new BuilderValidationError("Accounting Stability artifact is required for accounting signals.");
  }

  return context.accountingStabilityArtifact;
}
