import type { OwnerQuestionCard } from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

const question = "What does this company actually sell?";

export function buildBusinessQuestion(artifacts: PartnerSourceArtifacts): OwnerQuestionCard {
  const knowledge = artifacts.companyKnowledge;
  const products = sentenceList(knowledge.products, "the products and services described by Company Knowledge");
  const customers = sentenceList(knowledge.customers, "the customer groups described by Company Knowledge");
  const revenueDrivers = sentenceList(knowledge.revenue_drivers, "the revenue drivers described by Company Knowledge");

  return {
    question,
    answer: `${knowledge.business_description} It sells ${products} to ${customers}, and makes money through ${revenueDrivers}.`,
    confidence: confidenceFromParts([
      knowledge.business_description,
      ...knowledge.products,
      ...knowledge.customers,
      ...knowledge.revenue_drivers,
    ]),
    evidence: ["business_description", "products", "customers", "revenue_drivers"],
    status: "answered",
  };
}

function confidenceFromParts(parts: string[]): OwnerQuestionCard["confidence"] {
  const populated = parts.filter((part) => part.trim().length > 0).length;

  if (populated >= 5) return "high";
  if (populated >= 3) return "medium";
  return "low";
}
