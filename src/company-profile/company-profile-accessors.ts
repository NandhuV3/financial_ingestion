import type { CompanyProfileIntelligence } from "./company-profile.types.js";
import { sentenceList } from "../partner-domain/builders/business-language.js";

export function isCompanyProfileEnriched(
  profile: CompanyProfileIntelligence,
): profile is Extract<CompanyProfileIntelligence, { profile_quality: "enriched" }> {
  return profile.profile_quality === "enriched";
}

export function getBusinessModel(profile: CompanyProfileIntelligence): string {
  if (isCompanyProfileEnriched(profile)) {
    return profile.business_model;
  }

  return `${profile.company} sells ${sentenceList(
    profile.products,
    "products or services",
  )} to ${sentenceList(profile.customers, "customers described in company filings")}.`;
}

export function getCompetitiveAdvantages(profile: CompanyProfileIntelligence): string[] {
  if (isCompanyProfileEnriched(profile)) {
    return profile.competitive_advantages;
  }

  const topics = profile.topics.filter((topic) =>
    ["cloud", "artificial_intelligence", "payments", "software", "services"].some((keyword) =>
      topic.toLowerCase().includes(keyword),
    ),
  );

  if (topics.length > 0) {
    return topics.map((topic) => `${topic.replace(/_/g, " ")} capabilities`);
  }

  return ["customer relationships and business capabilities described in company filings"];
}

export function getCustomerValueProposition(profile: CompanyProfileIntelligence): string {
  if (isCompanyProfileEnriched(profile)) {
    return profile.customer_value_proposition;
  }

  return `Customers use ${sentenceList(profile.products, "the company's products or services")} to meet practical business or personal needs.`;
}
