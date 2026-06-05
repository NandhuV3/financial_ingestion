import type { CompanyProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { findTheme, inferWhoTheyServe } from "./builder-utils.js";

export function buildCompanyProfile(artifacts: PartnerSourceArtifacts): CompanyProfile {
  const growthTheme = findTheme(artifacts.themes?.themes ?? [], ["growth", "cloud", "revenue"]);
  const narrative = artifacts.narrative;

  return {
    ticker: artifacts.filing.ticker,
    companyName: artifacts.filing.company,
    tagline: narrative?.headline ?? `${artifacts.filing.company} business overview`,
    whatTheyDo: growthTheme?.summary ?? narrative?.executive_summary ?? `${artifacts.filing.company} operates a public business described in its latest filing.`,
    whoTheyServe: inferWhoTheyServe(artifacts),
  };
}
