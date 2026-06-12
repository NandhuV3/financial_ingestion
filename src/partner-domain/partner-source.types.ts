import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { CompanyKnowledge } from "../company-knowledge/types/company-knowledge.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { TopicEvolutionReport } from "../topic-evolution/topic-evolution.types.js";

export type PartnerTopicEvolutionSource = Pick<TopicEvolutionReport, "summary" | "generated_at" | "filing_dates" | "topics">;

export type PartnerSourceArtifacts = {
  filing: FilingMetadata;
  companyKnowledge: CompanyKnowledge;
  themes: ThemeOutput | null;
  quarterChange: QuarterChangeReport | null;
  topicEvolution: PartnerTopicEvolutionSource | null;
};
