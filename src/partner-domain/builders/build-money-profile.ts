import type { BusinessHealth, MoneyProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { findTheme } from "./builder-utils.js";

export function buildMoneyProfile(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): MoneyProfile {
  const themes = artifacts.themes?.themes ?? [];
  const growthTheme = findTheme(themes, ["growth", "revenue", "sales", "cloud"]);
  const marginTheme = findTheme(themes, ["margin", "margins", "cost"]);

  return {
    dailySales: {
      label: "Revenue",
      plainLanguageName: "Daily Sales",
      explanation: growthTheme?.summary ?? "The current artifacts do not yet provide a plain-language sales trend.",
      status: growthTheme ? businessHealth : undefined,
    },
    whatsLeftAfterCosts: {
      label: "Margin",
      plainLanguageName: "What's Left After Costs",
      explanation: marginTheme?.summary ?? "The current artifacts do not yet provide a clear margin explanation.",
      status: marginTheme ? businessHealth : undefined,
    },
    loansToExpand: {
      label: "Debt",
      plainLanguageName: "Loans To Expand",
      explanation: "Debt and balance sheet detail are not yet populated by the current intelligence pipeline.",
    },
    moneyInTheDrawer: {
      label: "Cashflow",
      plainLanguageName: "Money In The Drawer",
      explanation: "Cashflow detail is not yet populated by the current intelligence pipeline.",
    },
    overallExplanation: "This view translates business finance into plain language. Some fields will become richer when financial statement extraction is added.",
  };
}
