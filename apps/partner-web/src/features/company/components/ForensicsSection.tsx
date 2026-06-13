import React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface ForensicsSectionProps {
  company: PartnerCompanyViewModel;
}

const statusClasses: Record<string, string> = {
  green: "border-partner-accent bg-partner-paper text-partner-accent",
  yellow: "border-partner-amber bg-partner-paper text-partner-amber",
  red: "border-red-700 bg-red-50 text-red-700",
};

export function ForensicsSection({ company }: ForensicsSectionProps) {
  return (
    <section
      id="company-panel-forensics"
      aria-label="Forensics signals"
    >
      <Card className="divide-y divide-partner-line p-5">
        {company.forensics.map((signal) => (
          <article key={signal.title} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-partner-ink">{signal.title}</h3>
              <Badge className={statusClasses[signal.status] ?? "border-partner-line text-partner-muted"}>
                {signal.status}
              </Badge>
            </div>
            <p className="mt-2 text-base leading-7 text-partner-muted">{signal.description}</p>
          </article>
        ))}
      </Card>
    </section>
  );
}
