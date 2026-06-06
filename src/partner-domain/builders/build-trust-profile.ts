import type { TrustProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import {
  getCompetitiveSignals,
  getPrimaryCustomers,
} from "../../company-identity/company-identity-accessors.js";

export function buildTrustProfile(artifacts: PartnerSourceArtifacts): TrustProfile {
  const customers = getPrimaryCustomers(artifacts.companyIdentity, artifacts.companyProfile).slice(0, 2).join(" and ") || "customers";
  const advantages = getCompetitiveSignals(artifacts.companyIdentity).slice(0, 2).join(" and ") || "durable business strengths";

  return {
    managementQuality: `Management quality is best judged by whether leaders keep the business useful to ${customers} over many years.`,
    longTermThinking: `${artifacts.filing.company} should be assessed by how consistently it protects customer trust, invests in ${advantages}, and avoids short-term thinking.`,
    capitalAllocation: "Capital allocation should be reviewed by watching how the company balances reinvestment, borrowing, acquisitions, and shareholder returns.",
    skinInTheGame: "Leadership alignment should be reviewed through ownership, incentives, and whether decisions support long-term business value.",
    confidence: "medium",
    dataAvailability: "partial",
  };
}
