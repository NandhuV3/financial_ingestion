import React from "react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import type { OwnerQuestionCardViewModel, PartnerCompanyViewModel } from "../types/partner-company-view-model";

interface FiveQuestionsSectionProps {
  fiveQuestions?: PartnerCompanyViewModel["fiveQuestions"];
}

const questionOrder: Array<{
  key: keyof NonNullable<PartnerCompanyViewModel["fiveQuestions"]>;
  label: string;
}> = [
  { key: "business", label: "The Business" },
  { key: "growth", label: "Growth" },
  { key: "trust", label: "Trust" },
  { key: "valuation", label: "Valuation" },
  { key: "holdThesis", label: "Hold Thesis" },
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

  const sections = questionOrder
    .map(({ key, label }) => ({ key, label, card: fiveQuestions[key] }))
    .filter(({ card }) => card.question.trim() && card.answer.trim());

  if (sections.length === 0) {
    return null;
  }

  const reportSections = sections.filter(({ key }) => key !== "holdThesis");
  const holdThesis = sections.find(({ key }) => key === "holdThesis");

  return (
    <section className="space-y-8" aria-label="Owner Thesis">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-partner-muted">
          Owner Thesis
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-partner-ink">Five Questions</h2>
      </div>

      <div className="space-y-8">
        {reportSections.map(({ label, card }, index) => (
          <React.Fragment key={card.question}>
            {index > 0 && <div className="border-t border-partner-line" />}
            <QuestionReportSection label={label} card={card} />
          </React.Fragment>
        ))}
      </div>

      {holdThesis && <HoldThesisCard label={holdThesis.label} card={holdThesis.card} />}
    </section>
  );
}

function QuestionReportSection({
  label,
  card,
}: {
  label: string;
  card: OwnerQuestionCardViewModel;
}) {
  const isValuationUnavailable = card.status === "insufficient_data";

  return (
    <article className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-partner-muted">{label}</p>
          <QuestionBadges card={card} />
        </div>
        <h3 className="text-xl font-semibold text-partner-ink">{card.question}</h3>
      </div>
      <p className="text-base leading-8 text-partner-muted">
        {isValuationUnavailable ? valuationUnavailableMessage : card.answer}
      </p>
    </article>
  );
}

function HoldThesisCard({
  label,
  card,
}: {
  label: string;
  card: OwnerQuestionCardViewModel;
}) {
  return (
    <Card className="p-5">
      <article className="space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-partner-muted">{label}</p>
            <QuestionBadges card={card} />
          </div>
          <h3 className="text-xl font-semibold text-partner-ink">{card.question}</h3>
        </div>
        <p className="text-base leading-8 text-partner-muted">{card.answer}</p>
      </article>
    </Card>
  );
}

function QuestionBadges({ card }: { card: OwnerQuestionCardViewModel }) {
  return (
    <>
      {card.status === "insufficient_data" && (
        <Badge className="border-partner-line bg-partner-paper text-partner-muted">
          Market Data Required
        </Badge>
      )}
      {card.confidence && (
        <Badge className={confidenceClasses[card.confidence] ?? "border-partner-line text-partner-muted"}>
          {formatConfidence(card.confidence)}
        </Badge>
      )}
    </>
  );
}

function formatConfidence(value: OwnerQuestionCardViewModel["confidence"]): string {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).toLowerCase()} Conviction`;
}

const valuationUnavailableMessage =
  "Valuation analysis is unavailable because market-price data is not currently part of the research system.";
