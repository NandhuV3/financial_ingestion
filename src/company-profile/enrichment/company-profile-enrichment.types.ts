import type { CompanyProfileEnriched, CompanyProfileRaw } from "../company-profile.types.js";

export type CompanyProfileEnrichmentFields = {
  /** @deprecated Company Identity owns business descriptions. */
  business_model: string;
  /** @deprecated Company Identity owns competitive signals. */
  competitive_advantages: string[];
  /** @deprecated Company Identity owns customer value synthesis. */
  customer_value_proposition: string;
};

export type CompanyProfileEnrichmentPromptInput = {
  raw_profile: CompanyProfileRaw;
};

export type CompanyProfileEnrichmentDecision = {
  shouldGenerate: boolean;
  status: "generated" | "skipped";
  reason: "raw_profile_changed" | "raw_profile_unchanged" | "identity_owns_business_understanding";
};

export type CompanyProfileEnrichmentReport = {
  status: CompanyProfileEnrichmentDecision["status"];
  reason: CompanyProfileEnrichmentDecision["reason"];
  model: string;
  input_hash: string;
  generated_at: string;
};

export type CompanyProfileEnrichmentClient = (params: {
  model: string;
  systemPrompt: string;
  prompt: string;
  schema: object;
}) => Promise<CompanyProfileEnrichmentFields>;

export type CompanyProfileEnrichmentResult = {
  report: CompanyProfileEnrichmentReport;
  profile: CompanyProfileEnriched | CompanyProfileRaw;
};
