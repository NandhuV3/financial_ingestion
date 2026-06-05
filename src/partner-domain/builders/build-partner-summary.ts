import type { BusinessHealth, PartnerSummary } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { calculateConviction } from "./builder-utils.js";

export function buildPartnerSummary(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): PartnerSummary {
  const narrative = artifacts.narrative;
  const insight = artifacts.insight;

  return {
    headline: narrative?.headline ?? insight?.headline ?? `${artifacts.filing.company} business summary`,
    summary: narrative?.investor_takeaway ?? narrative?.executive_summary ?? insight?.executive_summary ?? "Business summary is not available from current artifacts.",
    businessHealth,
    conviction: calculateConviction(artifacts),
  };
}
