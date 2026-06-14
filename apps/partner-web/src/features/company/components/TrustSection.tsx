import React from "react";
import { Card } from "../../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface TrustSectionProps {
  company: PartnerCompanyViewModel;
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
      aria-label="Trust assessment"
    >
      <Card className="space-y-5 p-5">
        <p className="text-base leading-7 text-partner-muted">
          Would I trust these people to run my business?
        </p>
        {trustItems.map(([label, field]) => (
          <TrustAssessmentRow key={label} label={label} value={company.trust[field]} />
        ))}
      </Card>
    </section>
  );
}

function TrustAssessmentRow({ label, value }: { label: string; value: string }) {
  return (
    <article className="border-t border-partner-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-partner-ink">{label}</h3>
      <p className="mt-1 text-base leading-7 text-partner-muted">{value}</p>
    </article>
  );
}
