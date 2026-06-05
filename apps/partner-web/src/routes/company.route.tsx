import { COMPANY_ROUTE } from "../constants/routes";
import React from "react";
import { CompanyDetailScreen } from "../features/company/CompanyDetailScreen";

export const companyRoute = {
  path: COMPANY_ROUTE.slice(1),
  element: <CompanyDetailScreen />,
};
