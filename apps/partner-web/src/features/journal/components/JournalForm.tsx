import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import type { PartnerJournalDraft } from "../types";

interface JournalFormProps {
  onSave: (draft: PartnerJournalDraft) => void;
}

const emptyDraft: PartnerJournalDraft = {
  understanding: "",
  convictionReason: "",
  concerns: "",
  nextQuestion: "",
};

export function JournalForm({ onSave }: JournalFormProps) {
  const [draft, setDraft] = useState<PartnerJournalDraft>(emptyDraft);
  const hasContent = Object.values(draft).some((value) => value.trim().length > 0);

  function updateField(field: keyof PartnerJournalDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasContent) {
      return;
    }

    onSave(draft);
    setDraft(emptyDraft);
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-2xl font-semibold text-partner-ink">Partner Journal</h2>
          <p className="mt-2 text-sm leading-6 text-partner-muted">
            Capture how your understanding of this business is developing over time.
          </p>
        </div>

        <JournalTextarea
          label="My Understanding"
          value={draft.understanding}
          onChange={(value) => updateField("understanding", value)}
          placeholder="What does this business do, and how does it make money?"
        />
        <JournalTextarea
          label="Why I Have Conviction"
          value={draft.convictionReason}
          onChange={(value) => updateField("convictionReason", value)}
          placeholder="What gives you confidence in this business as an owner?"
        />
        <JournalTextarea
          label="Concerns"
          value={draft.concerns}
          onChange={(value) => updateField("concerns", value)}
          placeholder="What could weaken the business or your understanding of it?"
        />
        <JournalTextarea
          label="What I Want To Learn Next"
          value={draft.nextQuestion}
          onChange={(value) => updateField("nextQuestion", value)}
          placeholder="What question should you revisit next time?"
        />

        <Button type="submit" disabled={!hasContent} className={!hasContent ? "bg-partner-muted" : ""}>
          Save Journal Entry
        </Button>
      </form>
    </Card>
  );
}

function JournalTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-partner-ink">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-md border border-partner-line bg-partner-paper px-3 py-2 text-sm leading-6 text-partner-ink focus:outline-none focus:ring-2 focus:ring-partner-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
