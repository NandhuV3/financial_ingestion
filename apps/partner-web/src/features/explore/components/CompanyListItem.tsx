import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { companyRoute } from "../../../constants/routes";
import type { MockCompany } from "../../company/mock/companies";

interface CompanyListItemProps {
  company: MockCompany;
}

export function CompanyListItem({ company }: CompanyListItemProps) {
  return (
    <Link
      to={companyRoute(company.ticker)}
      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper"
      aria-label={`Explore ${company.name}`}
    >
      <Card className="transition hover:border-partner-accent hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-partner-muted">{company.ticker}</p>
            <h3 className="mt-1 text-lg font-semibold text-partner-ink">{company.name}</h3>
          </div>
          <Badge>{company.category}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-partner-muted">{company.tagline}</p>
        <p className="mt-4 text-base leading-7 text-partner-ink">{company.neighbourhoodExplanation}</p>
      </Card>
    </Link>
  );
}
