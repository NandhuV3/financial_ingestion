export type PartnerJournalEntry = {
  id: string;
  ticker: string;
  createdAt: string;
  understanding: string;
  convictionReason: string;
  concerns: string;
  nextQuestion: string;
};

export type PartnerJournalDraft = Omit<PartnerJournalEntry, "id" | "ticker" | "createdAt">;
