import React from "react";
import { PageContainer } from "../../components/ui/PageContainer";
import { PortfolioEmptyState } from "./components/PortfolioEmptyState";
import { PortfolioHoldingCard } from "./components/PortfolioHoldingCard";
import { PortfolioSummary } from "./components/PortfolioSummary";
import { buildPortfolioHealthSummary, buildPortfolioSummary, usePortfolio } from "./usePortfolio";
import { countJournalEntriesByTicker, useJournal } from "../journal/useJournal";

export function PortfolioScreen() {
  const {
    holdings,
    updateConviction,
    updateOwnershipNote,
  } = usePortfolio();
  const { entries } = useJournal();
  const summary = buildPortfolioSummary(holdings);
  const healthSummary = buildPortfolioHealthSummary(holdings);
  const journalCounts = countJournalEntriesByTicker(entries);

  return (
    <PageContainer>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-normal text-partner-ink">Partner Portfolio</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-partner-muted">
            Businesses you understand, would like to own, or want to revisit with an owner mindset.
          </p>
        </header>

        <PortfolioSummary
          businesses={summary.businesses}
          highConviction={summary.highConviction}
          recentlyReviewed={summary.recentlyReviewed}
          journalEntries={entries.length}
          improvingBusinesses={healthSummary.improving}
          stableBusinesses={healthSummary.stable}
          needsAttentionBusinesses={healthSummary.needsAttention}
        />

        {holdings.length === 0 ? (
          <PortfolioEmptyState />
        ) : (
          <section className="space-y-4" aria-label="Portfolio holdings">
            {holdings.map((holding) => (
              <PortfolioHoldingCard
                key={holding.ticker}
                holding={holding}
                journalEntryCount={journalCounts[holding.ticker] ?? 0}
                onConvictionChange={updateConviction}
                onNoteChange={updateOwnershipNote}
              />
            ))}
          </section>
        )}
      </div>
    </PageContainer>
  );
}
