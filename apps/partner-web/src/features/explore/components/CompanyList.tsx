import React from "react";
import type { MockCompany } from "../../company/mock/companies";
import { CompanyListItem } from "./CompanyListItem";

interface CompanyListProps {
  companies: MockCompany[];
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
        <CompanyListItem key={company.id} company={company} />
      ))}
    </div>
  );
}
