import type { CompanyProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { firstSentence, sentenceList } from "./business-language.js";
import {
  getBusinessDescription,
  getPrimaryCustomers,
} from "../../company-identity/company-identity-accessors.js";

export function buildCompanyProfile(artifacts: PartnerSourceArtifacts): CompanyProfile {
  const businessDescription = getBusinessDescription(artifacts.companyIdentity, artifacts.companyProfile);
  const customers = getPrimaryCustomers(artifacts.companyIdentity, artifacts.companyProfile);

  return {
    ticker: artifacts.filing.ticker,
    companyName: artifacts.filing.company,
    tagline: firstSentence(businessDescription, 140),
    whatTheyDo: businessDescription,
    whoTheyServe: sentenceList(customers, "Customers described in the company's public filings."),
  };
}
