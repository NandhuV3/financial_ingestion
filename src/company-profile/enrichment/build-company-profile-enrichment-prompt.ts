import { calculateStringHash } from "../../shared/hashing/hash-file.js";
import type { CompanyProfileRaw } from "../company-profile.types.js";
import type { CompanyProfileEnrichmentPromptInput } from "./company-profile-enrichment.types.js";

export const COMPANY_PROFILE_ENRICHMENT_SYSTEM_PROMPT = `Company Profile enrichment is retired.

Company Identity owns business understanding.
Company Profile owns presentation formatting only.

Do not generate business models, competitive advantages, or customer value propositions from Company Profile.`;

export function buildCompanyProfileEnrichmentPromptInput(
  rawProfile: CompanyProfileRaw,
): CompanyProfileEnrichmentPromptInput {
  return {
    raw_profile: rawProfile,
  };
}

export function buildCompanyProfileEnrichmentPrompt(input: CompanyProfileEnrichmentPromptInput): string {
  return `Company Profile enrichment is retired because Company Identity is the source of truth for business understanding.

Raw profile:
${JSON.stringify(input.raw_profile, null, 2)}`;
}

export function calculateCompanyProfileRawHash(rawProfile: CompanyProfileRaw): string {
  return calculateStringHash(JSON.stringify(normalizeRawProfileForHash(rawProfile)));
}

function normalizeRawProfileForHash(rawProfile: CompanyProfileRaw): CompanyProfileRaw {
  return {
    company: rawProfile.company,
    products: [...rawProfile.products],
    customers: [...rawProfile.customers],
    business_risks: [...rawProfile.business_risks],
    themes: [...rawProfile.themes],
    topics: [...rawProfile.topics],
    source_filings: [...rawProfile.source_filings],
    profile_quality: "raw",
  };
}
