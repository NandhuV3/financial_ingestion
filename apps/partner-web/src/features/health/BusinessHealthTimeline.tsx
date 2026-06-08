import React from "react";
import { formatDate } from "../../lib/dates/format-date";
import type { PartnerCompanyViewModel } from "../company/types/partner-company-view-model";
import { formatHealthStatus } from "./health-formatting";

interface BusinessHealthTimelineProps {
  timeline: NonNullable<PartnerCompanyViewModel["health"]>["timeline"];
}

export function BusinessHealthTimeline({ timeline }: BusinessHealthTimelineProps) {
  if (timeline.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-partner-muted">Business Direction Over Time</h3>
      <ol className="mt-3 space-y-3">
        {timeline.map((point) => (
          <li key={`${point.label}-${point.filingDate}`} className="flex items-center justify-between gap-4 rounded-md border border-partner-line bg-partner-paper px-3 py-2">
            <div>
              <p className="text-sm font-medium text-partner-ink">{point.label}</p>
              <p className="text-xs text-partner-muted">{formatDate(point.filingDate)}</p>
            </div>
            <p className="text-sm font-semibold text-partner-ink">{formatHealthStatus(point.status)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
