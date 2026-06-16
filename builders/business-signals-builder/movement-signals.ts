import type { BusinessSignal, QuarterChangeInput, SignalBuildContext, TopicChangeInput } from "./types.js";
import { buildSignal, sourceRef } from "./signal-factory.js";

export function buildMovementSignals(context: SignalBuildContext): BusinessSignal[] {
  if (context.quarterChangeArtifact === null) {
    return [];
  }

  const source = sourceRef(context.quarterChangeArtifact);
  const changes = context.quarterChangeArtifact.content.changes ?? [];
  const topicChanges = context.quarterChangeArtifact.content.topic_changes ?? [];

  return [
    ...changes.map((change, index) => buildSignal({
      signal_type: signalTypeForQuarterChange(change),
      company_id: context.companyId,
      period_id: context.periodId,
      category: "strategic",
      direction: directionForQuarterChange(change),
      magnitude: magnitudeForQuarterChange(change),
      observation: `Quarter change observed: ${change.change_type} in ${change.category}`,
      evidence_refs: [`quarter_change.changes.${index}`],
      source_artifact_refs: [
        sourceRef(context.companyKnowledgeArtifact),
        source,
      ],
      rule_ref: "business_signals.movement.quarter_change_observed",
      company_knowledge_refs: ["strategic_priorities"],
      topic_refs: [],
      evidence_confidence: evidenceConfidenceForCounts(
        change.previous_evidence_count,
        change.current_evidence_count,
      ),
    })),
    ...topicChanges.map((change, index) => buildSignal({
      signal_type: signalTypeForTopicChange(change),
      company_id: context.companyId,
      period_id: context.periodId,
      category: "strategic",
      direction: directionForTopicChange(change),
      magnitude: magnitudeForTopicChange(change),
      observation: `Topic movement observed: ${change.change_type} for ${change.topic_id}`,
      evidence_refs: [`quarter_change.topic_changes.${index}`],
      source_artifact_refs: [
        sourceRef(context.companyKnowledgeArtifact),
        source,
      ],
      rule_ref: "business_signals.movement.topic_change_observed",
      company_knowledge_refs: ["strategic_priorities"],
      topic_refs: [change.topic_id],
      evidence_confidence: evidenceConfidenceForCounts(
        change.previous_evidence_count,
        change.current_evidence_count,
      ),
    })),
  ];
}

function signalTypeForQuarterChange(change: QuarterChangeInput): string {
  return change.change_type;
}

function signalTypeForTopicChange(change: TopicChangeInput): string {
  return change.change_type;
}

function directionForQuarterChange(change: QuarterChangeInput): BusinessSignal["direction"] {
  if (change.change_type === "REMOVED_CATEGORY"
    || change.change_type === "IMPORTANCE_DECREASED"
    || change.change_type === "EVIDENCE_DECREASED") {
    return "deteriorating";
  }

  return "improving";
}

function directionForTopicChange(change: TopicChangeInput): BusinessSignal["direction"] {
  if (change.change_type === "TOPIC_DISAPPEARED" || change.change_type === "TOPIC_WEAKENED") {
    return "deteriorating";
  }

  if (change.change_type === "TOPIC_PERSISTED" || change.change_type === "TOPIC_EVOLVED") {
    return "stable";
  }

  return "improving";
}

function magnitudeForQuarterChange(change: QuarterChangeInput): BusinessSignal["magnitude"] {
  return change.current_importance ?? change.previous_importance ?? "medium";
}

function magnitudeForTopicChange(change: TopicChangeInput): BusinessSignal["magnitude"] {
  return change.current_importance ?? change.previous_importance ?? "medium";
}

function evidenceConfidenceForCounts(previous: number, current: number): number {
  const observedEvidence = Math.max(previous, current);

  return observedEvidence > 0 ? 1 : 0;
}
