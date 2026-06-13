import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import type { DiscoveryCompanyCard } from "../types/discovery-company-card";

interface CompactCompanyRowProps {
  company: DiscoveryCompanyCard;
}

export function CompactCompanyRow({ company }: CompactCompanyRowProps) {
  return (
    <Link
      to={company.route}
      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper"
      aria-label={`Explore ${company.name}`}
    >
      <Card className="p-3 transition hover:border-partner-accent hover:shadow-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-base font-semibold text-partner-ink">{company.name}</h3>
              <p className="text-xs font-semibold uppercase text-partner-muted">{company.category}</p>
            </div>
            <p className="mt-1 text-sm leading-5 text-partner-muted">{company.tagline}</p>
          </div>

          <p className="shrink-0 text-sm font-semibold text-partner-accent">
            {formatBusinessHealth(company.businessHealth)} &bull; {company.conviction} Conviction
          </p>
        </div>
      </Card>
    </Link>
  );
}

function formatBusinessHealth(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}
