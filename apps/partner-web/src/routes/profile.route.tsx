import { PROFILE_ROUTE } from "../constants/routes";
import React from "react";
import { ProfileScreen } from "../features/profile/ProfileScreen";

export const profileRoute = {
  path: PROFILE_ROUTE.slice(1),
  element: <ProfileScreen />,
};
