import React from "react";
import { Card } from "../../../components/ui/Card";
import { formatDate } from "../../../lib/dates/format-date";
import type { PartnerJournalEntry } from "../types";

interface JournalHistoryProps {
  entries: PartnerJournalEntry[];
}

export function JournalHistory({ entries }: JournalHistoryProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-partner-ink">You have not written any thoughts about this business yet.</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-partner-muted">
          Document what you understand, what concerns you, and what you want to learn next.
        </p>
      </Card>
    );
  }

  return (
    <section className="space-y-4" aria-label="Journal history">
      <h2 className="text-2xl font-semibold text-partner-ink">Journal History</h2>
      {entries.map((entry) => (
        <Card key={entry.id} className="space-y-4">
          <p className="text-sm font-medium text-partner-muted">Created {formatDate(entry.createdAt)}</p>
          <JournalField label="My Understanding" value={entry.understanding} />
          <JournalField label="Why I Have Conviction" value={entry.convictionReason} />
          <JournalField label="Concerns" value={entry.concerns} />
          <JournalField label="What I Want To Learn Next" value={entry.nextQuestion} />
        </Card>
      ))}
    </section>
  );
}

function JournalField({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-partner-ink">{label}</h3>
      <p className="mt-1 text-sm leading-6 text-partner-muted">{value}</p>
    </div>
  );
}
