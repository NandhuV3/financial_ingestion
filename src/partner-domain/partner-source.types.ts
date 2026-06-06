import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import type { InvestorNarrative } from "../narratives/narrative.types.js";
import type { CompanyProfileIntelligence } from "../company-profile/company-profile.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../topic-assignment-v2/assignment.types.js";

export type PartnerTopicEvolutionSource = {
  summary?: Record<string, number>;
  generated_at?: string;
};

export type PartnerSourceArtifacts = {
  filing: FilingMetadata;
  companyProfile: CompanyProfileIntelligence;
  themes: ThemeOutput | null;
  topicAssignments: TopicAssignmentOutputV2 | null;
  insight: InvestorInsight | null;
  narrative: InvestorNarrative | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};
