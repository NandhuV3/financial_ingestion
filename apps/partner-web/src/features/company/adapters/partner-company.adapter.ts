import type { PartnerCompanyIntelligence } from "../../../types/partner-domain.types";
import type { OwnerQuestionCardViewModel, PartnerCompanyViewModel } from "../types/partner-company-view-model";

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function safeQuestionCard(value: unknown): OwnerQuestionCardViewModel {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const confidence = safeText(record.confidence);
  const status = safeText(record.status);

  return {
    question: safeText(record.question),
    answer: safeText(record.answer),
    confidence: confidence === "high" || confidence === "medium" || confidence === "low" ? confidence : "",
    evidence: safeArray(record.evidence as string[] | undefined).map(safeText).filter(Boolean),
    status: status === "answered" || status === "insufficient_data" ? status : undefined,
  };
}

export function mapPartnerCompanyToViewModel(
  intelligence: PartnerCompanyIntelligence,
): PartnerCompanyViewModel {
  const fiveQuestions = intelligence.fiveQuestions;

  return {
    name: safeText(intelligence.companyName),
    ticker: safeText(intelligence.ticker),
    tagline: safeText(intelligence.profile?.tagline),
    neighbourhoodExplanation: safeText(intelligence.summary?.summary),
    businessHealth: intelligence.summary?.businessHealth,
    conviction: intelligence.summary?.conviction,
    health: intelligence.health ? {
      status: safeText(intelligence.health.status),
      explanation: safeText(intelligence.health.explanation),
      strengtheningAreas: safeArray(intelligence.health.strengtheningAreas).map((area) => ({
        title: safeText(area.title),
        explanation: safeText(area.explanation),
      })),
      watchAreas: safeArray(intelligence.health.watchAreas).map((area) => ({
        title: safeText(area.title),
        explanation: safeText(area.explanation),
      })),
      timeline: safeArray(intelligence.health.timeline).map((point) => ({
        label: safeText(point.label),
        filingDate: safeText(point.filingDate),
        status: safeText(point.status),
      })),
    } : undefined,
    fiveQuestions: fiveQuestions ? {
      business: safeQuestionCard(fiveQuestions.business),
      growth: safeQuestionCard(fiveQuestions.growth),
      trust: safeQuestionCard(fiveQuestions.trust),
      valuation: safeQuestionCard(fiveQuestions.valuation),
      holdThesis: safeQuestionCard(fiveQuestions.holdThesis),
    } : undefined,
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
