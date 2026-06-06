import { useCallback } from "react";
import { PORTFOLIO_HOLDINGS_KEY } from "../../constants/local-storage";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import type { PortfolioConviction, PortfolioHolding } from "./types";

export function usePortfolio() {
  const [holdings, setHoldings] = useLocalStorageState<PortfolioHolding[]>(PORTFOLIO_HOLDINGS_KEY, []);

  const addHolding = useCallback((params: {
    ticker: string;
    companyName: string;
  }) => {
    const nextHoldings = addPortfolioHolding(holdings, {
      ticker: params.ticker,
      companyName: params.companyName,
      addedAt: new Date().toISOString(),
      conviction: "medium",
    });

    setHoldings(nextHoldings);
  }, [holdings, setHoldings]);

  const updateConviction = useCallback((ticker: string, conviction: PortfolioConviction) => {
    setHoldings(updatePortfolioConviction(holdings, ticker, conviction));
  }, [holdings, setHoldings]);

  const updateOwnershipNote = useCallback((ticker: string, ownershipNote: string) => {
    setHoldings(updatePortfolioNote(holdings, ticker, ownershipNote));
  }, [holdings, setHoldings]);

  const markReviewed = useCallback((ticker: string) => {
    setHoldings(updatePortfolioReviewTimestamp(holdings, ticker, new Date().toISOString()));
  }, [holdings, setHoldings]);

  const hasHolding = useCallback((ticker: string) =>
    holdings.some((holding) => normalizeTicker(holding.ticker) === normalizeTicker(ticker)), [holdings]);

  return {
    holdings,
    addHolding,
    updateConviction,
    updateOwnershipNote,
    markReviewed,
    hasHolding,
  };
}

export function addPortfolioHolding(
  holdings: PortfolioHolding[],
  holding: PortfolioHolding,
): PortfolioHolding[] {
  const ticker = normalizeTicker(holding.ticker);

  if (holdings.some((existing) => normalizeTicker(existing.ticker) === ticker)) {
    return holdings;
  }

  return [
    ...holdings,
    {
      ...holding,
      ticker,
      conviction: holding.conviction ?? "medium",
    },
  ];
}

export function updatePortfolioConviction(
  holdings: PortfolioHolding[],
  ticker: string,
  conviction: PortfolioConviction,
): PortfolioHolding[] {
  return holdings.map((holding) =>
    normalizeTicker(holding.ticker) === normalizeTicker(ticker)
      ? { ...holding, conviction }
      : holding,
  );
}

export function updatePortfolioNote(
  holdings: PortfolioHolding[],
  ticker: string,
  ownershipNote: string,
): PortfolioHolding[] {
  const cleanedNote = ownershipNote.trim();

  return holdings.map((holding) =>
    normalizeTicker(holding.ticker) === normalizeTicker(ticker)
      ? {
        ...holding,
        ownershipNote: cleanedNote || undefined,
      }
      : holding,
  );
}

export function updatePortfolioReviewTimestamp(
  holdings: PortfolioHolding[],
  ticker: string,
  reviewedAt: string,
): PortfolioHolding[] {
  return holdings.map((holding) =>
    normalizeTicker(holding.ticker) === normalizeTicker(ticker)
      ? {
        ...holding,
        lastReviewedAt: reviewedAt,
      }
      : holding,
  );
}

export function buildPortfolioSummary(holdings: PortfolioHolding[]) {
  return {
    businesses: holdings.length,
    highConviction: holdings.filter((holding) => holding.conviction === "high").length,
    recentlyReviewed: holdings.filter((holding) => isRecentlyReviewed(holding.lastReviewedAt)).length,
  };
}

export function formatReviewedAt(value?: string): string {
  if (!value) {
    return "Not reviewed yet";
  }

  const reviewedAt = new Date(value).getTime();
  const now = Date.now();
  const days = Math.max(0, Math.floor((now - reviewedAt) / 86_400_000));

  if (days === 0) return "Reviewed today";
  if (days === 1) return "Reviewed 1 day ago";

  return `Reviewed ${days} days ago`;
}

function isRecentlyReviewed(value?: string): boolean {
  if (!value) return false;

  const reviewedAt = new Date(value).getTime();

  if (Number.isNaN(reviewedAt)) return false;

  return Date.now() - reviewedAt <= 30 * 86_400_000;
}

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}
