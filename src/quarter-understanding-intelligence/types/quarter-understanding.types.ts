// src/quarter-understanding/types/quarter-understanding.types.ts

export type UnderstandingCategory =
  | "revenue"
  | "growth"
  | "margin"
  | "customer"
  | "product"
  | "competitive"
  | "dependency"
  | "operational"
  | "capital_allocation"
  | "management_commentary";

export type UnderstandingImportance =
  | "low"
  | "medium"
  | "high";

export type SourceReliability =
  | "high"
  | "medium"
  | "low";

export type SignalAgreement =
  | "corroborating"
  | "mixed"
  | "conflicting";

export type CompanyKnowledgeAlignment =
  | "consistent"
  | "inconsistent"
  | "not_applicable";

export type UnderstandingConfidence = {
  score: number;

  evidence_count: number;

  source_reliability: SourceReliability;

  signal_agreement: SignalAgreement;

  company_knowledge_alignment: CompanyKnowledgeAlignment;
};

export type SignalReference = {
  signal_id: string;

  period: string;

  artifact_path: string;

  input_hash: string;
};

export type CompanyKnowledgeReference = {
  artifact_path: string;

  version: number;

  input_hash: string;
};

export type UnderstandingEvidence = {
  signal_refs: SignalReference[];

  company_knowledge_ref: CompanyKnowledgeReference | null;

  /**
   * Human-readable snapshot of evidence used
   * during interpretation.
   *
   * Not authoritative.
   * References remain authoritative.
   */
  evidence_context: string;
};

export type BusinessKey = {
  company: string;

  category: UnderstandingCategory;

  /**
   * Stable cross-quarter topic.
   *
   * Usually mirrors semantic_anchor_key.
   */
  topic: string;
};

export type QuarterUnderstanding = {
  /**
   * Unique identifier for this understanding.
   */
  understanding_id: string;

  /**
   * Stable cross-quarter identity.
   *
   * Examples:
   * - cloud_demand
   * - ai_infrastructure
   * - customer_concentration
   */
  semantic_anchor_key: string;

  /**
   * Stable grouping key for longitudinal,
   * narrative, and owner-question intelligence.
   */
  business_key?: BusinessKey;

  category: UnderstandingCategory;

  summary: string;

  importance: UnderstandingImportance;

  confidence: UnderstandingConfidence;

  evidence: UnderstandingEvidence;

  /**
   * Reserved for future replacement tracking.
   */
  supersedes?: string;
};

export type QuarterUnderstandingMetadata = {
  schema_version: string;

  pipeline_version: string;

  model_version: string;

  prompt_version: string;

  generated_at: string;

  understanding_version: number;

  input_hash: string;
};

export type DerivedFromArtifact = {
  path: string;

  version: number;

  input_hash: string;
};

export type SourceFilingReference = {
  id: string;

  period: string;

  type: string;
};

export type QuarterUnderstandingLineage = {
  derived_from: DerivedFromArtifact[];

  source_filings: SourceFilingReference[];
};

export type QuarterUnderstandingArtifact = {
  company: string;

  /**
   * Reporting period owned by this artifact.
   *
   * Example:
   * "2026-Q1"
   */
  period: string;

  understandings: QuarterUnderstanding[];

  metadata: QuarterUnderstandingMetadata;

  lineage: QuarterUnderstandingLineage;
};