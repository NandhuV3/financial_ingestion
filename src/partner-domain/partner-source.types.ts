import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { InvestorInsight } from "../insights/insight.types.js";
import type { InvestorNarrative } from "../narratives/narrative.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";

export type PartnerTopicEvolutionSource = {
  summary?: Record<string, number>;
  generated_at?: string;
};

export type PartnerSourceArtifacts = {
  filing: FilingMetadata;
  themes: ThemeOutput | null;
  insight: InvestorInsight | null;
  narrative: InvestorNarrative | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};
