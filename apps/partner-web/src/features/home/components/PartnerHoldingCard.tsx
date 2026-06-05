import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { companyRoute } from "../../../constants/routes";
import type { MockCompany } from "../../company/mock/companies";

interface PartnerHoldingCardProps {
  company: MockCompany;
}

export function PartnerHoldingCard({ company }: PartnerHoldingCardProps) {
  return (
    <Link
      to={companyRoute(company.ticker)}
      className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-paper"
      aria-label={`Open ${company.name}`}
    >
      <Card className="h-full transition hover:border-partner-accent hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-partner-muted">{company.ticker}</p>
            <h3 className="mt-1 text-xl font-semibold text-partner-ink">{company.name}</h3>
          </div>
          <Badge>{company.businessHealth}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-partner-muted">{company.tagline}</p>
        <p className="mt-4 text-base leading-7 text-partner-ink">{company.partnerSummary}</p>
        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="block text-partner-muted">Business Health</span>
            <span className="font-semibold capitalize text-partner-ink">{company.businessHealth}</span>
          </div>
          <div>
            <span className="block text-partner-muted">Conviction</span>
            <span className="font-semibold text-partner-ink">{company.conviction}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
