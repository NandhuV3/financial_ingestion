import React from "react";
import { Card } from "../../../components/ui/Card";

const todayMessages = [
  "Business health changed",
  "Conviction updated",
  "New company explored",
];

export function TodayStrip() {
  return (
    <section aria-labelledby="today-heading" className="space-y-3">
      <h2 id="today-heading" className="text-sm font-semibold uppercase tracking-wide text-partner-muted">
        Today
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {todayMessages.map((message) => (
          <Card key={message} className="p-3">
            <p className="text-sm font-medium text-partner-ink">{message}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
