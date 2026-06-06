import type { PartnerCompanyIntelligence } from "../../../types/partner-domain.types";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function mapPartnerCompanyToViewModel(
  intelligence: PartnerCompanyIntelligence,
): PartnerCompanyViewModel {
  return {
    name: safeText(intelligence.companyName),
    ticker: safeText(intelligence.ticker),
    tagline: safeText(intelligence.profile?.tagline),
    neighbourhoodExplanation: safeText(intelligence.summary?.summary),
    businessHealth: intelligence.summary?.businessHealth,
    conviction: intelligence.summary?.conviction,
    story: {
      whatTheySell: safeText(intelligence.story?.whatTheyDo),
      whoBuys: safeText(intelligence.story?.whoBuys),
      whyTheyWin: safeText(intelligence.story?.whyTheyWin),
      whatCouldGoWrong: safeText(intelligence.story?.whatCouldGoWrong),
    },
    customers: safeArray(intelligence.customers).map((customer) => ({
      segment: safeText(customer.customerType),
      whyTheyBuy: safeText(customer.whyTheyBuy),
    })),
    money: {
      dailySales: safeText(intelligence.money?.dailySales?.explanation),
      margin: safeText(intelligence.money?.whatsLeftAfterCosts?.explanation),
      debt: safeText(intelligence.money?.loansToExpand?.explanation),
      cashflow: safeText(intelligence.money?.moneyInTheDrawer?.explanation),
    },
    trust: {
      founder: safeText(intelligence.trust?.managementQuality),
      decisionStyle: safeText(intelligence.trust?.capitalAllocation),
      skinInTheGame: safeText(intelligence.trust?.skinInTheGame),
      longTermThinking: safeText(intelligence.trust?.longTermThinking),
    },
    forensics: safeArray(intelligence.forensics).map((signal) => ({
      title: safeText(signal.label),
      status: safeText(signal.severity),
      description: safeText(signal.explanation),
    })),
  };
}
