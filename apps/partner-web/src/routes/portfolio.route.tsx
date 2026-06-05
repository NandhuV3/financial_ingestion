import { PORTFOLIO_ROUTE } from "../constants/routes";
import React from "react";
import { PortfolioScreen } from "../features/portfolio/PortfolioScreen";

export const portfolioRoute = {
  path: PORTFOLIO_ROUTE.slice(1),
  element: <PortfolioScreen />,
};
