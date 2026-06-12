import React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import type { OwnerQuestionCardViewModel, PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface FiveQuestionsSectionProps {
  fiveQuestions?: PartnerCompanyViewModel["fiveQuestions"];
}

const questionOrder: Array<{
  key: keyof NonNullable<PartnerCompanyViewModel["fiveQuestions"]>;
}> = [
  { key: "business" },
  { key: "growth" },
  { key: "trust" },
  { key: "valuation" },
  { key: "holdThesis" },
];

const confidenceClasses: Record<string, string> = {
  high: "border-partner-accent bg-partner-paper text-partner-accent",
  medium: "border-partner-amber bg-partner-paper text-partner-amber",
  low: "border-partner-line bg-partner-paper text-partner-muted",
};

export function FiveQuestionsSection({ fiveQuestions }: FiveQuestionsSectionProps) {
  if (!fiveQuestions) {
    return null;
  }

  const cards = questionOrder
    .map(({ key }) => fiveQuestions[key])
    .filter((card) => card.question.trim() && card.answer.trim());

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Five Questions">
      <div>
        <h2 className="text-2xl font-semibold text-partner-ink">Five Questions</h2>
      </div>

      <div className="grid gap-3">
        {cards.map((card) => (
          <QuestionCard key={card.question} card={card} />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({ card }: { card: OwnerQuestionCardViewModel }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-partner-ink">{card.question}</h3>
        <div className="flex flex-wrap gap-2">
          {card.status === "insufficient_data" && (
            <Badge className="border-partner-line bg-partner-paper text-partner-muted">Insufficient data</Badge>
          )}
          {card.confidence && (
            <Badge className={confidenceClasses[card.confidence] ?? "border-partner-line text-partner-muted"}>
              Confidence: {card.confidence}
            </Badge>
          )}
        </div>
      </div>
      <p className="mt-3 text-base leading-7 text-partner-muted">{card.answer}</p>
    </Card>
  );
}
