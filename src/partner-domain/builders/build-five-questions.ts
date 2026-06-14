import type {
  BusinessHealth,
  BusinessHealthDashboard,
  FiveQuestions,
  ForensicsSignal,
} from "../partner-domain.types.js";
import type { PartnerSourceArtifacts } from "../partner-source.types.js";
import { buildBusinessQuestion } from "./build-business-question.js";
import { buildGrowthQuestion } from "./build-growth-question.js";
import { buildHoldQuestion } from "./build-hold-question.js";
import { buildTrustQuestion } from "./build-trust-question.js";
import { buildValuationQuestion } from "./build-valuation-question.js";

export function buildFiveQuestions(params: {
  artifacts: PartnerSourceArtifacts;
  businessHealth: BusinessHealth;
  health: BusinessHealthDashboard;
  forensics: ForensicsSignal[];
}): FiveQuestions {
  const business = buildBusinessQuestion(params.artifacts);
  const growth = buildGrowthQuestion(params.artifacts);
  const trust = buildTrustQuestion(params);
  const valuation = buildValuationQuestion();
  const holdThesis = buildHoldQuestion({
    artifacts: params.artifacts,
    businessHealth: params.businessHealth,
    businessQuestion: business,
    growthQuestion: growth,
    trustQuestion: trust,
  });

  return {
    business,
    growth,
    trust,
    valuation,
    holdThesis,
  };
}
