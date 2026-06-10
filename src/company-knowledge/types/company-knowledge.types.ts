export type CompanyKnowledgeRevenueStructure =
  | "recurring"
  | "transactional"
  | "project"
  | "mixed";

export type CompanyKnowledgeBusinessModel = {
  value_creation: string;
  monetization: string;
  revenue_structure: CompanyKnowledgeRevenueStructure;
};

export type CompanyKnowledgeCompetitivePositioning = {
  signal: string;
  source_type: "claimed" | "observed";
};

export type CompanyKnowledgeDependency = {
  description: string;
  type:
    | "supplier"
    | "platform"
    | "technology"
    | "customer"
    | "regulatory";
};

export type CompanyKnowledge = {
  company: string;
  business_description: string;
  business_model: CompanyKnowledgeBusinessModel;
  products: string[];
  customers: string[];
  revenue_drivers: string[];
  competitive_positioning: CompanyKnowledgeCompetitivePositioning[];
  operating_model: string[];
  key_dependencies: CompanyKnowledgeDependency[];
  // confidence_score: number;
  confidence: {
    overall: number;
    filing_depth: number;
    field_coverage: number;
  }
  metadata: {
    schema_version: string;
    pipeline_version: string;
    knowledge_version: number;
    generated_at: string;
    input_hash: string;
  };
  lineage: {
    // source_filings: string[];
    source_filings: {
      id: string;
      period: string;
      type: string;
    }[]
    derived_from: string[];
    model_version: string;
    prompt_version: string;
  };
};
