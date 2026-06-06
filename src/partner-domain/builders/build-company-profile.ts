import type { CompanyProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { firstSentence, sentenceList } from "./business-language.js";
import { getBusinessModel } from "../../company-profile/company-profile-accessors.js";

export function buildCompanyProfile(artifacts: PartnerSourceArtifacts): CompanyProfile {
  const profile = artifacts.companyProfile;
  const businessModel = getBusinessModel(profile);

  return {
    ticker: artifacts.filing.ticker,
    companyName: artifacts.filing.company,
    tagline: firstSentence(businessModel, 140),
    whatTheyDo: businessModel,
    whoTheyServe: sentenceList(profile.customers, "Customers described in the company's public filings."),
  };
}
