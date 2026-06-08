import React from "react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../company/types/partner-company-view-model";
import { BusinessHealthTimeline } from "./BusinessHealthTimeline";
import { formatHealthStatus } from "./health-formatting";

interface BusinessHealthCardProps {
  health?: PartnerCompanyViewModel["health"];
}

export function BusinessHealthCard({ health }: BusinessHealthCardProps) {
  if (!health) {
    return (
      <Card>
        <h2 className="text-2xl font-semibold text-partner-ink">Business Health</h2>
        <p className="mt-3 text-base leading-7 text-partner-muted">Business health is not available yet.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-partner-ink">Business Health</h2>
          <p className="mt-2 text-base leading-7 text-partner-muted">{health.explanation}</p>
        </div>
        <Badge className="capitalize">Health: {formatHealthStatus(health.status)}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HealthAreaList title="Getting Stronger" marker="✓" items={health.strengtheningAreas} emptyText="No strengthening areas are visible yet." />
        <HealthAreaList title="Watch Closely" marker="⚠" items={health.watchAreas} emptyText="No watch areas are visible yet." />
      </div>

      <BusinessHealthTimeline timeline={health.timeline} />
    </Card>
  );
}

function HealthAreaList({
  title,
  marker,
  items,
  emptyText,
}: {
  title: string;
  marker: string;
  items: Array<{ title: string; explanation: string }>;
  emptyText: string;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-partner-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-partner-muted">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 3).map((item) => (
            <li key={item.title} className="flex gap-2 text-sm leading-6 text-partner-ink">
              <span aria-hidden="true" className="mt-0.5">{marker}</span>
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="block text-partner-muted">{item.explanation}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
