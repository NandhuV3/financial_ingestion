import React from "react";
import { NavLink } from "react-router-dom";
import { EXPLORE_ROUTE, HOME_ROUTE, LEARN_ROUTE, PORTFOLIO_ROUTE, PROFILE_ROUTE } from "../constants/routes";

const navItems = [
  { label: "Home", to: HOME_ROUTE, icon: "H" },
  { label: "Explore", to: EXPLORE_ROUTE, icon: "E" },
  { label: "Portfolio", to: PORTFOLIO_ROUTE, icon: "P" },
  { label: "Learn", to: LEARN_ROUTE, icon: "L" },
  { label: "Profile", to: PROFILE_ROUTE, icon: "R" },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-partner-line bg-partner-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === HOME_ROUTE}
            aria-label={item.label}
            className={({ isActive }) =>
              [
                "flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-xs font-medium",
                isActive ? "bg-partner-paper text-partner-accent" : "text-partner-muted",
              ].join(" ")
            }
          >
            <span aria-hidden="true" className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
