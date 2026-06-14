import type { FiveQuestions, OwnerQuestionCard } from "../../partner-domain/partner-domain.types.js";
import { createScorecard, flattenText, normalize, scoreCoverage } from "../scorecard.js";
import type { HarnessScorecard } from "../harness.types.js";

const expectedQuestions = [
  "business",
  "growth",
  "trust",
  "valuation",
  "holdThesis",
] as const;

export function evaluateFiveQuestions(fiveQuestions: FiveQuestions): HarnessScorecard {
  const cards = expectedQuestions.map((key) => fiveQuestions[key]);
  const presentCards = cards.filter(isQuestionCard);
  const nonEmptyAnswers = presentCards.filter((card) => card.answer.trim().length > 0);
  const answeredCards = presentCards.filter((card) => card.status !== "insufficient_data");
  const answeredWithEvidence = answeredCards.filter((card) => card.evidence.length > 0);
  const genericAnswers = presentCards.filter((card) => isGenericAnswer(card.answer));
  const valuation = fiveQuestions.valuation;
  const warnings = [
    ...genericAnswers.map((card) => `Generic answer detected: ${card.question}`),
    ...answeredCards
      .filter((card) => card.evidence.length === 0)
      .map((card) => `Answered question has no evidence: ${card.question}`),
  ];
  const failures = [
    ...expectedQuestions
      .filter((key) => !isQuestionCard(fiveQuestions[key]))
      .map((key) => `Missing Five Questions card: ${key}`),
    ...(valuation.status === "insufficient_data" ? [] : ["Valuation question must be marked insufficient_data."]),
  ];

  return createScorecard({
    artifact: "five_questions",
    dimensions: [
      {
        name: "all_questions_present",
        score: scoreCoverage(presentCards.length, expectedQuestions.length),
        notes: [`Question cards present: ${presentCards.length}/${expectedQuestions.length}.`],
      },
      {
        name: "non_empty_answers",
        score: scoreCoverage(nonEmptyAnswers.length, expectedQuestions.length),
        notes: [`Non-empty answers: ${nonEmptyAnswers.length}/${expectedQuestions.length}.`],
      },
      {
        name: "valuation_insufficient_data",
        score: valuation.status === "insufficient_data" ? 1 : 0,
        notes: [`Valuation status: ${valuation.status ?? "missing"}.`],
      },
      {
        name: "evidence_population",
        score: scoreCoverage(answeredWithEvidence.length, answeredCards.length),
        notes: [`Answered cards with evidence: ${answeredWithEvidence.length}/${answeredCards.length}.`],
      },
      {
        name: "answer_specificity",
        score: scoreCoverage(presentCards.length - genericAnswers.length, presentCards.length),
        notes: genericAnswers.length === 0
          ? ["No generic Five Questions answers detected."]
          : genericAnswers.map((card) => `Generic answer: ${card.question}`),
      },
    ],
    warnings,
    failures,
  });
}

function isQuestionCard(value: unknown): value is OwnerQuestionCard {
  return typeof value === "object"
    && value !== null
    && typeof (value as OwnerQuestionCard).question === "string"
    && typeof (value as OwnerQuestionCard).answer === "string"
    && ["high", "medium", "low"].includes((value as OwnerQuestionCard).confidence)
    && Array.isArray((value as OwnerQuestionCard).evidence);
}

function isGenericAnswer(answer: string): boolean {
  const normalized = normalize(answer);
  const textValues = flattenText(answer).join(" ");

  return !normalized
    || normalized.includes("available information")
    || normalized.includes("not enough information")
    || textValues.trim().split(/\s+/).length < 8;
}
