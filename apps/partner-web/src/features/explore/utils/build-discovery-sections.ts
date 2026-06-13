import { companyRoute } from "../../../constants/routes";
import type { MockCompany } from "../../company/mock/companies";
import type { DiscoveryCompanyCard } from "../types/discovery-company-card";

export type DiscoverySections = {
  featured: DiscoveryCompanyCard[];
  highConviction: DiscoveryCompanyCard[];
  watchCarefully: DiscoveryCompanyCard[];
  allCompanies: DiscoveryCompanyCard[];
};

export function mapMockCompanyToDiscoveryCard(company: MockCompany): DiscoveryCompanyCard {
  const primaryQuestion = selectPrimaryQuestion(company);

  return {
    ticker: company.ticker,
    name: company.name,
    category: company.category,
    businessHealth: company.businessHealth,
    conviction: company.conviction,
    tagline: company.tagline,
    primaryQuestion: primaryQuestion.question,
    primaryAnswer: primaryQuestion.answer,
    route: companyRoute(company.ticker),
  };
}

export function buildDiscoverySections(companies: MockCompany[]): DiscoverySections {
  const allCompanies = companies.map(mapMockCompanyToDiscoveryCard);
  const highConviction = allCompanies.filter((company) => company.conviction === "High");
  const weakening = allCompanies.filter((company) => company.businessHealth === "weakening");
  const stableFallback = allCompanies.filter((company) => company.businessHealth === "stable");

  return {
    featured: highConviction.slice(0, 3),
    highConviction,
    watchCarefully: weakening.length > 0 ? weakening : stableFallback,
    allCompanies,
  };
}

function selectPrimaryQuestion(company: MockCompany): { question: string; answer: string } {
  const card = company.fiveQuestions?.business
    ?? company.fiveQuestions?.growth
    ?? company.fiveQuestions?.trust;

  return card
    ? {
      question: card.question,
      answer: card.answer,
    }
    : {
      question: "What does this company actually sell?",
      answer: company.story.whatTheySell || company.tagline,
    };
}
