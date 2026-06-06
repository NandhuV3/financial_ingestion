import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EXPLORE_ROUTE } from "../../../constants/routes";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface CompanyHeaderProps {
  company: PartnerCompanyViewModel;
  onAddToPortfolio?: () => void;
  isInPortfolio?: boolean;
}

export function CompanyHeader({ company, onAddToPortfolio, isInPortfolio = false }: CompanyHeaderProps) {
  return (
    <header className="space-y-4">
      <Link
        to={EXPLORE_ROUTE}
        className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-partner-accent focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper"
      >
        Back to Explore
      </Link>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-partner-muted">{company.ticker}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-partner-ink">{company.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {company.businessHealth && <Badge className="capitalize">{company.businessHealth}</Badge>}
            {company.conviction && <Badge>Conviction: {company.conviction}</Badge>}
          </div>
        </div>
        <p className="max-w-2xl text-base leading-7 text-partner-muted">{company.tagline}</p>
        {onAddToPortfolio && (
          <Button
            type="button"
            onClick={onAddToPortfolio}
            disabled={isInPortfolio}
            aria-label={isInPortfolio ? `${company.name} is already in your portfolio` : `Add ${company.name} to portfolio`}
            className={isInPortfolio ? "bg-partner-muted" : ""}
          >
            {isInPortfolio ? "Added To Portfolio" : "Add To Portfolio"}
          </Button>
        )}
      </Card>
    </header>
  );
}
