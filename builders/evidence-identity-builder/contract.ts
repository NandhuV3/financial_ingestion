export const EVIDENCE_IDENTITY_BUILDER_TYPE = "evidence-identity-builder";
export const EVIDENCE_IDENTITY_BUILDER_VERSION =
  "evidence-identity-builder-v1";
export const EVIDENCE_IDENTITY_SCHEMA_VERSION = "evidence-identity-v1";
export const EVIDENCE_IDENTITY_PIPELINE_VERSION =
  "evidence-identity-pipeline-v1";

export const EVIDENCE_IDENTITY_SECTION_ORDER = [
  "management_discussion",
  "risk_factors",
] as const;

export type EvidenceSectionName =
  typeof EVIDENCE_IDENTITY_SECTION_ORDER[number];

export const EVIDENCE_REFERENCE_PREFIX = "evidence:";
