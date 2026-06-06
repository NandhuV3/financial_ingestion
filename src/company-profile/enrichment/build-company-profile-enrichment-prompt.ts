import { calculateStringHash } from "../../shared/hashing/hash-file.js";
import type { CompanyProfileRaw } from "../company-profile.types.js";
import type { CompanyProfileEnrichmentPromptInput } from "./company-profile-enrichment.types.js";

export const COMPANY_PROFILE_ENRICHMENT_SYSTEM_PROMPT = `You improve plain-language company profile fields for a long-term business understanding product.

Use only the provided structured company profile.
Return JSON only.

Allowed responsibilities:
- Improve business_model.
- Improve competitive_advantages.
- Add customer_value_proposition.

Do not classify risks.
Do not assign topics.
Do not change products.
Do not change customers.
Do not change business_risks.
Do not change themes.
Do not change topics.
Do not change source_filings.
Do not add unsupported company facts.`;

export function buildCompanyProfileEnrichmentPromptInput(
  rawProfile: CompanyProfileRaw,
): CompanyProfileEnrichmentPromptInput {
  return {
    raw_profile: rawProfile,
  };
}

export function buildCompanyProfileEnrichmentPrompt(input: CompanyProfileEnrichmentPromptInput): string {
  return `Improve the narrative-quality fields in this Company Profile Intelligence artifact.

Return this exact JSON shape:
{
  "business_model": "",
  "competitive_advantages": [],
  "customer_value_proposition": ""
}

Rules:
- Keep language simple and business-focused.
- Explain what the company does in one sentence.
- Competitive advantages must be an array of concise plain-language advantages.
- Customer value proposition must explain why customers use the products or services.
- Do not modify products, customers, business_risks, themes, topics, or source_filings; they are deterministic fields handled elsewhere.

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
