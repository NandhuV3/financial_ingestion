import { directionFromSignals, importanceFromSignals } from "./business-interpretation.js";
import type { QuarterUnderstandingBuildContext, UnderstandingSeed } from "./types.js";

export function buildOperationalInterpretations(context: QuarterUnderstandingBuildContext): UnderstandingSeed[] {
  const operationalSignals = context.businessSignalsArtifact.content.signals.filter((signal) =>
    signal.category === "margin" || signal.category === "product");
  const dependencies = context.companyKnowledgeArtifact.content.knowledge.dependencies;

  if (operationalSignals.length === 0 && dependencies.length === 0) {
    return [];
  }

  return [{
    category: "operations",
    title: "Operational signals show execution pressure and capacity",
    explanation: `Operational interpretation uses ${operationalSignals.length} operational observation(s) and ${dependencies.length} durable dependency record(s).`,
    importance: importanceFromSignals(operationalSignals),
    direction: directionFromSignals(operationalSignals),
    signal_refs: operationalSignals.map((signal) => signal.signal_id),
    company_knowledge_refs: dependencies.map((_, index) => `dependencies.${index}`),
    trust_signal_refs: [],
    topic_refs: [],
  }];
}
