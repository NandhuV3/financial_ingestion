import type { BusinessHealth, PartnerSummary } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { firstSentence } from "./business-language.js";
import { calculateConviction } from "./builder-utils.js";
import { getBusinessModel } from "../../company-profile/company-profile-accessors.js";

export function buildPartnerSummary(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): PartnerSummary {
  const businessModel = getBusinessModel(artifacts.companyProfile);

  return {
    headline: firstSentence(businessModel, 140),
    summary: firstSentence(businessModel, 220),
    businessHealth,
    conviction: calculateConviction(artifacts),
  };
}
