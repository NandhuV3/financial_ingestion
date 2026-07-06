import type {
  GovernanceDecisionBasis,
  GovernanceDecisionMetadata,
} from "../governance/governance-engine-types.js";
import type {
  GovernanceDecisionOutcome,
  GovernanceRegistryImpact,
} from "../governance/governance-engine-contract.js";
import type {
  TopicRegistryEntry,
} from "./topic-registry-artifact-content.js";

export type GovernanceDecisionCandidateReference = {
  artifact_id: string;
  artifact_version: number;
  candidate_id: string;
  candidate_version: string;
};

export type GovernanceApprovedRegistryChange =
  | {
    mutation_type: "no_registry_mutation";
  }
  | {
    mutation_type: "create_registry_entry";
    registry_entry: TopicRegistryEntry;
  }
  | {
    mutation_type: "merge_registry_entries";
  }
  | {
    mutation_type: "supersede_registry_entry";
  };

export type GovernanceDecisionArtifactContent = {
  governance_decision_id: string;
  governance_policy_version: string;
  decision_version: string;
  candidate_reference: GovernanceDecisionCandidateReference;
  decision_outcome: GovernanceDecisionOutcome;
  decision_basis: GovernanceDecisionBasis;
  registry_impact: GovernanceRegistryImpact;
  approved_registry_change: GovernanceApprovedRegistryChange;
  governance_metadata: GovernanceDecisionMetadata;
};
