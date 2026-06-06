import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { companyRoute } from "../../../constants/routes";
import { findCompanyByTicker } from "../../company/mock/companies";
import type { PortfolioConviction, PortfolioHolding } from "../types";
import { formatReviewedAt } from "../usePortfolio";

interface PortfolioHoldingCardProps {
  holding: PortfolioHolding;
  onConvictionChange: (ticker: string, conviction: PortfolioConviction) => void;
  onNoteChange: (ticker: string, note: string) => void;
}

const convictionOptions: PortfolioConviction[] = ["low", "medium", "high"];

export function PortfolioHoldingCard({
  holding,
  onConvictionChange,
  onNoteChange,
}: PortfolioHoldingCardProps) {
  const company = findCompanyByTicker(holding.ticker);
  const businessHealth = company?.businessHealth ?? "stable";
  const detailPath = `${companyRoute(holding.ticker)}?fromPortfolio=1`;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-partner-muted">{holding.ticker}</p>
          <h2 className="mt-1 text-2xl font-semibold text-partner-ink">{holding.companyName}</h2>
          {company?.tagline && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-partner-muted">{company.tagline}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="capitalize">Health: {businessHealth}</Badge>
          <Badge className="capitalize">Conviction: {holding.conviction}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,220px)]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-partner-ink">Ownership Note</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-partner-line bg-partner-paper px-3 py-2 text-sm text-partner-ink focus:outline-none focus:ring-2 focus:ring-partner-accent"
            value={holding.ownershipNote ?? ""}
            onChange={(event) => onNoteChange(holding.ticker, event.target.value)}
            onInput={(event) => onNoteChange(holding.ticker, event.currentTarget.value)}
            placeholder="Strong cloud business. Want to understand Azure better."
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-partner-ink">Conviction</span>
          <select
            className="min-h-11 w-full rounded-md border border-partner-line bg-partner-paper px-3 py-2 text-sm capitalize text-partner-ink focus:outline-none focus:ring-2 focus:ring-partner-accent"
            value={holding.conviction}
            onChange={(event) => onConvictionChange(holding.ticker, event.target.value as PortfolioConviction)}
          >
            {convictionOptions.map((option) => (
              <option key={option} value={option}>{capitalize(option)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-partner-line pt-4">
        <p className="text-sm text-partner-muted">{formatReviewedAt(holding.lastReviewedAt)}</p>
        <Link
          to={detailPath}
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-partner-accent focus:outline-none focus:ring-2 focus:ring-partner-accent focus:ring-offset-2 focus:ring-offset-partner-surface"
        >
          Revisit Business
        </Link>
      </div>
    </Card>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
