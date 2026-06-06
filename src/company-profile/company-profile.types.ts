export type CompanyProfileRaw = {
  company: string;
  products: string[];
  customers: string[];
  business_risks: string[];
  themes: string[];
  topics: string[];
  source_filings: string[];
  profile_quality: "raw";
};

export type CompanyProfileEnrichmentMetadata = {
  model: string;
  generated_at: string;
  input_hash: string;
};

export type CompanyProfileEnriched = Omit<CompanyProfileRaw, "profile_quality"> & {
  business_model: string;
  competitive_advantages: string[];
  customer_value_proposition: string;
  profile_quality: "enriched";
  enrichment: CompanyProfileEnrichmentMetadata;
};

export type CompanyProfileIntelligence = CompanyProfileRaw | CompanyProfileEnriched;
