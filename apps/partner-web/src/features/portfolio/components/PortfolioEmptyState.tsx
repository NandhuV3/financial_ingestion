import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { EXPLORE_ROUTE } from "../../../constants/routes";

export function PortfolioEmptyState() {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-partner-ink">You have not added any businesses yet.</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-partner-muted">
          Explore companies and add businesses you would like to understand as an owner.
        </p>
      </div>
      <Link
        to={EXPLORE_ROUTE}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-partner-accent px-4 py-2 text-sm font-medium text-white sm:w-auto"
      >
        Explore Businesses
      </Link>
    </Card>
  );
}
