import { LEARN_ROUTE } from "../constants/routes";
import React from "react";
import { LearnScreen } from "../features/learn/LearnScreen";

export const learnRoute = {
  path: LEARN_ROUTE.slice(1),
  element: <LearnScreen />,
};
