import type { BusinessHealth, PartnerSummary } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { firstSentence } from "./business-language.js";
import { calculateConviction } from "./builder-utils.js";
import { getBusinessDescription } from "../../company-identity/company-identity-accessors.js";

export function buildPartnerSummary(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): PartnerSummary {
  const businessDescription = getBusinessDescription(artifacts.companyIdentity, artifacts.companyProfile);

  return {
    headline: firstSentence(businessDescription, 140),
    summary: firstSentence(businessDescription, 220),
    businessHealth,
    conviction: calculateConviction(artifacts),
  };
}
