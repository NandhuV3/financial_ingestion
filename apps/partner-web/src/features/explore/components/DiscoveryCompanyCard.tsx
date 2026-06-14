import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import type { DiscoveryCompanyCard as DiscoveryCompanyCardViewModel } from "../types/discovery-company-card";

interface DiscoveryCompanyCardProps {
  company: DiscoveryCompanyCardViewModel;
  className?: string;
}

export function DiscoveryCompanyCard({ company, className = "" }: DiscoveryCompanyCardProps) {
  return (
    <Link
      to={company.route}
      className={`block rounded-lg focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper ${className}`}
      aria-label={`Explore ${company.name}`}
    >
      <Card className="h-full transition hover:border-partner-accent hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-partner-muted">{company.ticker}</p>
            <h3 className="mt-1 text-lg font-semibold text-partner-ink">{company.name}</h3>
          </div>
          <Badge>{company.category}</Badge>
        </div>

        <p className="mt-3 text-sm leading-6 text-partner-muted">{company.tagline}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="capitalize">Health: {company.businessHealth}</Badge>
          <Badge>Conviction: {company.conviction}</Badge>
        </div>

        <div className="mt-4 border-t border-partner-line pt-4">
          <p className="text-sm font-semibold text-partner-ink">{company.primaryQuestion}</p>
          <p className="mt-2 text-sm leading-6 text-partner-muted">{company.primaryAnswer}</p>
        </div>
      </Card>
    </Link>
  );
}
