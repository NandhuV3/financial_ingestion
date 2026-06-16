import type { TrustSignal } from "../trust-signals-builder/types.js";
import type { QuarterUnderstandingBuildContext, UnderstandingSeed } from "./types.js";

export function buildTrustInterpretations(context: QuarterUnderstandingBuildContext): UnderstandingSeed[] {
  const trustArtifact = context.trustSignalsArtifact;

  if (trustArtifact === null) {
    return [];
  }

  const signals = trustArtifact.content.trust_signals;

  if (signals.length === 0) {
    return [];
  }

  return [{
    category: "trust",
    title: "Trust observations require business-context interpretation",
    explanation: `Trust interpretation is limited to ${signals.length} trust observation(s) from available dimensions; missing dimensions are propagated from Trust Signals.`,
    importance: importanceFromTrustSignals(signals),
    direction: directionFromTrustSignals(signals),
    signal_refs: [],
    company_knowledge_refs: ["business_model"],
    trust_signal_refs: signals.map((signal) => signal.signal_id),
    topic_refs: [],
  }];
}

function importanceFromTrustSignals(signals: TrustSignal[]): "low" | "medium" | "high" {
  if (signals.some((signal) => signal.severity === "high")) {
    return "high";
  }

  if (signals.length > 0) {
    return "medium";
  }

  return "low";
}

function directionFromTrustSignals(signals: TrustSignal[]): "improving" | "stable" | "deteriorating" | "mixed" {
  const positive = signals.filter((signal) => signal.direction === "positive").length;
  const negative = signals.filter((signal) => signal.direction === "negative").length;

  if (positive > 0 && negative > 0) {
    return "mixed";
  }

  if (positive > 0) {
    return "improving";
  }

  if (negative > 0) {
    return "deteriorating";
  }

  return "stable";
}
