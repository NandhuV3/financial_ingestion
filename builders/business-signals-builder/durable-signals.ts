import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { BusinessSignal, SignalBuildContext } from "./types.js";
import { buildSignal, sourceRef } from "./signal-factory.js";

export function buildDurableSignals(context: SignalBuildContext): BusinessSignal[] {
  const knowledge = context.companyKnowledgeArtifact.content.knowledge;
  const source = sourceRef(context.companyKnowledgeArtifact);

  return [
    buildSignal({
      signal_type: "REVENUE_MODEL_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "growth",
      direction: "stable",
      magnitude: "medium",
      observation: `Revenue structure observed: ${knowledge.revenue_structure.summary}`,
      evidence_refs: evidenceRefs("revenue_structure", knowledge.revenue_structure),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.revenue_structure_observed",
      company_knowledge_refs: ["revenue_structure"],
      topic_refs: [],
      evidence_confidence: knowledge.revenue_structure.confidence,
    }),
    ...knowledge.revenue_drivers.map((driver, index) => buildSignal({
      signal_type: "REVENUE_DRIVER_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "growth",
      direction: "stable",
      magnitude: "medium",
      observation: `Revenue driver observed: ${driver.driver}`,
      evidence_refs: evidenceRefs(`revenue_drivers.${index}`, driver),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.revenue_driver_observed",
      company_knowledge_refs: [`revenue_drivers.${index}`],
      topic_refs: [],
      evidence_confidence: driver.confidence,
    })),
    ...knowledge.products.map((product, index) => buildSignal({
      signal_type: "PRODUCT_OFFERING_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "product",
      direction: "stable",
      magnitude: product.importance,
      observation: `Product offering observed: ${product.product_name}`,
      evidence_refs: evidenceRefs(`products.${index}`, product),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.product_offering_observed",
      company_knowledge_refs: [`products.${index}`],
      topic_refs: [],
      evidence_confidence: product.confidence,
    })),
    ...knowledge.customers.map((customer, index) => buildSignal({
      signal_type: "CUSTOMER_SEGMENT_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "customer",
      direction: "stable",
      magnitude: "medium",
      observation: `Customer segment observed: ${customer.customer_segment}`,
      evidence_refs: evidenceRefs(`customers.${index}`, customer),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.customer_segment_observed",
      company_knowledge_refs: [`customers.${index}`],
      topic_refs: [],
      evidence_confidence: customer.confidence,
    })),
    ...knowledge.competitive_positioning.map((positioning, index) => buildSignal({
      signal_type: "COMPETITIVE_POSITION_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "competitive",
      direction: "stable",
      magnitude: "medium",
      observation: `Competitive position observed: ${positioning.positioning}`,
      evidence_refs: evidenceRefs(`competitive_positioning.${index}`, positioning),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.competitive_position_observed",
      company_knowledge_refs: [`competitive_positioning.${index}`],
      topic_refs: [],
      evidence_confidence: positioning.confidence,
    })),
    ...knowledge.strategic_priorities.map((priority, index) => buildSignal({
      signal_type: "STRATEGIC_PRIORITY_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "strategic",
      direction: "stable",
      magnitude: "medium",
      observation: `Strategic priority observed: ${priority.priority}`,
      evidence_refs: evidenceRefs(`strategic_priorities.${index}`, priority),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.strategic_priority_observed",
      company_knowledge_refs: [`strategic_priorities.${index}`],
      topic_refs: [],
      evidence_confidence: priority.confidence,
    })),
    ...knowledge.dependencies.map((dependency, index) => buildSignal({
      signal_type: "BUSINESS_DEPENDENCY_OBSERVED",
      company_id: context.companyId,
      period_id: context.periodId,
      category: "strategic",
      direction: "stable",
      magnitude: "medium",
      observation: `Business dependency observed: ${dependency.dependency}`,
      evidence_refs: evidenceRefs(`dependencies.${index}`, dependency),
      source_artifact_refs: [source],
      rule_ref: "business_signals.durable.business_dependency_observed",
      company_knowledge_refs: [`dependencies.${index}`],
      topic_refs: [],
      evidence_confidence: dependency.confidence,
    })),
  ];
}

function evidenceRefs(
  fieldPath: string,
  field: { supporting_periods: string[]; last_updated_period: string },
): string[] {
  const periods = field.supporting_periods.length > 0
    ? field.supporting_periods
    : [field.last_updated_period];

  return periods.map((period) => `company_knowledge.${fieldPath}:${period}`);
}
