export type BusinessSignalCategory =
  | "revenue"
  | "margin"
  | "growth"
  | "customer"
  | "product"
  | "competitive"
  | "dependency"
  | "operational"
  | "capital_allocation"
  | "management_commentary";

export type BusinessSignalDirection =
  | "positive"
  | "negative"
  | "neutral"
  | "emerging"
  | "weakening";

export type BusinessSignalMagnitude =
  | "low"
  | "medium"
  | "high";

export type BusinessSignalType =
  | "revenue_driver"
  | "customer_dependency"
  | "competitive_advantage"
  | "operating_dependency"
  | "topic_new"
  | "topic_intensified"
  | "topic_weakened"
  | "persistent_topic"
  | "strengthening_topic"
  | "dormant_topic";

export type BusinessSignalEvidence = {
  evidence_id: string;
  source: string;
  description: string;
  confidence?: number;
};

export type BusinessSignal = {
  signal_id: string;
  signal_type: BusinessSignalType;
  category: BusinessSignalCategory;
  summary: string;
  direction: BusinessSignalDirection;
  magnitude: BusinessSignalMagnitude;
  confidence: number;
  evidence: BusinessSignalEvidence[];
};

export type BusinessSignalArtifact = {
  company: string;

  /**
   * Reporting period owned by this artifact.
   * Example: "2026-Q1"
   */
  period: string;

  signals: BusinessSignal[];

  metadata: {
    schema_version: string;
    pipeline_version: string;
    signal_version: number;
    generated_at: string;
    input_hash: string;
  };

  lineage: {
    derived_from: {
      path: string;
      version: number;
      input_hash: string;
    }[];

    source_filings: {
      id: string;
      period: string;
      type: string;
    }[];

    model_version: string;
    prompt_version: string;
  };
};
