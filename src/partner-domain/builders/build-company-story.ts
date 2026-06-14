import type { CompanyProfile, CompanyStory } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

export function buildCompanyStory(
  artifacts: PartnerSourceArtifacts,
  profile: CompanyProfile,
): CompanyStory {
  const customers = artifacts.companyKnowledge.customers;
  const competitiveSignals = artifacts.companyKnowledge.competitive_positioning.map((item) => item.signal);

  return {
    whatTheyDo: artifacts.companyKnowledge.business_description || profile.whatTheyDo,
    whoBuys: sentenceList(customers, profile.whoTheyServe),
    whyTheyWin: `Customers may choose this business for ${sentenceList(
      competitiveSignals,
      "capabilities described in its company filings",
    )}.`,
    whatCouldGoWrong: `The main areas to watch are ${sentenceList(
      artifacts.companyKnowledge.risks,
      "demand, competition, execution, and regulation",
    )}.`,
  };
}
