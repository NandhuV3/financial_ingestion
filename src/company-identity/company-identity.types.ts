export type CompanyIdentityEvidence = {
  company: string;
  themes: string[];
  topics: string[];
  products: string[];
  customers: string[];
  risks: string[];
  opportunities: string[];
  narrative_summary?: string;
  filing_dates: string[];
};

export type CompanyIdentityEnrichmentMetadata = {
  model: string;
  generated_at: string;
  input_hash: string;
};

export type CompanyIdentityEnriched = {
  company: string;
  business_description: string;
  primary_products: string[];
  primary_customers: string[];
  revenue_drivers: string[];
  business_model_signals: string[];
  competitive_signals: string[];
  operating_signals: string[];
  enrichment: CompanyIdentityEnrichmentMetadata;
};

export type CompanyIdentityIntelligence = CompanyIdentityEnriched;
