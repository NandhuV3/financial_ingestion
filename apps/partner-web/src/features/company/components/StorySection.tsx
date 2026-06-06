import React from "react";
import { Card } from "../../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface StorySectionProps {
  company: PartnerCompanyViewModel;
}

const storyItems = [
  ["What they sell", "whatTheySell"],
  ["Who buys", "whoBuys"],
  ["Why they win", "whyTheyWin"],
  ["What could go wrong", "whatCouldGoWrong"],
] as const;

export function StorySection({ company }: StorySectionProps) {
  return (
    <section
      id="company-panel-story"
      role="tabpanel"
      aria-labelledby="company-tab-story"
      className="space-y-4"
    >
      <Card className="bg-partner-paper">
        <p className="text-sm font-semibold uppercase tracking-wide text-partner-muted">
          If this were a shop in your neighbourhood...
        </p>
        <p className="mt-3 text-lg leading-7 text-partner-ink">
          {company.neighbourhoodExplanation || company.story.whatTheySell}
        </p>
      </Card>

      <div className="grid gap-3">
        {storyItems.map(([label, field]) => (
          <Card key={label}>
            <h2 className="text-lg font-semibold text-partner-ink">{label}</h2>
            <p className="mt-2 text-base leading-7 text-partner-muted">{company.story[field]}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
