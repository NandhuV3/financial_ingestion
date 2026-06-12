import type { OwnerQuestionCard } from "../partner-domain.types.js";

export function buildValuationQuestion(): OwnerQuestionCard {
  return {
    question: "Is the story already too expensive?",
    status: "insufficient_data",
    confidence: "low",
    answer: "Valuation analysis requires market-price data which is not currently available.",
    evidence: [],
  };
}
