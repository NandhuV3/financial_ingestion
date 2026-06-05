import { EXPLORE_ROUTE } from "../constants/routes";
import React from "react";
import { ExploreScreen } from "../features/explore/ExploreScreen";

export const exploreRoute = {
  path: EXPLORE_ROUTE.slice(1),
  element: <ExploreScreen />,
};
