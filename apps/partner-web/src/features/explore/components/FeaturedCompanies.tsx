import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import type { DiscoveryCompanyCard as DiscoveryCompanyCardViewModel } from "../types/discovery-company-card";

interface FeaturedCompaniesProps {
  companies: DiscoveryCompanyCardViewModel[];
}

export function FeaturedCompanies({ companies }: FeaturedCompaniesProps) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="featured-companies-heading">
      <div>
        <h2 id="featured-companies-heading" className="text-xl font-semibold text-partner-ink">
          Featured Businesses
        </h2>
        <p className="mt-1 text-sm text-partner-muted">High-conviction businesses to start with.</p>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {companies.map((company) => (
          <Link
            key={company.ticker}
            to={company.route}
            className="block w-[20rem] shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper sm:w-[23rem]"
            aria-label={`Explore ${company.name}`}
          >
            <Card className="flex min-h-[22rem] flex-col justify-between p-6 transition hover:border-partner-accent hover:shadow-md">
              <div>
                <p className="text-xs font-semibold uppercase text-partner-muted">{company.ticker}</p>
                <h3 className="mt-2 text-3xl font-semibold leading-tight text-partner-ink">
                  {company.name}
                </h3>
              </div>

              <div className="py-7">
                <p className="text-base font-semibold leading-6 text-partner-ink">
                  {company.primaryQuestion}
                </p>
                <p className="mt-4 text-base leading-7 text-partner-muted">
                  {company.primaryAnswer}
                </p>
              </div>

              <p className="text-sm font-semibold text-partner-accent">
                {formatBusinessHealth(company.businessHealth)} &bull; {company.conviction} Conviction
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatBusinessHealth(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}
