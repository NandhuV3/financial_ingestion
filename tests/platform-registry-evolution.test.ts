import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../contracts/artifacts/artifact-status.js";
import type {
  GovernanceApprovedRegistryChange,
  GovernanceDecisionArtifactContent,
} from "../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../contracts/artifacts/topic-registry-artifact-content.js";
import {
  GOVERNANCE_DECISION_ARTIFACT_TYPE,
} from "../contracts/governance/governance-engine-contract.js";
import {
  PLATFORM_REGISTRY_ARTIFACT_TYPE,
  PLATFORM_REGISTRY_EVOLUTION_ARTIFACT_PRODUCER,
  PLATFORM_REGISTRY_PIPELINE_VERSION,
  PLATFORM_REGISTRY_SCHEMA_VERSION,
} from "../contracts/governance/registry-evolution-contract.js";
import type {
  PlatformRegistryEvolutionInput,
} from "../contracts/governance/registry-evolution-types.js";
import { ArtifactService, calculateArtifactHash } from "../packages/artifact-framework/src/artifact-service.js";
import { MemoryArtifactRepository } from "../builders/upstream-pipeline/memory-artifact-repository.js";
import {
  PlatformRegistryEvolution,
  PlatformRegistryEvolutionValidationError,
} from "../src/platform-registry-evolution/index.js";

describe("Platform Registry Evolution", () => {
  it("applies approved registry changes to create expected registry entries", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:approved",
        outcome: "approved",
        registryImpact: "create_new_registry_entry",
        approvedRegistryChange: {
          mutation_type: "create_registry_entry",
          registry_entry: newTopic("cloud_security", "Cloud Security", 2),
        },
      }),
    ]);

    const artifact = await persistRegistry(input);

    assert.equal(artifact.identity.artifact_type, PLATFORM_REGISTRY_ARTIFACT_TYPE);
    assert.equal(artifact.content.registry_version, 2);
    assert.deepEqual(
      artifact.content.topics.map((topic) => topic.topic_id),
      ["artificial_intelligence", "cloud_security"],
    );
    assert.equal(
      artifact.content.topics.find((topic) =>
        topic.topic_id === "cloud_security")?.canonical_name,
      "Cloud Security",
    );
  });

  it("does not modify registry topics for rejected Governance Decisions", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:rejected",
        outcome: "rejected",
        registryImpact: "no_registry_change",
      }),
    ]);
    const originalTopics = structuredClone(input.current_registry.content.topics);

    const artifact = await persistRegistry(input);

    assert.deepEqual(artifact.content.topics, originalTopics);
    assert.equal(artifact.content.registry_version, 2);
  });

  it("does not modify registry topics for deferred Governance Decisions", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:deferred",
        outcome: "deferred",
        registryImpact: "no_registry_change",
      }),
    ]);
    const originalTopics = structuredClone(input.current_registry.content.topics);

    const artifact = await persistRegistry(input);

    assert.deepEqual(artifact.content.topics, originalTopics);
    assert.equal(artifact.content.registry_version, 2);
  });

  it("rejects approved mutation decisions without an approved registry change", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:missing-change",
        outcome: "approved",
        registryImpact: "create_new_registry_entry",
      }),
    ]);

    await assert.rejects(
      async () => persistRegistry(input),
      PlatformRegistryEvolutionValidationError,
    );
  });

  it("produces deterministic registry artifact identity and hash", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:approved",
        outcome: "approved",
        registryImpact: "create_new_registry_entry",
        approvedRegistryChange: {
          mutation_type: "create_registry_entry",
          registry_entry: newTopic("cloud_security", "Cloud Security", 2),
        },
      }),
    ]);

    const first = await persistRegistry(input);
    const second = await persistRegistry(input);

    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.metadata.artifact_hash, second.metadata.artifact_hash);
    assert.deepEqual(first.content, second.content);
    assert.deepEqual(first.lineage, second.lineage);
  });

  it("uses Artifact Framework versioning for repeated Platform Registry persistence", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:approved",
        outcome: "approved",
        registryImpact: "create_new_registry_entry",
        approvedRegistryChange: {
          mutation_type: "create_registry_entry",
          registry_entry: newTopic("cloud_security", "Cloud Security", 2),
        },
      }),
    ]);
    const repository = new MemoryArtifactRepository();
    const artifactService = new ArtifactService(repository);
    const evolution = new PlatformRegistryEvolution();

    const first = await evolution.evolveArtifact(input, artifactService, {
      generatedAt: "2026-07-06T00:00:00.000Z",
      generationDurationMs: 0,
    });
    const second = await evolution.evolveArtifact(input, artifactService, {
      generatedAt: "2026-07-06T00:00:00.000Z",
      generationDurationMs: 0,
    });

    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.identity.version, 1);
    assert.equal(second.identity.version, 2);
    assert.equal(second.metadata.version, 2);
  });

  it("preserves previous registry immutability", async () => {
    const input = evolutionInput([
      governanceDecisionArtifact({
        decisionId: "governance-decision:approved",
        outcome: "approved",
        registryImpact: "create_new_registry_entry",
        approvedRegistryChange: {
          mutation_type: "create_registry_entry",
          registry_entry: newTopic("cloud_security", "Cloud Security", 2),
        },
      }),
    ]);
    const before = structuredClone(input.current_registry);

    await persistRegistry(input);

    assert.deepEqual(input.current_registry, before);
  });

  it("records Artifact Framework lineage to registry and Governance Decisions only", async () => {
    const decision = governanceDecisionArtifact({
      decisionId: "governance-decision:approved",
      outcome: "approved",
      registryImpact: "create_new_registry_entry",
      approvedRegistryChange: {
        mutation_type: "create_registry_entry",
        registry_entry: newTopic("cloud_security", "Cloud Security", 2),
      },
    });
    const input = evolutionInput([decision]);

    const artifact = await persistRegistry(input);

    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map((dependency) =>
        dependency.artifact_type),
      ["topic_registry", "governance_decision"],
    );
    assert.equal(
      artifact.lineage.generation_context.builder_type,
      PLATFORM_REGISTRY_EVOLUTION_ARTIFACT_PRODUCER,
    );
    assert.equal(
      artifact.lineage.upstream_dependencies.some((dependency) =>
        dependency.artifact_type === "topic_candidate"),
      false,
    );
  });
});

async function persistRegistry(
  input: PlatformRegistryEvolutionInput,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  return new PlatformRegistryEvolution().evolveArtifact(
    input,
    new ArtifactService(new MemoryArtifactRepository()),
    {
      generatedAt: "2026-07-06T00:00:00.000Z",
      generationDurationMs: 0,
    },
  );
}

function evolutionInput(
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): PlatformRegistryEvolutionInput {
  return {
    current_registry: topicRegistryArtifact(currentRegistryContent()),
    governance_decisions: decisions,
    execution_id: "platform-registry-evolution-execution-1",
  };
}

function topicRegistryArtifact(
  content: TopicRegistryArtifactContent,
): Artifact<TopicRegistryArtifactContent> {
  return {
    identity: {
      artifact_id: "topic-registry-artifact:current",
      artifact_type: "topic_registry",
      company_id: "PLATFORM",
      period_id: "PLATFORM_INTELLIGENCE",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: PLATFORM_REGISTRY_SCHEMA_VERSION,
      pipeline_version: PLATFORM_REGISTRY_PIPELINE_VERSION,
      generated_at: "2026-07-05T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "topic-registry-input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "platform-registry-bootstrap",
        execution_id: "platform-registry-bootstrap-execution",
      },
    },
    content,
  };
}

function governanceDecisionArtifact(input: {
  decisionId: string;
  outcome: GovernanceDecisionArtifactContent["decision_outcome"];
  registryImpact: GovernanceDecisionArtifactContent["registry_impact"];
  approvedRegistryChange?: GovernanceApprovedRegistryChange;
}): Artifact<GovernanceDecisionArtifactContent> {
  const content: GovernanceDecisionArtifactContent = {
    governance_decision_id: input.decisionId,
    governance_policy_version: "topic-candidate-governance-v1",
    decision_version: "governance-decision-v1",
    candidate_reference: {
      artifact_id: "topic-candidate-artifact:one",
      artifact_version: 1,
      candidate_id: `topic-candidate:${input.decisionId}`,
      candidate_version: "topic-candidate-v1",
    },
    decision_outcome: input.outcome,
    decision_basis: {
      rule_evaluations: [
        {
          rule_id: "candidate-eligibility-v1",
          rule_type: "candidate_eligibility",
          result: input.outcome === "approved" ? "passed" : "failed",
          reason: "Governance replay test fixture.",
        },
      ],
    },
    registry_impact: input.registryImpact,
    approved_registry_change: input.approvedRegistryChange ?? {
      mutation_type: "no_registry_mutation",
    },
    governance_metadata: {
      governance_engine_version: "governance-engine-v1",
      governance_policy_version: "topic-candidate-governance-v1",
      execution_id: `governance-execution:${input.decisionId}`,
    },
  };

  return {
    identity: {
      artifact_id: `governance-decision-artifact:${input.decisionId}`,
      artifact_type: GOVERNANCE_DECISION_ARTIFACT_TYPE,
      company_id: "PLATFORM",
      period_id: "PLATFORM_INTELLIGENCE",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "governance-decision-artifact-v1",
      pipeline_version: "platform-governance-pipeline-v1",
      generated_at: "2026-07-05T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `governance-decision-input:${input.decisionId}`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "governance-engine",
        execution_id: `governance-execution:${input.decisionId}`,
      },
    },
    content,
  };
}

function currentRegistryContent(): TopicRegistryArtifactContent {
  return {
    registry_version: 1,
    topics: [
      newTopic("artificial_intelligence", "Artificial Intelligence", 1),
    ],
  };
}

function newTopic(
  topicId: string,
  canonicalName: string,
  registryVersion: number,
): TopicRegistryEntry {
  return {
    topic_id: topicId,
    canonical_name: canonicalName,
    definition: `${canonicalName} platform registry definition.`,
    aliases: [`${canonicalName} Alias`],
    lifecycle_state: "active",
    created_registry_version: registryVersion,
    updated_registry_version: registryVersion,
    child_topic_ids: [],
    examples: [`${canonicalName} example`],
    created_at: "2026-07-06T00:00:00.000Z",
    updated_at: "2026-07-06T00:00:00.000Z",
  };
}
