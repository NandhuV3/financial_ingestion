import type { QuarterChangeReport } from "../../change-engine/change.types.js";
import type { FilingMetadata } from "../../types/pipeline.types.js";
import type { ThemeOutput } from "../../types/theme.types.js";
import type { TopicAssignmentOutputV2 } from "../../topic-assignment-v2/assignment.types.js";
import type { PartnerTopicEvolutionSource } from "../../partner-domain/partner-source.types.js";

export type BuildStructuredIntelligenceInputs = {
  filingMetadata: FilingMetadata | null;

  themes: ThemeOutput | null;

  topicAssignments: TopicAssignmentOutputV2 | null;

  topicEvolution: PartnerTopicEvolutionSource | null;

  quarterChanges: QuarterChangeReport | null;

  derivedFrom?: string[];

  schemaVersion?: string;

  pipelineVersion?: string;

  modelVersion?: string;

  promptVersion?: string;

  generatedAt?: string;
};