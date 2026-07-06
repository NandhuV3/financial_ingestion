/**
 * Deterministic Platform Registry Evolution executor.
 *
 * The executor applies only approved registry changes carried by Governance
 * Decision artifacts and persists the next Platform Registry through the
 * Artifact Framework.
 */
import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  PLATFORM_REGISTRY_ARTIFACT_TYPE,
  PLATFORM_REGISTRY_EVOLUTION_ARTIFACT_PRODUCER,
  PLATFORM_REGISTRY_EVOLUTION_VERSION,
  PLATFORM_REGISTRY_PIPELINE_VERSION,
  PLATFORM_REGISTRY_SCHEMA_VERSION,
} from "../../contracts/governance/registry-evolution-contract.js";
import type {
  PlatformRegistryEvolutionArtifactOptions,
  PlatformRegistryEvolutionInput,
} from "../../contracts/governance/registry-evolution-types.js";
import { ArtifactService } from "../../packages/artifact-framework/src/artifact-service.js";
import type { ReservedArtifactId } from "../../packages/artifact-framework/src/artifact-types.js";
import { stableHash } from "../shared/hashing/stable-hash.js";
import { createLogger } from "../shared/logger.js";
import {
  validateEvolvedRegistryContent,
  validatePlatformRegistryEvolutionInput,
  PlatformRegistryEvolutionValidationError,
} from "./validator.js";

const logger = createLogger("platform-registry-evolution");

export class PlatformRegistryEvolution {
  evolve(input: PlatformRegistryEvolutionInput): TopicRegistryArtifactContent {
    const startedAt = Date.now();

    logger.info("Platform Registry Evolution execution started.", {
      execution_id: input.execution_id,
      decision_count: input.governance_decisions.length,
    });

    validatePlatformRegistryEvolutionInput(input);

    logger.info("Platform Registry Evolution input validation succeeded.", {
      execution_id: input.execution_id,
      current_registry_version: input.current_registry.content.registry_version,
      decision_count: input.governance_decisions.length,
    });

    const nextRegistryVersion = input.current_registry.content.registry_version + 1;
    const existingTopics = input.current_registry.content.topics.map(cloneTopic);
    const topicsById = new Map(existingTopics.map((topic) => [topic.topic_id, topic]));
    const canonicalNames = new Set(
      existingTopics.map((topic) => normalize(topic.canonical_name)),
    );

    for (const decision of sortedGovernanceDecisions(input.governance_decisions)) {
      applyGovernanceDecision(
        decision.content,
        topicsById,
        canonicalNames,
      );
    }

    const content: TopicRegistryArtifactContent = {
      registry_version: nextRegistryVersion,
      topics: [...topicsById.values()].sort(compareTopics).map(cloneTopic),
    };

    validateEvolvedRegistryContent(
      content,
      input.current_registry.content.registry_version,
    );

    logger.info("Platform Registry Evolution execution completed.", {
      execution_id: input.execution_id,
      current_registry_version: input.current_registry.content.registry_version,
      next_registry_version: content.registry_version,
      topic_count: content.topics.length,
      duration_ms: Date.now() - startedAt,
    });

    return content;
  }

  async evolveArtifact(
    input: PlatformRegistryEvolutionInput,
    artifactService: ArtifactService,
    options: PlatformRegistryEvolutionArtifactOptions = {},
  ): Promise<Artifact<TopicRegistryArtifactContent>> {
    const startedAt = Date.now();
    const content = this.evolve(input);

    logger.info("Platform Registry artifact persistence started.", {
      execution_id: input.execution_id,
      registry_version: content.registry_version,
    });

    const artifact = await artifactService.createArtifact<TopicRegistryArtifactContent>({
      artifact_id: platformRegistryArtifactId(input, content),
      artifact_type: PLATFORM_REGISTRY_ARTIFACT_TYPE,
      company_id: input.current_registry.identity.company_id,
      period_id: input.current_registry.identity.period_id,
      content,
      lineage: {
        upstream_dependencies: [
          {
            artifact_id: input.current_registry.identity.artifact_id,
            artifact_type: input.current_registry.identity.artifact_type,
            version: input.current_registry.identity.version,
            artifact_hash: input.current_registry.metadata.artifact_hash,
            input_hash: input.current_registry.metadata.input_hash,
          },
          ...sortedGovernanceDecisions(input.governance_decisions).map(
            (decision) => ({
              artifact_id: decision.identity.artifact_id,
              artifact_type: decision.identity.artifact_type,
              version: decision.identity.version,
              artifact_hash: decision.metadata.artifact_hash,
              input_hash: decision.metadata.input_hash,
            }),
          ),
        ],
        generation_context: {
          builder_type: PLATFORM_REGISTRY_EVOLUTION_ARTIFACT_PRODUCER,
          execution_id: input.execution_id,
        },
      },
      schema_version: PLATFORM_REGISTRY_SCHEMA_VERSION,
      pipeline_version: PLATFORM_REGISTRY_PIPELINE_VERSION,
      input_hash: platformRegistryEvolutionInputHash(input),
      generation_duration_ms:
        options.generationDurationMs ?? Date.now() - startedAt,
      generated_at: options.generatedAt,
    });

    logger.info("Platform Registry artifact persistence completed.", {
      execution_id: input.execution_id,
      artifact_id: artifact.identity.artifact_id,
      registry_version: artifact.content.registry_version,
      artifact_version: artifact.identity.version,
    });

    return artifact;
  }
}

export function platformRegistryArtifactId(
  input: PlatformRegistryEvolutionInput,
  content: TopicRegistryArtifactContent,
): ReservedArtifactId {
  return `platform-registry-artifact:${stableHash({
    current_registry: {
      artifact_hash: input.current_registry.metadata.artifact_hash,
      artifact_id: input.current_registry.identity.artifact_id,
      version: input.current_registry.identity.version,
    },
    governance_decisions: sortedGovernanceDecisions(input.governance_decisions)
      .map((decision) => ({
        artifact_hash: decision.metadata.artifact_hash,
        artifact_id: decision.identity.artifact_id,
        governance_decision_id: decision.content.governance_decision_id,
        version: decision.identity.version,
      })),
    registry_version: content.registry_version,
    evolution_version: PLATFORM_REGISTRY_EVOLUTION_VERSION,
  })}` as ReservedArtifactId;
}

export function platformRegistryEvolutionInputHash(
  input: PlatformRegistryEvolutionInput,
): string {
  return stableHash({
    current_registry: {
      artifact_hash: input.current_registry.metadata.artifact_hash,
      artifact_id: input.current_registry.identity.artifact_id,
      version: input.current_registry.identity.version,
    },
    governance_decisions: sortedGovernanceDecisions(input.governance_decisions)
      .map((decision) => ({
        artifact_hash: decision.metadata.artifact_hash,
        artifact_id: decision.identity.artifact_id,
        version: decision.identity.version,
      })),
    evolution_version: PLATFORM_REGISTRY_EVOLUTION_VERSION,
  });
}

function applyGovernanceDecision(
  decision: GovernanceDecisionArtifactContent,
  topicsById: Map<string, TopicRegistryEntry>,
  canonicalNames: Set<string>,
): void {
  if (
    decision.decision_outcome !== "approved"
      || decision.registry_impact === "no_registry_change"
  ) {
    return;
  }

  if (
    decision.approved_registry_change === undefined
      || decision.approved_registry_change.mutation_type
        !== "create_registry_entry"
  ) {
    throw new PlatformRegistryEvolutionValidationError(
      "Approved Governance Decision does not carry an executable create_registry_entry change.",
    );
  }

  const registryEntry = cloneTopic(
    decision.approved_registry_change.registry_entry,
  );

  if (topicsById.has(registryEntry.topic_id)) {
    throw new PlatformRegistryEvolutionValidationError(
      "Approved registry change would create a duplicate topic_id.",
    );
  }

  if (canonicalNames.has(normalize(registryEntry.canonical_name))) {
    throw new PlatformRegistryEvolutionValidationError(
      "Approved registry change would create a duplicate canonical_name.",
    );
  }

  topicsById.set(registryEntry.topic_id, registryEntry);
  canonicalNames.add(normalize(registryEntry.canonical_name));
}

function sortedGovernanceDecisions(
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): Array<Artifact<GovernanceDecisionArtifactContent>> {
  return [...decisions].sort((left, right) =>
    left.content.governance_decision_id.localeCompare(
      right.content.governance_decision_id,
    )
      || left.identity.artifact_id.localeCompare(right.identity.artifact_id));
}

function compareTopics(
  left: TopicRegistryEntry,
  right: TopicRegistryEntry,
): number {
  return left.topic_id.localeCompare(right.topic_id);
}

function cloneTopic(topic: TopicRegistryEntry): TopicRegistryEntry {
  return structuredClone(topic);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
