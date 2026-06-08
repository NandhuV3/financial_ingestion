import React from "react";
import { Card } from "../../../components/ui/Card";

interface PortfolioSummaryProps {
  businesses: number;
  highConviction: number;
  recentlyReviewed: number;
  journalEntries: number;
}

export function PortfolioSummary({ businesses, highConviction, recentlyReviewed, journalEntries }: PortfolioSummaryProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-4" aria-label="Portfolio summary">
      <SummaryCard label="Businesses" value={businesses} />
      <SummaryCard label="High Conviction" value={highConviction} />
      <SummaryCard label="Recently Reviewed" value={recentlyReviewed} />
      <SummaryCard label="Journal Entries" value={journalEntries} />
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm font-medium text-partner-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-partner-ink">{value}</p>
    </Card>
  );
}
