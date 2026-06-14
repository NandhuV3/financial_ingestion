export type PartnerCompanyViewModel = {
  name: string;
  ticker: string;
  tagline: string;
  neighbourhoodExplanation: string;
  businessHealth?: string;
  conviction?: string;
  health?: {
    status: string;
    explanation: string;
    strengtheningAreas: Array<{
      title: string;
      explanation: string;
    }>;
    watchAreas: Array<{
      title: string;
      explanation: string;
    }>;
    timeline: Array<{
      label: string;
      filingDate: string;
      status: string;
    }>;
  };
  fiveQuestions?: {
    business: OwnerQuestionCardViewModel;
    growth: OwnerQuestionCardViewModel;
    trust: OwnerQuestionCardViewModel;
    valuation: OwnerQuestionCardViewModel;
    holdThesis: OwnerQuestionCardViewModel;
  };
  story: {
    whatTheySell: string;
    whoBuys: string;
    whyTheyWin: string;
    whatCouldGoWrong: string;
  };
  customers: Array<{
    segment: string;
    whyTheyBuy: string;
  }>;
  money: {
    dailySales: string;
    margin: string;
    debt: string;
    cashflow: string;
  };
  trust: {
    founder: string;
    decisionStyle: string;
    skinInTheGame: string;
    longTermThinking: string;
  };
  forensics: Array<{
    title: string;
    status: string;
    description: string;
  }>;
};

export type OwnerQuestionCardViewModel = {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low" | "";
  evidence: string[];
  status?: "answered" | "insufficient_data" | "";
};
