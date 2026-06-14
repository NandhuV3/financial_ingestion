import React from "react";
import { Card } from "../../../components/ui/Card";
import type { PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface StorySectionProps {
  company: PartnerCompanyViewModel;
}

const storyItems = [
  ["What They Sell", "whatTheySell"],
  ["Who Buys", "whoBuys"],
  ["Why They Win", "whyTheyWin"],
  ["What Could Go Wrong", "whatCouldGoWrong"],
] as const;

export function StorySection({ company }: StorySectionProps) {
  return (
    <section
      id="company-panel-story"
      aria-label="Business story"
      className="space-y-4"
    >
      <Card className="space-y-5 p-5">
        <NarrativeSubsection
          label="Neighborhood Analogy"
          text={company.neighbourhoodExplanation || company.story.whatTheySell}
          emphasis
        />
        {storyItems.map(([label, field]) => (
          <NarrativeSubsection key={label} label={label} text={company.story[field]} />
        ))}
      </Card>
    </section>
  );
}

function NarrativeSubsection({
  label,
  text,
  emphasis = false,
}: {
  label: string;
  text: string;
  emphasis?: boolean;
}) {
  return (
    <article className="border-t border-partner-line pt-5 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-partner-muted">{label}</p>
      <p className={`mt-2 ${emphasis ? "text-lg leading-8 text-partner-ink" : "text-base leading-8 text-partner-muted"}`}>
        {text}
      </p>
    </article>
  );
}
