export type PortfolioConviction = "low" | "medium" | "high";

export type PortfolioHolding = {
  ticker: string;
  companyName: string;
  addedAt: string;
  conviction: PortfolioConviction;
  ownershipNote?: string;
  lastReviewedAt?: string;
};
