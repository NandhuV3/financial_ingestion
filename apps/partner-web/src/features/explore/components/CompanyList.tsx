import React from "react";
import type { DiscoveryCompanyCard as DiscoveryCompanyCardViewModel } from "../types/discovery-company-card";
import { DiscoveryCompanyCard } from "./DiscoveryCompanyCard";

interface CompanyListProps {
  companies: DiscoveryCompanyCardViewModel[];
}

export function CompanyList({ companies }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-partner-line bg-partner-surface p-5 text-sm text-partner-muted">
        No companies match that search yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {companies.map((company) => (
        <DiscoveryCompanyCard key={company.ticker} company={company} />
      ))}
    </div>
  );
}
