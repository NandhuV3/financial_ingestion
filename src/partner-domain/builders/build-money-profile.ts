import type { BusinessHealth, MoneyProfile } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { removeFilingStyleLanguage, sentenceList } from "./business-language.js";

export function buildMoneyProfile(
  artifacts: PartnerSourceArtifacts,
  businessHealth: BusinessHealth,
): MoneyProfile {
  const moneyContext = getMoneyContext(artifacts);

  return {
    dailySales: {
      label: "Revenue",
      plainLanguageName: "Daily Sales",
      explanation: moneyContext.dailySales,
      status: businessHealth,
    },
    whatsLeftAfterCosts: {
      label: "Margin",
      plainLanguageName: "What's Left After Costs",
      explanation: moneyContext.margin,
      status: businessHealth,
    },
    loansToExpand: {
      label: "Debt",
      plainLanguageName: "Loans To Expand",
      explanation: moneyContext.debt,
    },
    moneyInTheDrawer: {
      label: "Cashflow",
      plainLanguageName: "Money In The Drawer",
      explanation: moneyContext.cashflow,
    },
    overallExplanation: removeFilingStyleLanguage(
      `${artifacts.companyKnowledge.business_description} The money view focuses on how the business brings in sales, keeps money after costs, uses borrowing, and generates cash over time.`,
    ),
  };
}

function getMoneyContext(artifacts: PartnerSourceArtifacts): {
  dailySales: string;
  margin: string;
  debt: string;
  cashflow: string;
} {
  const products = sentenceList(artifacts.companyKnowledge.products, "products or services");
  const customers = sentenceList(artifacts.companyKnowledge.customers, "customers");
  const advantages = sentenceList(
    artifacts.companyKnowledge.competitive_positioning.map((item) => item.signal),
    "durable customer relationships",
  );
  const revenueDrivers = sentenceList(artifacts.companyKnowledge.revenue_drivers, products);

  return {
    dailySales: `${artifacts.filing.company} earns sales through ${revenueDrivers} from ${customers}.`,
    margin: `What remains after costs depends on how efficiently the business delivers ${products} while protecting ${advantages}.`,
    debt: "Borrowing should be reviewed alongside reinvestment needs, acquisitions, operating resilience, and long-term business plans.",
    cashflow: "Cash generation remains important because it shows whether customer demand turns into money the business can use.",
  };
}
