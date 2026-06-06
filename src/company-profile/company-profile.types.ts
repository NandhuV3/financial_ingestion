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
  /** @deprecated Company Identity owns business descriptions. Preserved only for legacy artifact compatibility. */
  business_model: string;
  /** @deprecated Company Identity owns competitive signals. Preserved only for legacy artifact compatibility. */
  competitive_advantages: string[];
  /** @deprecated Company Identity owns customer value synthesis. Preserved only for legacy artifact compatibility. */
  customer_value_proposition: string;
  profile_quality: "enriched";
  enrichment: CompanyProfileEnrichmentMetadata;
};

export type CompanyProfileIntelligence = CompanyProfileRaw | CompanyProfileEnriched;
