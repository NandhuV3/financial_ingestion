import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type {
  AggregationResultArtifactContent,
  AggregatedTopicStatistics,
} from "../../../contracts/artifacts/aggregation-result-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  TopicCandidateArtifactContent,
} from "../../../contracts/artifacts/topic-candidate-artifact-content.js";
import { ArtifactService, calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import { CandidateDiscoveryBuilder } from "../builder.js";
import {
  listCandidateDiscoveryTargets,
  topicCandidateArtifactId,
} from "../candidate-discovery.js";
import {
  CANDIDATE_DISCOVERY_BUILDER_TYPE,
  CANDIDATE_DISCOVERY_VERSION,
  TOPIC_CANDIDATE_ARTIFACT_TYPE,
  TOPIC_CANDIDATE_PIPELINE_VERSION,
  TOPIC_CANDIDATE_SCHEMA_VERSION,
} from "../contract.js";
import type { CandidateDiscoveryBuilderInput } from "../types.js";

describe("CandidateDiscoveryBuilder", () => {
  it("creates one deterministic Topic Candidate Governance Artifact per target", async () => {
    const firstAggregation = aggregationArtifact(baseAggregationContent());
    const secondAggregation = aggregationArtifact({
      ...baseAggregationContent(),
      topic_statistics: [...baseAggregationContent().topic_statistics].reverse(),
    });
    const input: CandidateDiscoveryBuilderInput = {
      topic_id: "artificial_intelligence",
      registry_version: 1,
    };

    const first = await executeCandidateDiscovery(firstAggregation, input);
    const second = await executeCandidateDiscovery(secondAggregation, input);

    assert.equal(first.identity.artifact_type, "topic_candidate");
    assert.equal(
      first.identity.artifact_id,
      topicCandidateArtifactId(firstAggregation.content, input),
    );
    assert.equal(
      first.lineage.generation_context.builder_type,
      CANDIDATE_DISCOVERY_BUILDER_TYPE,
    );
    assert.deepEqual(first.lineage.upstream_dependencies, [
      {
        artifact_id: firstAggregation.identity.artifact_id,
        artifact_type: firstAggregation.identity.artifact_type,
        version: firstAggregation.identity.version,
        artifact_hash: firstAggregation.metadata.artifact_hash,
        input_hash: firstAggregation.metadata.input_hash,
      },
    ]);
    assert.equal(first.content.discovery_context.candidate_count, 1);
    assert.equal(
      first.content.discovery_context.candidate_discovery_version,
      CANDIDATE_DISCOVERY_VERSION,
    );
    assert.equal(first.content.candidates.length, 1);
    assert.equal(
      first.content.candidates[0].proposed_concept.proposed_topic_id,
      "artificial_intelligence",
    );
    assert.equal(first.metadata.artifact_hash, calculateArtifactHash(first.content));
    assert.deepEqual(first.content, second.content);
  });

  it("preserves aggregation evidence without recomputing upstream execution records", async () => {
    const aggregation = aggregationArtifact(baseAggregationContent());
    const artifact = await executeCandidateDiscovery(aggregation, {
      topic_id: "artificial_intelligence",
      registry_version: 1,
    });
    const aiCandidate = artifact.content.candidates[0];

    assert.equal(aiCandidate.evidence_summary.candidate_count, 4);
    assert.equal(aiCandidate.evidence_summary.accepted_count, 3);
    assert.equal(aiCandidate.evidence_summary.rejected_count, 1);
    assert.equal(aiCandidate.evidence_summary.company_count, 2);
    assert.equal(aiCandidate.evidence_summary.similarity.average, 0.84);
    assert.deepEqual(aiCandidate.supporting_aggregation, {
      aggregation_id: aggregation.content.aggregation_context.aggregation_id,
      aggregation_version: aggregation.content.aggregation_context.aggregation_version,
      aggregation_configuration_version:
        aggregation.content.aggregation_context.aggregation_configuration_version,
      registry_versions: [1],
    });
    assert.equal("topic_signals" in artifact.content, false);
    assert.equal("topic_registry" in artifact.content, false);
  });

  it("lists deterministic targets in artifact emission order", () => {
    assert.deepEqual(
      listCandidateDiscoveryTargets(baseAggregationContent()),
      [
        { topic_id: "artificial_intelligence", registry_version: 1 },
        { topic_id: "cloud_infrastructure", registry_version: 1 },
        { topic_id: "regulation", registry_version: 2 },
      ],
    );
  });

  it("rejects missing Aggregation Result dependency", async () => {
    await assert.rejects(
      () => executeCandidateDiscovery(undefined, {
        topic_id: "artificial_intelligence",
        registry_version: 1,
      }),
      BuilderValidationError,
    );
  });

  it("rejects forbidden dependencies", async () => {
    const aggregation = aggregationArtifact(baseAggregationContent());

    await assert.rejects(
      () => executeCandidateDiscovery(
        aggregation,
        {
          topic_id: "artificial_intelligence",
          registry_version: 1,
        },
        {
          topic_registry: artifact("registry-1", "topic_registry", {}),
        },
      ),
      BuilderValidationError,
    );
  });

  it("rejects malformed aggregation statistics", async () => {
    const aggregation = aggregationArtifact(baseAggregationContent());
    aggregation.content.topic_statistics[0]!.candidate_count = 99;

    await assert.rejects(
      () => executeCandidateDiscovery(aggregation, {
        topic_id: "regulation",
        registry_version: 2,
      }),
      BuilderValidationError,
    );
  });

  it("rejects target topics absent from the Aggregation Result", async () => {
    const aggregation = aggregationArtifact(baseAggregationContent());

    await assert.rejects(
      () => executeCandidateDiscovery(aggregation, {
        topic_id: "missing_topic",
        registry_version: 1,
      }),
      BuilderValidationError,
    );
  });
});

async function executeCandidateDiscovery(
  aggregationResult?: Artifact<AggregationResultArtifactContent>,
  input: CandidateDiscoveryBuilderInput = {
    topic_id: "artificial_intelligence",
    registry_version: 1,
  },
  extraDependencies: Record<string, Artifact<unknown>> = {},
): Promise<Artifact<TopicCandidateArtifactContent>> {
  const registry = new BuilderRegistry();
  const repository = new MemoryArtifactRepository();
  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(repository),
  );
  registry.registerBuilder({
    builder_type: CANDIDATE_DISCOVERY_BUILDER_TYPE,
    version: CANDIDATE_DISCOVERY_VERSION,
    artifact_type: TOPIC_CANDIDATE_ARTIFACT_TYPE,
    schema_version: TOPIC_CANDIDATE_SCHEMA_VERSION,
    pipeline_version: TOPIC_CANDIDATE_PIPELINE_VERSION,
  }, () => new CandidateDiscoveryBuilder());

  return executor.executeBuilder<
    CandidateDiscoveryBuilderInput,
    TopicCandidateArtifactContent
  >({
    builderType: CANDIDATE_DISCOVERY_BUILDER_TYPE,
    artifactId: aggregationResult === undefined
      ? undefined
      : topicCandidateArtifactId(aggregationResult.content, input),
    companyId: "PLATFORM",
    periodId: "2026-Q3",
    executionId: "candidate-discovery-execution",
    input,
    inputHash: stableHash(input),
    dependencies: {
      ...(aggregationResult === undefined
        ? {}
        : { aggregation_result: aggregationResult }),
      ...extraDependencies,
    },
    generatedAt: "2026-07-01T00:00:00.000Z",
  });
}

function baseAggregationContent(): AggregationResultArtifactContent {
  return {
    aggregation_context: {
      aggregation_id: "aggregation:platform:2026-Q3",
      aggregation_version: "cross-company-aggregation-v1",
      aggregation_configuration_version: "cross-company-default-v1",
      signal_count: 5,
    },
    registry_context: {
      registry_versions: [1, 2],
      counts_by_registry_version: [
        { registry_version: 1, signal_count: 4 },
        { registry_version: 2, signal_count: 1 },
      ],
    },
    evidence_statistics: {
      total_signals: 5,
      theme_count: 5,
      company_count: 2,
      reporting_period_count: 1,
      filing_count: 2,
      assignment_status_counts: {
        assigned: 3,
        human_review: 1,
        unassigned: 1,
      },
      assignment_method_counts: {
        exact_match: 1,
        semantic_match: 6,
        human_override: 0,
      },
      candidate_decision_counts: {
        accepted: 4,
        rejected: 3,
      },
      similarity: similarity(7, 0.78),
    },
    topic_statistics: [
      topicStatistic({
        topic_id: "regulation",
        registry_version: 2,
        candidate_count: 1,
        accepted_count: 0,
        rejected_count: 1,
        final_assignment_count: 0,
        average: 0.32,
      }),
      topicStatistic({
        topic_id: "cloud_infrastructure",
        registry_version: 1,
        candidate_count: 2,
        accepted_count: 1,
        rejected_count: 1,
        final_assignment_count: 1,
        average: 0.71,
      }),
      topicStatistic({
        topic_id: "artificial_intelligence",
        registry_version: 1,
        candidate_count: 4,
        accepted_count: 3,
        rejected_count: 1,
        final_assignment_count: 3,
        average: 0.84,
      }),
    ],
  };
}

function topicStatistic(input: {
  topic_id: string;
  registry_version: number;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  final_assignment_count: number;
  average: number;
}): AggregatedTopicStatistics {
  return {
    ...input,
    company_count: 2,
    reporting_period_count: 1,
    filing_count: 2,
    theme_count: input.candidate_count,
    assignment_method_counts: {
      exact_match: input.topic_id === "artificial_intelligence" ? 1 : 0,
      semantic_match: input.candidate_count - (
        input.topic_id === "artificial_intelligence" ? 1 : 0
      ),
      human_override: 0,
    },
    similarity: similarity(input.candidate_count, input.average),
  };
}

function similarity(count: number, average: number) {
  return {
    count,
    average,
    minimum: count === 0 ? null : Math.max(0, average - 0.1),
    maximum: count === 0 ? null : Math.min(1, average + 0.1),
    p50: count === 0 ? null : average,
    p90: count === 0 ? null : Math.min(1, average + 0.08),
    histogram: [
      { range_start: 0, range_end: 0.5, count: 1 },
      { range_start: 0.5, range_end: 1, count: Math.max(0, count - 1) },
    ],
  };
}

function aggregationArtifact(
  content: AggregationResultArtifactContent,
): Artifact<AggregationResultArtifactContent> {
  return artifact("aggregation-result-1", "aggregation_result", content);
}

function artifact<T>(
  artifactId: string,
  artifactType: ArtifactType,
  content: T,
): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "PLATFORM",
      period_id: "2026-Q3",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-schema-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-07-01T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: `${artifactType}-builder`,
      },
    },
    content,
  };
}

class MemoryArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>[]>();

  async create<T>(artifactValue: Artifact<T>): Promise<void> {
    const key = artifactKey({
      artifact_type: artifactValue.identity.artifact_type,
      company_id: artifactValue.identity.company_id ?? undefined,
      period_id: artifactValue.identity.period_id ?? undefined,
    });
    const history = this.artifacts.get(key) ?? [];
    history.push(artifactValue);
    this.artifacts.set(key, history);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    for (const history of this.artifacts.values()) {
      const artifactValue = history.find(
        (storedArtifact) => storedArtifact.identity.artifact_id === artifactId,
      );

      if (artifactValue !== undefined) {
        return artifactValue as Artifact<T>;
      }
    }

    return null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const history = this.artifacts.get(artifactKey({
      artifact_type: lookup.artifact_type,
      company_id: lookup.company_id ?? undefined,
      period_id: lookup.period_id ?? undefined,
    })) ?? [];

    return (history[history.length - 1] as Artifact<T> | undefined) ?? null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...(this.artifacts.get(artifactKey({
      artifact_type: lookup.artifact_type,
      company_id: lookup.company_id ?? undefined,
      period_id: lookup.period_id ?? undefined,
    })) ?? [])] as Artifact<T>[];
  }
}

function artifactKey(lookup: {
  artifact_type: ArtifactType;
  company_id?: string;
  period_id?: string;
}): string {
  return [
    lookup.artifact_type,
    lookup.company_id ?? "",
    lookup.period_id ?? "",
  ].join(":");
}
