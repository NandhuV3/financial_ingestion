import React from "react";
import { Card } from "../../../components/ui/Card";

interface PortfolioSummaryProps {
  businesses: number;
  highConviction: number;
  recentlyReviewed: number;
}

export function PortfolioSummary({ businesses, highConviction, recentlyReviewed }: PortfolioSummaryProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Portfolio summary">
      <SummaryCard label="Businesses" value={businesses} />
      <SummaryCard label="High Conviction" value={highConviction} />
      <SummaryCard label="Recently Reviewed" value={recentlyReviewed} />
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
