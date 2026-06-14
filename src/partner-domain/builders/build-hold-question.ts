import type {
  BusinessHealth,
  OwnerQuestionCard,
} from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

const question = "Why would I hold it and what would change that?";

export function buildHoldQuestion(params: {
  artifacts: PartnerSourceArtifacts;
  businessHealth: BusinessHealth;
  businessQuestion: OwnerQuestionCard;
  growthQuestion: OwnerQuestionCard;
  trustQuestion: OwnerQuestionCard;
}): OwnerQuestionCard {
  const priorities = sentenceList(params.artifacts.companyKnowledge.strategic_priorities, "the strategic priorities described by Company Knowledge");
  const risks = sentenceList(params.artifacts.companyKnowledge.risks, "the risks described by Company Knowledge");

  return {
    question,
    answer: `An owner might hold while the business remains understandable, its next growth sources remain credible, and business health is ${params.businessHealth}. The hold case rests on ${priorities}. Conviction would weaken if ${risks} start damaging the growth story or the trust signals stop supporting the business.`,
    confidence: confidenceFromQuestions([
      params.businessQuestion,
      params.growthQuestion,
      params.trustQuestion,
    ]),
    evidence: [
      "business_health",
      "strategic_priorities",
      "growth_question",
      "trust_question",
    ],
    status: "answered",
  };
}

function confidenceFromQuestions(questions: OwnerQuestionCard[]): OwnerQuestionCard["confidence"] {
  const high = questions.filter((question) => question.confidence === "high").length;
  const low = questions.filter((question) => question.confidence === "low").length;

  if (high >= 2 && low === 0) return "high";
  if (low >= 2) return "low";
  return "medium";
}
