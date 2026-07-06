/**
 * Validation for Platform Registry Evolution.
 *
 * These checks enforce the current-registry and Governance Decision input
 * boundary before any registry mutation is attempted.
 */
import { ArtifactStatus } from "../../contracts/artifacts/artifact-status.js";
import type {
  GovernanceApprovedRegistryChange,
  GovernanceDecisionArtifactContent,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  GOVERNANCE_DECISION_ARTIFACT_TYPE,
} from "../../contracts/governance/governance-engine-contract.js";
import {
  PLATFORM_REGISTRY_ARTIFACT_TYPE,
} from "../../contracts/governance/registry-evolution-contract.js";
import type {
  PlatformRegistryEvolutionInput,
} from "../../contracts/governance/registry-evolution-types.js";
import { calculateArtifactHash } from "../../packages/artifact-framework/src/artifact-service.js";
import {
  GovernanceError,
  type PlatformErrorOptions,
} from "../../packages/builder-framework/src/platform-error.js";

export class PlatformRegistryEvolutionValidationError extends GovernanceError {
  constructor(message: string, options: PlatformErrorOptions = {}) {
    super(message, {
      suggestedAction:
        "Correct the Platform Registry Evolution input and retry registry evolution.",
      ...options,
    });
    this.name = "PlatformRegistryEvolutionValidationError";
  }
}

export function validatePlatformRegistryEvolutionInput(
  input: PlatformRegistryEvolutionInput,
): void {
  requireObject(input, "platform_registry_evolution_input");
  requireNonEmptyString(input.execution_id, "execution_id");
  validateCurrentRegistry(input.current_registry.content);
  validateCurrentRegistryArtifact(input);

  if (
    !Array.isArray(input.governance_decisions)
      || input.governance_decisions.length === 0
  ) {
    throw new PlatformRegistryEvolutionValidationError(
      "governance_decisions must be a non-empty array.",
    );
  }

  const decisionIds = new Set<string>();
  for (const decision of input.governance_decisions) {
    validateGovernanceDecisionArtifact(decision.content);
    validateGovernanceDecisionArtifactEnvelope(decision);

    if (decisionIds.has(decision.content.governance_decision_id)) {
      throw new PlatformRegistryEvolutionValidationError(
        "governance_decisions contains a duplicate governance_decision_id.",
      );
    }

    decisionIds.add(decision.content.governance_decision_id);
  }
}

export function validateEvolvedRegistryContent(
  content: TopicRegistryArtifactContent,
  previousRegistryVersion: number,
): void {
  validateCurrentRegistry(content);

  if (content.registry_version !== previousRegistryVersion + 1) {
    throw new PlatformRegistryEvolutionValidationError(
      "Evolved registry_version must increment the previous registry version by one.",
    );
  }
}

function validateCurrentRegistryArtifact(
  input: PlatformRegistryEvolutionInput,
): void {
  const artifact = input.current_registry;
  requireObject(artifact, "current_registry");

  if (artifact.identity.artifact_type !== PLATFORM_REGISTRY_ARTIFACT_TYPE) {
    throw new PlatformRegistryEvolutionValidationError(
      "Platform Registry Evolution must consume a Platform Registry artifact.",
    );
  }

  if (artifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new PlatformRegistryEvolutionValidationError(
      "Current Platform Registry artifact must be active.",
    );
  }

  if (artifact.metadata.artifact_hash !== calculateArtifactHash(artifact.content)) {
    throw new PlatformRegistryEvolutionValidationError(
      "Current Platform Registry artifact hash does not reconcile with content.",
    );
  }
}

function validateGovernanceDecisionArtifactEnvelope(
  artifact: PlatformRegistryEvolutionInput["governance_decisions"][number],
): void {
  requireObject(artifact, "governance_decision_artifact");

  if (artifact.identity.artifact_type !== GOVERNANCE_DECISION_ARTIFACT_TYPE) {
    throw new PlatformRegistryEvolutionValidationError(
      "Platform Registry Evolution must consume Governance Decision artifacts.",
    );
  }

  if (artifact.metadata.status !== ArtifactStatus.ACTIVE) {
    throw new PlatformRegistryEvolutionValidationError(
      "Governance Decision artifact must be active.",
    );
  }

  if (artifact.metadata.artifact_hash !== calculateArtifactHash(artifact.content)) {
    throw new PlatformRegistryEvolutionValidationError(
      "Governance Decision artifact hash does not reconcile with content.",
    );
  }
}

function validateGovernanceDecisionArtifact(
  content: GovernanceDecisionArtifactContent,
): void {
  requireObject(content, "governance_decision");
  requireNonEmptyString(
    content.governance_decision_id,
    "governance_decision_id",
  );
  requireNonEmptyString(
    content.governance_policy_version,
    "governance_policy_version",
  );
  requireNonEmptyString(content.decision_version, "decision_version");

  if (
    content.decision_outcome === "approved"
      && content.registry_impact !== "no_registry_change"
  ) {
    validateApprovedRegistryChange(content.approved_registry_change);
  }
}

function validateApprovedRegistryChange(
  change: GovernanceApprovedRegistryChange | undefined,
): void {
  if (change === undefined) {
    throw new PlatformRegistryEvolutionValidationError(
      "Approved registry mutation decisions must include approved_registry_change.",
    );
  }

  if (change.mutation_type === "create_registry_entry") {
    validateRegistryEntry(change.registry_entry, "approved_registry_change.registry_entry");
    return;
  }

  if (change.mutation_type !== "no_registry_mutation") {
    throw new PlatformRegistryEvolutionValidationError(
      "Only create_registry_entry mutations are supported by the bootstrap Registry Evolution implementation.",
    );
  }
}

function validateCurrentRegistry(content: TopicRegistryArtifactContent): void {
  requireObject(content, "topic_registry_content");
  requirePositiveInteger(content.registry_version, "registry_version");

  if (!Array.isArray(content.topics)) {
    throw new PlatformRegistryEvolutionValidationError(
      "topics must be an array.",
    );
  }

  const topicIds = new Set<string>();
  const canonicalNames = new Set<string>();

  for (const [index, topic] of content.topics.entries()) {
    const field = `topics[${index}]`;
    validateRegistryEntry(topic, field);

    if (topicIds.has(topic.topic_id)) {
      throw new PlatformRegistryEvolutionValidationError(
        "Platform Registry contains duplicate topic_id values.",
      );
    }

    if (canonicalNames.has(normalize(topic.canonical_name))) {
      throw new PlatformRegistryEvolutionValidationError(
        "Platform Registry contains duplicate canonical_name values.",
      );
    }

    topicIds.add(topic.topic_id);
    canonicalNames.add(normalize(topic.canonical_name));
  }
}

function validateRegistryEntry(
  topic: TopicRegistryEntry,
  field: string,
): void {
  requireObject(topic, field);
  requireNonEmptyString(topic.topic_id, `${field}.topic_id`);
  requireNonEmptyString(topic.canonical_name, `${field}.canonical_name`);
  requireNonEmptyString(topic.definition, `${field}.definition`);
  requireNonEmptyString(topic.lifecycle_state, `${field}.lifecycle_state`);
  requirePositiveInteger(
    topic.created_registry_version,
    `${field}.created_registry_version`,
  );
  requirePositiveInteger(
    topic.updated_registry_version,
    `${field}.updated_registry_version`,
  );
  requireNonEmptyString(topic.created_at, `${field}.created_at`);
  requireNonEmptyString(topic.updated_at, `${field}.updated_at`);
  requireStringArray(topic.aliases, `${field}.aliases`);
  requireStringArray(topic.child_topic_ids, `${field}.child_topic_ids`);
  requireStringArray(topic.examples, `${field}.examples`);

  if (topic.created_registry_version > topic.updated_registry_version) {
    throw new PlatformRegistryEvolutionValidationError(
      `${field}.created_registry_version must be less than or equal to updated_registry_version.`,
    );
  }
}

function requireStringArray(value: unknown, field: string): void {
  if (!Array.isArray(value)) {
    throw new PlatformRegistryEvolutionValidationError(
      `${field} must be an array.`,
    );
  }

  for (const item of value) {
    requireNonEmptyString(item, `${field}[]`);
  }
}

function requireObject(
  value: unknown,
  field: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PlatformRegistryEvolutionValidationError(
      `${field} must be an object.`,
    );
  }
}

function requireNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PlatformRegistryEvolutionValidationError(
      `${field} must be a non-empty string.`,
    );
  }
}

function requirePositiveInteger(value: unknown, field: string): void {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new PlatformRegistryEvolutionValidationError(
      `${field} must be a positive integer.`,
    );
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
