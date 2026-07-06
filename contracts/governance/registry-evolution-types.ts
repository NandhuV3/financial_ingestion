import type { Artifact } from "../artifacts/artifact.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../artifacts/topic-registry-artifact-content.js";

export type PlatformRegistryEvolutionInput = {
  current_registry: Artifact<TopicRegistryArtifactContent>;
  governance_decisions: Array<Artifact<GovernanceDecisionArtifactContent>>;
  execution_id: string;
};

export type PlatformRegistryEvolutionArtifactOptions = {
  generatedAt?: string;
  generationDurationMs?: number;
};
