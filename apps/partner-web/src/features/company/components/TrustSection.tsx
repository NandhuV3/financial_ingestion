import React from "react";
import { Card } from "../../../components/ui/Card";
import type { MockCompany } from "../mock/companies";

interface TrustSectionProps {
  company: MockCompany;
}

const trustItems = [
  ["Founder / Leadership", "founder"],
  ["Decision Style", "decisionStyle"],
  ["Long-Term Thinking", "longTermThinking"],
  ["Skin In The Game", "skinInTheGame"],
] as const;

export function TrustSection({ company }: TrustSectionProps) {
  return (
    <section
      id="company-panel-trust"
      role="tabpanel"
      aria-labelledby="company-tab-trust"
      className="space-y-3"
    >
      <p className="text-base leading-7 text-partner-muted">
        Would I trust these people to run my business?
      </p>
      <div className="grid gap-3">
        {trustItems.map(([label, field]) => (
          <Card key={label}>
            <h2 className="text-lg font-semibold text-partner-ink">{label}</h2>
            <p className="mt-2 text-base leading-7 text-partner-muted">{company.trust[field]}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
