import type {
  StructuredIntelligence,
  StructuredIntelligenceGrounding,
  StructuredIntelligenceInput,
  StructuredIntelligenceMetadata,
  StructuredIntelligencePayload,
  StructuredIntelligenceStatus,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
} from "../../../contracts/company-intelligence/structured-intelligence-models.js";
import {
  validateStructuredIntelligenceOutput,
  validateStructuredIntelligencePayload,
} from "./validation.js";

/**
 * Deterministically constructs the canonical Structured Intelligence business
 * content from governed Prompt Framework output.
 *
 * This module copies and organizes output only. It does not reinterpret,
 * enrich, score, or derive new business conclusions.
 */
export function buildStructuredIntelligenceContent(input: {
  target: StructuredIntelligenceInput;
  payload: StructuredIntelligencePayload;
}): StructuredIntelligence {
  validateStructuredIntelligencePayload(input.payload);

  const content: StructuredIntelligence = {
    artifact_type: "structured_intelligence",
    company_id: input.target.company_id,
    period_id: input.target.period_id,
    filing_id: input.target.filing_id,
    metadata: buildStructuredIntelligenceMetadata(input.payload),
    payload: cloneStructuredIntelligencePayload(input.payload),
  };

  validateStructuredIntelligenceOutput(content);

  return content;
}

export function buildStructuredIntelligenceMetadata(
  payload: StructuredIntelligencePayload,
): StructuredIntelligenceMetadata {
  return {
    schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
    status: structuredIntelligenceStatus(payload),
    business_scope: STRUCTURED_INTELLIGENCE_BUSINESS_SCOPE,
    evidence_summary: {
      evidence_reference_count: uniqueEvidenceReferences(payload).size,
      theme_reference_count: uniqueThemeReferences(payload).size,
    },
  };
}

function structuredIntelligenceStatus(
  payload: StructuredIntelligencePayload,
): StructuredIntelligenceStatus {
  const populatedSectionCount = [
    payload.business_model,
    payload.products,
    payload.customers,
    payload.revenue_model,
    payload.revenue_drivers,
    payload.competitive_positioning,
    payload.strategic_priorities,
    payload.management_focus,
    payload.risks,
    payload.dependencies,
  ].filter(sectionPopulated).length;

  if (populatedSectionCount === 0) {
    return "insufficient_filing";
  }

  return populatedSectionCount === 10 ? "complete" : "partial";
}

function sectionPopulated(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
}

function uniqueEvidenceReferences(
  payload: StructuredIntelligencePayload,
): Set<string> {
  const references = new Set<string>();

  for (const grounding of groundedValues(payload)) {
    grounding.evidence.forEach((evidence) => {
      references.add(evidence.evidence_ref);
    });
  }

  return references;
}

function uniqueThemeReferences(
  payload: StructuredIntelligencePayload,
): Set<string> {
  const references = new Set<string>();

  for (const grounding of groundedValues(payload)) {
    grounding.evidence.forEach((evidence) => {
      evidence.theme_ids.forEach((themeId) => references.add(themeId));
    });
  }

  return references;
}

function groundedValues(
  payload: StructuredIntelligencePayload,
): StructuredIntelligenceGrounding[] {
  const values: StructuredIntelligenceGrounding[] = [];

  if (payload.business_model !== null) {
    values.push(payload.business_model);
  }

  values.push(...payload.products);
  values.push(...payload.customers);

  if (payload.revenue_model !== null) {
    values.push(payload.revenue_model);
  }

  values.push(...payload.revenue_drivers);
  values.push(...payload.competitive_positioning);
  values.push(...payload.strategic_priorities);
  values.push(...payload.management_focus);
  values.push(...payload.risks);
  values.push(...payload.dependencies);

  return values;
}

function cloneStructuredIntelligencePayload(
  payload: StructuredIntelligencePayload,
): StructuredIntelligencePayload {
  return {
    business_model: payload.business_model === null
      ? null
      : {
        ...payload.business_model,
        evidence: cloneEvidence(payload.business_model),
      },
    products: payload.products.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    customers: payload.customers.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    revenue_model: payload.revenue_model === null
      ? null
      : {
        ...payload.revenue_model,
        recurring_components: [...payload.revenue_model.recurring_components],
        transactional_components: [
          ...payload.revenue_model.transactional_components,
        ],
        evidence: cloneEvidence(payload.revenue_model),
      },
    revenue_drivers: payload.revenue_drivers.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    competitive_positioning: payload.competitive_positioning.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    strategic_priorities: payload.strategic_priorities.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    management_focus: payload.management_focus.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    risks: payload.risks.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
    dependencies: payload.dependencies.map((item) => ({
      ...item,
      evidence: cloneEvidence(item),
    })),
  };
}

function cloneEvidence(value: StructuredIntelligenceGrounding) {
  return value.evidence.map((evidence) => ({
    ...evidence,
    theme_ids: [...evidence.theme_ids],
  }));
}
