import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../contracts/artifacts/artifact-status.js";
import type {
  GovernanceDecisionArtifactContent,
} from "../contracts/artifacts/governance-decision-artifact-content.js";
import type {
  TopicCandidate,
  TopicCandidateArtifactContent,
} from "../contracts/artifacts/topic-candidate-artifact-content.js";
import type {
  TopicRegistryArtifactContent,
} from "../contracts/artifacts/topic-registry-artifact-content.js";
import {
  GOVERNANCE_DECISION_ARTIFACT_TYPE,
  GOVERNANCE_DECISION_PIPELINE_VERSION,
  GOVERNANCE_DECISION_SCHEMA_VERSION,
  GOVERNANCE_DECISION_VERSION,
  GOVERNANCE_ENGINE_ARTIFACT_PRODUCER,
  GOVERNANCE_ENGINE_VERSION,
} from "../contracts/governance/governance-engine-contract.js";
import type { GovernanceEngineInput } from "../contracts/governance/governance-engine-types.js";
import type { GovernancePolicy } from "../contracts/governance/governance-policy-registry-types.js";
import { calculateArtifactHash } from "../packages/artifact-framework/src/artifact-service.js";
import { ArtifactService } from "../packages/artifact-framework/src/artifact-service.js";
import { GovernanceEngine } from "../src/governance-engine/index.js";
import { GovernanceEngineValidationError } from "../src/governance-engine/validator.js";
import { loadGovernancePolicyRegistry } from "../src/governance-policy-registry/index.js";
import { MemoryArtifactRepository } from "../builders/upstream-pipeline/memory-artifact-repository.js";

describe("Governance Engine", () => {
  it("produces one deterministic approved Governance Decision", async () => {
    const input = await governanceInput();
    const first = new GovernanceEngine().execute(input);
    const second = new GovernanceEngine().execute(input);

    assert.deepEqual(first, second);
    assert.equal(first.decision_outcome, "approved");
    assert.equal(first.registry_impact, "create_new_registry_entry");
    assert.equal(
      first.approved_registry_change.mutation_type,
      "create_registry_entry",
    );
    assert.equal(
      first.approved_registry_change.mutation_type === "create_registry_entry"
        ? first.approved_registry_change.registry_entry.topic_id
        : "",
      candidate().proposed_concept.proposed_topic_id,
    );
    assert.equal(
      first.approved_registry_change.mutation_type === "create_registry_entry"
        ? first.approved_registry_change.registry_entry.canonical_name
        : "",
      "Alpha Topic",
    );
    assert.equal(first.decision_version, GOVERNANCE_DECISION_VERSION);
    assert.equal(first.governance_metadata.governance_engine_version, GOVERNANCE_ENGINE_VERSION);
    assert.equal(first.candidate_reference.candidate_id, candidate().candidate_id);
    assert.deepEqual(
      first.decision_basis.rule_evaluations.map((rule) => rule.result),
      ["passed", "passed", "passed"],
    );
  });

  it("rejects duplicate Topic Candidates with no registry mutation", async () => {
    const input = await governanceInput({
      candidate: candidate("artificial_intelligence"),
    });
    const first = new GovernanceEngine().execute(input);
    const second = new GovernanceEngine().execute(input);

    assert.deepEqual(first, second);
    assert.equal(first.decision_outcome, "rejected");
    assert.equal(first.registry_impact, "no_registry_change");
    assert.deepEqual(first.approved_registry_change, {
      mutation_type: "no_registry_mutation",
    });
  });

  it("includes Platform Registry version in deterministic Governance Decision identity", async () => {
    const first = new GovernanceEngine().execute(await governanceInput());
    const second = new GovernanceEngine().execute(await governanceInput({
      currentRegistry: platformRegistryArtifact({
        registry_version: 2,
        topics: [],
      }),
    }));

    assert.notEqual(
      first.governance_decision_id,
      second.governance_decision_id,
    );
  });

  it("rejects a candidate with insufficient evidence without mutating inputs", async () => {
    const input = await governanceInput({
      candidate: {
        ...candidate(),
        evidence_summary: {
          ...candidate().evidence_summary,
          candidate_count: 0,
        },
      },
    });
    const decision = new GovernanceEngine().execute(input);

    assert.equal(decision.decision_outcome, "rejected");
    assert.equal(decision.registry_impact, "no_registry_change");
    assert.deepEqual(decision.approved_registry_change, {
      mutation_type: "no_registry_mutation",
    });
    assert.equal(
      decision.decision_basis.rule_evaluations.find((rule) =>
        rule.rule_type === "required_evidence_presence")?.result,
      "failed",
    );
    assert.equal(
      input.topic_candidate_artifact.content.candidates[0]!.evidence_summary
        .candidate_count,
      0,
    );
  });

  it("rejects Topic Candidate artifacts containing multiple candidates", async () => {
    const input = await governanceInput({
      candidateContent: {
        ...topicCandidateContent(candidate()),
        candidates: [
          candidate(),
          {
            ...candidate(),
            candidate_id: "topic-candidate:second",
          },
        ],
      },
    });

    await assert.rejects(
      async () => new GovernanceEngine().execute(input),
      GovernanceEngineValidationError,
    );
  });

  it("rejects inactive Governance Policies", async () => {
    const input = await governanceInput({
      policy: {
        ...(await activePolicy()),
        status: "retired",
      },
    });

    assert.throws(
      () => new GovernanceEngine().execute(input),
      GovernanceEngineValidationError,
    );
  });

  it("rejects unsupported Governance Policy rule types", async () => {
    const input = await governanceInput({
      policy: {
        ...(await activePolicy()),
        rules: [
          {
            ...(await activePolicy()).rules[0]!,
            rule_id: "unsupported-rule",
            rule_type: "duplicate_detection" as never,
          },
        ],
      },
    });

    assert.throws(
      () => new GovernanceEngine().execute(input),
      GovernanceEngineValidationError,
    );
  });

  it("rejects Topic Candidate artifact hash drift", async () => {
    const input = await governanceInput();
    input.topic_candidate_artifact.content.candidates[0]!.candidate_id =
      "topic-candidate:tampered";

    assert.throws(
      () => new GovernanceEngine().execute(input),
      GovernanceEngineValidationError,
    );
  });

  it("persists one Governance Decision Governance Artifact through the Artifact Framework", async () => {
    const input = await governanceInput();
    const artifact = await persistGovernanceDecision(input);

    assert.equal(artifact.identity.artifact_type, GOVERNANCE_DECISION_ARTIFACT_TYPE);
    assert.equal(artifact.identity.company_id, input.topic_candidate_artifact.identity.company_id);
    assert.equal(artifact.identity.period_id, input.topic_candidate_artifact.identity.period_id);
    assert.equal(artifact.identity.version, 1);
    assert.equal(artifact.metadata.schema_version, GOVERNANCE_DECISION_SCHEMA_VERSION);
    assert.equal(artifact.metadata.pipeline_version, GOVERNANCE_DECISION_PIPELINE_VERSION);
    assert.equal(artifact.metadata.artifact_hash, calculateArtifactHash(artifact.content));
    assert.equal(artifact.content.decision_outcome, "approved");
    assert.equal(artifact.content.candidate_reference.candidate_id, candidate().candidate_id);
    assert.equal(
      artifact.content.approved_registry_change.mutation_type,
      "create_registry_entry",
    );

    const contentRecord = artifact.content as unknown as Record<string, unknown>;
    const candidateReference = artifact.content.candidate_reference as unknown as Record<string, unknown>;

    assert.equal(contentRecord.lineage, undefined);
    assert.equal(candidateReference.artifact_hash, undefined);
    assert.deepEqual(artifact.lineage.upstream_dependencies, [
      {
        artifact_id: input.topic_candidate_artifact.identity.artifact_id,
        artifact_type: input.topic_candidate_artifact.identity.artifact_type,
        version: input.topic_candidate_artifact.identity.version,
        artifact_hash: input.topic_candidate_artifact.metadata.artifact_hash,
        input_hash: input.topic_candidate_artifact.metadata.input_hash,
      },
      {
        artifact_id: input.current_platform_registry.identity.artifact_id,
        artifact_type: input.current_platform_registry.identity.artifact_type,
        version: input.current_platform_registry.identity.version,
        artifact_hash: input.current_platform_registry.metadata.artifact_hash,
        input_hash: input.current_platform_registry.metadata.input_hash,
      },
    ]);
    assert.equal(
      artifact.lineage.generation_context.builder_type,
      GOVERNANCE_ENGINE_ARTIFACT_PRODUCER,
    );
    assert.equal(
      artifact.lineage.generation_context.execution_id,
      input.execution_id,
    );
  });

  it("produces deterministic Governance Decision artifact identity and hash", async () => {
    const input = await governanceInput();
    const first = await persistGovernanceDecision(input);
    const second = await persistGovernanceDecision(input);

    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.metadata.artifact_hash, second.metadata.artifact_hash);
    assert.deepEqual(first.content, second.content);
    assert.deepEqual(first.lineage, second.lineage);
  });

  it("uses Artifact Framework versioning for repeated Governance Decision persistence", async () => {
    const input = await governanceInput();
    const repository = new MemoryArtifactRepository();
    const artifactService = new ArtifactService(repository);
    const engine = new GovernanceEngine();

    const first = await engine.executeArtifact(input, artifactService, {
      generatedAt: "2026-07-04T00:00:00.000Z",
      generationDurationMs: 0,
    });
    const second = await engine.executeArtifact(input, artifactService, {
      generatedAt: "2026-07-04T00:00:00.000Z",
      generationDurationMs: 0,
    });

    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.identity.version, 1);
    assert.equal(second.identity.version, 2);
    assert.equal(second.metadata.version, 2);
  });
});

async function persistGovernanceDecision(
  input: GovernanceEngineInput,
): Promise<Artifact<GovernanceDecisionArtifactContent>> {
  return new GovernanceEngine().executeArtifact(
    input,
    new ArtifactService(new MemoryArtifactRepository()),
    {
      generatedAt: "2026-07-04T00:00:00.000Z",
      generationDurationMs: 0,
    },
  );
}

async function governanceInput(options: {
  candidate?: TopicCandidate;
  candidateContent?: TopicCandidateArtifactContent;
  policy?: GovernancePolicy;
  currentRegistry?: Artifact<TopicRegistryArtifactContent>;
} = {}): Promise<GovernanceEngineInput> {
  const content = options.candidateContent
    ?? topicCandidateContent(options.candidate ?? candidate());

  return {
    topic_candidate_artifact: topicCandidateArtifact(content),
    governance_policy: options.policy ?? await activePolicy(),
    current_platform_registry:
      options.currentRegistry ?? platformRegistryArtifact(),
    execution_id: "governance-execution-1",
  };
}

async function activePolicy(): Promise<GovernancePolicy> {
  return (await loadGovernancePolicyRegistry()).getActivePolicy();
}

function topicCandidateArtifact(
  content: TopicCandidateArtifactContent,
): Artifact<TopicCandidateArtifactContent> {
  return {
    identity: {
      artifact_id: "topic-candidate-artifact-1",
      artifact_type: "topic_candidate",
      company_id: "PLATFORM",
      period_id: "PLATFORM_INTELLIGENCE",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "topic-candidate-artifact-v1",
      pipeline_version: "platform-intelligence-pipeline-v1",
      generated_at: "2026-07-02T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "topic-candidate-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "candidate-discovery-builder",
        execution_id: "candidate-discovery-execution",
      },
    },
    content,
  };
}

function topicCandidateContent(
  topicCandidate: TopicCandidate,
): TopicCandidateArtifactContent {
  return {
    discovery_context: {
      candidate_discovery_version: "candidate-discovery-bootstrap-v1",
      aggregation_id: "aggregation:one",
      aggregation_version: "cross-company-aggregation-v1",
      aggregation_configuration_version: "cross-company-default-v1",
      candidate_count: 1,
    },
    candidates: [topicCandidate],
  };
}

function platformRegistryArtifact(
  content: TopicRegistryArtifactContent = {
    registry_version: 1,
    topics: [
      {
        topic_id: "artificial_intelligence",
        canonical_name: "Artificial Intelligence",
        definition: "Existing AI platform topic.",
        aliases: [],
        lifecycle_state: "active",
        created_registry_version: 1,
        updated_registry_version: 1,
        child_topic_ids: [],
        examples: [],
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      },
    ],
  },
): Artifact<TopicRegistryArtifactContent> {
  return {
    identity: {
      artifact_id: `platform-registry-artifact:${content.registry_version}`,
      artifact_type: "topic_registry",
      company_id: null,
      period_id: null,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "platform-registry-artifact-v1",
      pipeline_version: "platform-registry-evolution-v1",
      generated_at: "2026-07-01T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `platform-registry-input:${content.registry_version}`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "platform-registry-bootstrap-loader",
        execution_id: "platform-registry-bootstrap",
      },
    },
    content,
  };
}

function candidate(
  topicId = "alpha_topic",
): TopicCandidate {
  return {
    candidate_id: `topic-candidate:${topicId}`,
    candidate_type: "topic_candidate",
    candidate_version: "topic-candidate-v1",
    proposed_concept: {
      proposed_topic_id: topicId,
      registry_version: 1,
    },
    evidence_summary: {
      candidate_count: 2,
      accepted_count: 1,
      rejected_count: 1,
      final_assignment_count: 1,
      company_count: 1,
      reporting_period_count: 1,
      filing_count: 1,
      theme_count: 2,
      assignment_method_counts: {
        exact_match: 1,
        semantic_match: 1,
        human_override: 0,
      },
      similarity: {
        count: 2,
        average: 0.82,
        minimum: 0.64,
        maximum: 1,
        p50: 0.64,
        p90: 1,
        histogram: [
          { range_start: 0, range_end: 0.5, count: 0 },
          { range_start: 0.5, range_end: 1, count: 2 },
        ],
      },
    },
    supporting_aggregation: {
      aggregation_id: "aggregation:one",
      aggregation_version: "cross-company-aggregation-v1",
      aggregation_configuration_version: "cross-company-default-v1",
      registry_versions: [1],
    },
    candidate_metadata: {
      builder_version: "candidate-discovery-builder-v1",
      candidate_discovery_version: "candidate-discovery-bootstrap-v1",
    },
  };
}
