import type { CompanyProfileEnriched, CompanyProfileRaw } from "../company-profile.types.js";

export type CompanyProfileEnrichmentFields = {
  business_model: string;
  competitive_advantages: string[];
  customer_value_proposition: string;
};

export type CompanyProfileEnrichmentPromptInput = {
  raw_profile: CompanyProfileRaw;
};

export type CompanyProfileEnrichmentDecision = {
  shouldGenerate: boolean;
  status: "generated" | "skipped";
  reason: "raw_profile_changed" | "raw_profile_unchanged";
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
