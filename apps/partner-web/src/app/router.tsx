import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { homeRoute } from "../routes/home.route";
import { exploreRoute } from "../routes/explore.route";
import { portfolioRoute } from "../routes/portfolio.route";
import { learnRoute } from "../routes/learn.route";
import { profileRoute } from "../routes/profile.route";
import { companyRoute } from "../routes/company.route";
import { HOME_ROUTE } from "../constants/routes";

export const routes = [
  homeRoute,
  exploreRoute,
  portfolioRoute,
  learnRoute,
  profileRoute,
  companyRoute,
];

export function createPartnerRouter() {
  return createBrowserRouter([
  {
    path: HOME_ROUTE,
    element: <App />,
    children: routes,
  },
  ]);
}
