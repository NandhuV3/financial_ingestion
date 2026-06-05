import type { TrustProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";

export function buildTrustProfile(_artifacts: PartnerSourceArtifacts): TrustProfile {
  return {
    managementQuality: "Management quality is not yet directly scored by the current intelligence pipeline.",
    longTermThinking: "Long-term thinking will be enriched by future proxy, capital allocation, and multi-year analysis.",
    capitalAllocation: "Capital allocation detail is only partially available from current filing intelligence.",
    skinInTheGame: "Ownership and insider alignment are not yet populated.",
    confidence: "low",
    dataAvailability: "partial",
  };
}
