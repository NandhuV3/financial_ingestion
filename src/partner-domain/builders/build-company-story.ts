import type { CompanyProfile, CompanyStory } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { findRiskTheme, findTheme } from "./builder-utils.js";

export function buildCompanyStory(
  artifacts: PartnerSourceArtifacts,
  profile: CompanyProfile,
): CompanyStory {
  const themes = artifacts.themes?.themes ?? [];
  const opportunity = findTheme(themes, ["growth", "cloud", "investment", "investments"]);
  const risk = findRiskTheme(themes);

  return {
    whatTheyDo: profile.whatTheyDo,
    whoBuys: profile.whoTheyServe,
    whyTheyWin: opportunity?.summary ?? artifacts.narrative?.bull_case ?? "The current artifacts do not yet explain the company's advantage clearly.",
    whatCouldGoWrong: risk?.summary ?? artifacts.narrative?.bear_case ?? "The current artifacts do not yet identify a specific business risk.",
  };
}
