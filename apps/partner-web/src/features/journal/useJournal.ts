import { useCallback } from "react";
import { PARTNER_JOURNAL_ENTRIES_KEY } from "../../constants/local-storage";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import type { PartnerJournalDraft, PartnerJournalEntry } from "./types";

export function useJournal() {
  const [entries, setEntries] = useLocalStorageState<PartnerJournalEntry[]>(PARTNER_JOURNAL_ENTRIES_KEY, []);

  const createEntry = useCallback((ticker: string, draft: PartnerJournalDraft) => {
    const entry = createJournalEntry(ticker, draft);

    if (!hasJournalContent(entry)) {
      return null;
    }

    setEntries(addJournalEntry(entries, entry));
    return entry;
  }, [entries, setEntries]);

  return {
    entries,
    createEntry,
    getEntriesForTicker: useCallback((ticker: string) =>
      getJournalEntriesForTicker(entries, ticker), [entries]),
    getEntryCountForTicker: useCallback((ticker: string) =>
      getJournalEntriesForTicker(entries, ticker).length, [entries]),
  };
}

export function createJournalEntry(
  ticker: string,
  draft: PartnerJournalDraft,
  createdAt = new Date().toISOString(),
): PartnerJournalEntry {
  return {
    id: createJournalId(ticker, createdAt),
    ticker: ticker.trim().toUpperCase(),
    createdAt,
    understanding: draft.understanding.trim(),
    convictionReason: draft.convictionReason.trim(),
    concerns: draft.concerns.trim(),
    nextQuestion: draft.nextQuestion.trim(),
  };
}

export function addJournalEntry(
  entries: PartnerJournalEntry[],
  entry: PartnerJournalEntry,
): PartnerJournalEntry[] {
  return sortJournalEntries([entry, ...entries]);
}

export function getJournalEntriesForTicker(
  entries: PartnerJournalEntry[],
  ticker: string,
): PartnerJournalEntry[] {
  const normalizedTicker = ticker.trim().toUpperCase();

  return sortJournalEntries(entries.filter((entry) => entry.ticker.trim().toUpperCase() === normalizedTicker));
}

export function countJournalEntriesByTicker(entries: PartnerJournalEntry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    const ticker = entry.ticker.trim().toUpperCase();
    counts[ticker] = (counts[ticker] ?? 0) + 1;
    return counts;
  }, {});
}

function sortJournalEntries(entries: PartnerJournalEntry[]): PartnerJournalEntry[] {
  return [...entries].sort((left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function hasJournalContent(entry: PartnerJournalEntry): boolean {
  return Boolean(
    entry.understanding
    || entry.convictionReason
    || entry.concerns
    || entry.nextQuestion,
  );
}

function createJournalId(ticker: string, createdAt: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${ticker.trim().toUpperCase()}-${createdAt}`;
}
