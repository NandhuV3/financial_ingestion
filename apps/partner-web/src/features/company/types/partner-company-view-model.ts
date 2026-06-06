export type PartnerCompanyViewModel = {
  name: string;
  ticker: string;
  tagline: string;
  neighbourhoodExplanation: string;
  businessHealth?: string;
  conviction?: string;
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
