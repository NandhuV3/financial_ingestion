export type PortfolioConviction = "low" | "medium" | "high";

export type PortfolioHolding = {
  ticker: string;
  companyName: string;
  addedAt: string;
  conviction: PortfolioConviction;
  businessHealth?: "improving" | "stable" | "needs_attention";
  ownershipNote?: string;
  lastReviewedAt?: string;
};
