export const EVIDENCE_CATALOG_BUILDER_TYPE = "evidence-catalog-builder";
export const EVIDENCE_CATALOG_BUILDER_VERSION = "evidence-catalog-builder-v1";
export const EVIDENCE_CATALOG_SCHEMA_VERSION = "evidence-catalog-artifact-v1";
export const EVIDENCE_CATALOG_PIPELINE_VERSION = "evidence-catalog-pipeline-v1";

export const EVIDENCE_CATALOG_SECTION_ORDER = [
  "management_discussion",
  "risk_factors",
] as const;

export type EvidenceSectionName =
  typeof EVIDENCE_CATALOG_SECTION_ORDER[number];

export const EVIDENCE_REFERENCE_PREFIX = "evidence:";
