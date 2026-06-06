import type { CompanyProfile, CompanyStory } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";
import { getBusinessModel, getCompetitiveAdvantages } from "../../company-profile/company-profile-accessors.js";

export function buildCompanyStory(
  artifacts: PartnerSourceArtifacts,
  profile: CompanyProfile,
): CompanyStory {
  const intelligence = artifacts.companyProfile;

  return {
    whatTheyDo: getBusinessModel(intelligence) || profile.whatTheyDo,
    whoBuys: sentenceList(intelligence.customers, profile.whoTheyServe),
    whyTheyWin: `Customers may choose this business for ${sentenceList(
      getCompetitiveAdvantages(intelligence),
      "capabilities described in its company filings",
    )}.`,
    whatCouldGoWrong: `The main areas to watch are ${sentenceList(
      intelligence.business_risks,
      "demand, competition, execution, and regulation",
    )}.`,
  };
}
