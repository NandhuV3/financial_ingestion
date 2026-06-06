import type { CompanyProfile, CompanyStory } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";
import {
  getBusinessDescription,
  getCompetitiveSignals,
  getPrimaryCustomers,
} from "../../company-identity/company-identity-accessors.js";

export function buildCompanyStory(
  artifacts: PartnerSourceArtifacts,
  profile: CompanyProfile,
): CompanyStory {
  const customers = getPrimaryCustomers(artifacts.companyIdentity, artifacts.companyProfile);
  const competitiveSignals = getCompetitiveSignals(artifacts.companyIdentity);

  return {
    whatTheyDo: getBusinessDescription(artifacts.companyIdentity, artifacts.companyProfile) || profile.whatTheyDo,
    whoBuys: sentenceList(customers, profile.whoTheyServe),
    whyTheyWin: `Customers may choose this business for ${sentenceList(
      competitiveSignals,
      "capabilities described in its company filings",
    )}.`,
    whatCouldGoWrong: `The main areas to watch are ${sentenceList(
      artifacts.companyProfile.business_risks,
      "demand, competition, execution, and regulation",
    )}.`,
  };
}
