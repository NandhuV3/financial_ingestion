import type { TrustProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";

export function buildTrustProfile(artifacts: PartnerSourceArtifacts): TrustProfile {
  const customers = artifacts.companyKnowledge.customers.slice(0, 2).join(" and ") || "customers";
  const advantages = artifacts.companyKnowledge.competitive_positioning
    .map((item) => item.signal)
    .slice(0, 2)
    .join(" and ") || "durable business strengths";

  return {
    managementQuality: `Management quality is best judged by whether leaders keep the business useful to ${customers} over many years.`,
    longTermThinking: `${artifacts.filing.company} should be assessed by how consistently it protects customer trust, invests in ${advantages}, and avoids short-term thinking.`,
    capitalAllocation: "Capital allocation should be reviewed by watching how the company balances reinvestment, borrowing, acquisitions, and shareholder returns.",
    skinInTheGame: "Leadership alignment should be reviewed through ownership, incentives, and whether decisions support long-term business value.",
    confidence: "medium",
    dataAvailability: "partial",
  };
}
