import type { Artifact } from "../artifacts/artifact.js";
import type {
  TopicCandidate,
  TopicCandidateArtifactContent,
} from "../artifacts/topic-candidate-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../artifacts/topic-registry-artifact-content.js";
import type { GovernancePolicy } from "./governance-policy-registry-types.js";
import type {
  GovernanceDecisionOutcome,
  GovernancePolicyEvaluationRuleType,
  GovernanceRegistryImpact,
  GovernanceRuleResult,
} from "./governance-engine-contract.js";
import type {
  GovernanceApprovedRegistryChange,
} from "../artifacts/governance-decision-artifact-content.js";

export type GovernanceEngineInput = {
  topic_candidate_artifact: Artifact<TopicCandidateArtifactContent>;
  governance_policy: GovernancePolicy;
  current_platform_registry: Artifact<TopicRegistryArtifactContent>;
  execution_id: string;
};

export type GovernanceDecisionCandidateReference = {
  artifact_id: string;
  artifact_version: number;
  artifact_hash: string;
  candidate_id: string;
  candidate_version: string;
};

export type GovernanceDecisionPolicyReference = {
  policy_id: string;
  policy_version: string;
};

export type GovernanceDecisionRuleEvaluation = {
  rule_id: string;
  rule_type: GovernancePolicyEvaluationRuleType;
  result: GovernanceRuleResult;
  reason: string;
};

export type GovernanceDecisionBasis = {
  rule_evaluations: GovernanceDecisionRuleEvaluation[];
};

export type GovernanceDecisionLineage = {
  topic_candidate: GovernanceDecisionCandidateReference;
  governance_policy: GovernanceDecisionPolicyReference;
  governance_engine_version: string;
};

export type GovernanceDecisionMetadata = {
  governance_engine_version: string;
  governance_policy_version: string;
  execution_id: string;
};

export type GovernanceDecision = {
  governance_decision_id: string;
  governance_policy_version: string;
  decision_version: string;
  candidate_reference: GovernanceDecisionCandidateReference;
  decision_outcome: GovernanceDecisionOutcome;
  decision_basis: GovernanceDecisionBasis;
  registry_impact: GovernanceRegistryImpact;
  approved_registry_change: GovernanceApprovedRegistryChange;
  lineage: GovernanceDecisionLineage;
  governance_metadata: GovernanceDecisionMetadata;
};

export type GovernanceEngineValidationContext = {
  candidate: TopicCandidate;
  input: GovernanceEngineInput;
};
