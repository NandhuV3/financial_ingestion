import type {
  BusinessHealth,
  BusinessHealthDashboard,
  ForensicsSignal,
  OwnerQuestionCard,
} from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { sentenceList } from "./business-language.js";

const question = "Can the story be trusted?";

export function buildTrustQuestion(params: {
  artifacts: PartnerSourceArtifacts;
  businessHealth: BusinessHealth;
  health: BusinessHealthDashboard;
  forensics: ForensicsSignal[];
}): OwnerQuestionCard {
  const risks = sentenceList(params.artifacts.companyKnowledge.risks, "the business risks described by Company Knowledge");
  const watchAreas = sentenceList(params.health.watchAreas.map((area) => area.title), "the areas owners should keep watching");
  const forensicSignals = sentenceList(params.forensics.map((signal) => signal.label), "available risk signals");

  return {
    question,
    answer: `The story can be trusted only if the owner keeps checking ${risks}. Current business health is ${params.businessHealth}, and the main watch areas are ${watchAreas}. Forensics also highlight ${forensicSignals}.`,
    confidence: confidenceFromRiskSignals(params.artifacts.companyKnowledge.risks.length, params.forensics.length),
    evidence: [
      "risks",
      "forensics",
      "business_health",
      ...(params.health.watchAreas.length > 0 ? ["watch_areas"] : []),
    ],
    status: "answered",
  };
}

function confidenceFromRiskSignals(riskCount: number, forensicCount: number): OwnerQuestionCard["confidence"] {
  if (riskCount >= 2 && forensicCount >= 2) return "high";
  if (riskCount >= 1 || forensicCount >= 1) return "medium";
  return "low";
}
