import type {
  GovernanceDecisionBasis,
  GovernanceDecisionMetadata,
} from "../governance/governance-engine-types.js";
import type {
  GovernanceDecisionOutcome,
  GovernanceRegistryImpact,
} from "../governance/governance-engine-contract.js";

export type GovernanceDecisionCandidateReference = {
  artifact_id: string;
  artifact_version: number;
  candidate_id: string;
  candidate_version: string;
};

export type GovernanceDecisionArtifactContent = {
  governance_decision_id: string;
  governance_policy_version: string;
  decision_version: string;
  candidate_reference: GovernanceDecisionCandidateReference;
  decision_outcome: GovernanceDecisionOutcome;
  decision_basis: GovernanceDecisionBasis;
  registry_impact: GovernanceRegistryImpact;
  governance_metadata: GovernanceDecisionMetadata;
};
