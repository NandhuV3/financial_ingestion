import type { BusinessHealth, CompanyCategory, ConvictionLevel } from "../../company/mock/companies";

export type DiscoveryCompanyCard = {
  ticker: string;
  name: string;
  category: CompanyCategory;
  businessHealth: BusinessHealth;
  conviction: ConvictionLevel;
  tagline: string;
  primaryQuestion: string;
  primaryAnswer: string;
  route: string;
};
