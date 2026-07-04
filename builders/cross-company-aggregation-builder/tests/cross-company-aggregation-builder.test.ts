import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type {
  AggregationResultArtifactContent,
} from "../../../contracts/artifacts/aggregation-result-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  TopicSignalExecutionRecord,
} from "../../../contracts/execution/topic-signal-execution-record.js";
import { ArtifactService, calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import {
  aggregationResultArtifactId,
  buildTopicSignalExecutionReferences,
} from "../aggregator.js";
import { CrossCompanyAggregationBuilder } from "../builder.js";
import {
  AGGREGATION_RESULT_ARTIFACT_TYPE,
  AGGREGATION_RESULT_PIPELINE_VERSION,
  AGGREGATION_RESULT_SCHEMA_VERSION,
  CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
  CROSS_COMPANY_AGGREGATION_VERSION,
} from "../contract.js";
import type { CrossCompanyAggregationBuilderInput } from "../types.js";

describe("CrossCompanyAggregationBuilder", () => {
  it("creates a deterministic Aggregation Result Platform Artifact", async () => {
    const first = await executeAggregation(baseInput());
    const second = await executeAggregation({
      ...baseInput(),
      topic_signals: [...baseInput().topic_signals].reverse(),
    });

    assert.equal(first.identity.artifact_type, "aggregation_result");
    assert.equal(first.content.aggregation_context.signal_count, 4);
    assert.equal(
      first.content.aggregation_context.aggregation_configuration_version,
      "cross-company-default-v1",
    );
    assert.deepEqual(first.lineage.upstream_dependencies, []);
    assert.deepEqual(
      first.lineage.execution_references,
      buildTopicSignalExecutionReferences(baseInput().topic_signals),
    );
    assert.equal(
      first.lineage.generation_context.builder_type,
      CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
    );
    assert.equal(
      first.metadata.artifact_hash,
      calculateArtifactHash(first.content),
    );
    assert.equal(
      first.identity.artifact_id,
      aggregationResultArtifactId(baseInput()),
    );
    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.metadata.generated_at, second.metadata.generated_at);
    assert.equal(first.metadata.generation_duration_ms, 0);
    assert.equal(second.metadata.generation_duration_ms, 0);
    assert.equal("signal_set" in first.content, false);
    assert.equal(
      first.content.topic_statistics.some((topic) => "signal_ids" in topic),
      false,
    );
    assert.deepEqual(first.content, second.content);
    assert.deepEqual(
      first.lineage.execution_references,
      second.lineage.execution_references,
    );
  });

  it("aggregates assignment statuses, candidate decisions, and diversity statistics", async () => {
    const artifact = await executeAggregation(baseInput());
    const { evidence_statistics: stats } = artifact.content;

    assert.deepEqual(stats.assignment_status_counts, {
      assigned: 2,
      human_review: 1,
      unassigned: 1,
    });
    assert.deepEqual(stats.candidate_decision_counts, {
      accepted: 3,
      rejected: 5,
    });
    assert.deepEqual(stats.assignment_method_counts, {
      exact_match: 1,
      semantic_match: 2,
      human_override: 0,
    });
    assert.equal(stats.company_count, 3);
    assert.equal(stats.reporting_period_count, 2);
    assert.equal(stats.filing_count, 4);
    assert.equal(stats.theme_count, 4);
    assert.equal(stats.similarity.count, 8);
    assert.equal(stats.similarity.minimum, 0.2);
    assert.equal(stats.similarity.maximum, 1);
    assert.equal(stats.similarity.p50, 0.61);
    assert.equal(stats.similarity.p90, 1);
  });

  it("preserves per-topic registry-version statistics without recomputing similarity", async () => {
    const artifact = await executeAggregation(baseInput());

    assert.deepEqual(artifact.content.registry_context.registry_versions, [1, 2]);
    assert.deepEqual(artifact.content.registry_context.counts_by_registry_version, [
      { registry_version: 1, signal_count: 3 },
      { registry_version: 2, signal_count: 1 },
    ]);

    const aiV1 = artifact.content.topic_statistics.find(
      (topic) => topic.topic_id === "artificial_intelligence"
        && topic.registry_version === 1,
    );

    assert.ok(aiV1);
    assert.equal(aiV1.candidate_count, 2);
    assert.equal(aiV1.accepted_count, 2);
    assert.equal(aiV1.rejected_count, 0);
    assert.equal(aiV1.final_assignment_count, 2);
    assert.equal(aiV1.company_count, 2);
    assert.deepEqual(aiV1.assignment_method_counts, {
      exact_match: 1,
      semantic_match: 1,
      human_override: 0,
    });
    assert.equal(aiV1.similarity.average, 0.925);

    const regulationV2 = artifact.content.topic_statistics.find(
      (topic) => topic.topic_id === "regulation"
        && topic.registry_version === 2,
    );

    assert.ok(regulationV2);
    assert.equal(regulationV2.candidate_count, 1);
    assert.equal(regulationV2.accepted_count, 0);
    assert.equal(regulationV2.rejected_count, 1);
    assert.equal(regulationV2.final_assignment_count, 0);
    assert.equal(regulationV2.similarity.average, 0.2);
  });

  it("rejects Topic Registry or artifact dependencies", async () => {
    const registry = new BuilderRegistry();
    const repository = new MemoryArtifactRepository();
    const executor = new BuilderExecutor(
      registry,
      new ArtifactService(repository),
    );

    registry.registerBuilder({
      builder_type: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
      version: CROSS_COMPANY_AGGREGATION_VERSION,
      artifact_type: AGGREGATION_RESULT_ARTIFACT_TYPE,
      schema_version: AGGREGATION_RESULT_SCHEMA_VERSION,
      pipeline_version: AGGREGATION_RESULT_PIPELINE_VERSION,
    }, () => new CrossCompanyAggregationBuilder());

    await assert.rejects(
      () => executor.executeBuilder({
        builderType: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
        companyId: "PLATFORM",
        periodId: "2026-Q3",
        executionId: "aggregation-execution",
        input: baseInput(),
        inputHash: stableHash(baseInput()),
        dependencies: {
          topic_registry: artifact("topic-registry-1", "topic_registry", {}),
        },
        generatedAt: "2026-07-01T00:00:00.000Z",
      }),
      BuilderValidationError,
    );
  });

  it("rejects invalid Topic Signals before aggregation", async () => {
    const input = baseInput();
    input.topic_signals[0]!.evaluation.candidates[0]!.similarity_score = 1.5;

    await assert.rejects(
      () => executeAggregation(input),
      BuilderValidationError,
    );
  });
});

async function executeAggregation(
  input: CrossCompanyAggregationBuilderInput,
): Promise<Artifact<AggregationResultArtifactContent>> {
  const registry = new BuilderRegistry();
  const repository = new MemoryArtifactRepository();
  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(repository),
  );

  registry.registerBuilder({
    builder_type: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
    version: CROSS_COMPANY_AGGREGATION_VERSION,
    artifact_type: AGGREGATION_RESULT_ARTIFACT_TYPE,
    schema_version: AGGREGATION_RESULT_SCHEMA_VERSION,
    pipeline_version: AGGREGATION_RESULT_PIPELINE_VERSION,
  }, () => new CrossCompanyAggregationBuilder());

  return executor.executeBuilder<
    CrossCompanyAggregationBuilderInput,
    AggregationResultArtifactContent
  >({
    builderType: CROSS_COMPANY_AGGREGATION_BUILDER_TYPE,
    artifactId: aggregationResultArtifactId(input),
    companyId: "PLATFORM",
    periodId: "2026-Q3",
    executionId: "aggregation-execution",
    input,
    inputHash: stableHash(input),
    generatedAt: "2026-07-01T00:00:00.000Z",
    generationDurationMs: 0,
  });
}

function baseInput(): CrossCompanyAggregationBuilderInput {
  return {
    aggregation_configuration_version: "cross-company-default-v1",
    topic_signals: [
      signal({
        companyId: "MSFT",
        periodId: "2026-Q2",
        filingId: "msft-filing-1",
        themeId: "theme-ai-1",
        title: "AI infrastructure investment",
        registryVersion: 1,
        status: "assigned",
        candidates: [
          ["artificial_intelligence", 1, "exact_match", "accepted"],
          ["cloud", 0.61, "semantic_match", "rejected"],
        ],
        finalAssignments: [
          ["artificial_intelligence", 1, "exact_match"],
        ],
      }),
      signal({
        companyId: "AAPL",
        periodId: "2026-Q2",
        filingId: "aapl-filing-1",
        themeId: "theme-ai-2",
        title: "AI product integration",
        registryVersion: 1,
        status: "assigned",
        candidates: [
          ["artificial_intelligence", 0.85, "semantic_match", "accepted"],
          ["cloud", 0.44, "semantic_match", "rejected"],
          ["growth", 0.81, "semantic_match", "accepted"],
        ],
        finalAssignments: [
          ["artificial_intelligence", 0.85, "semantic_match"],
          ["growth", 0.81, "semantic_match"],
        ],
      }),
      signal({
        companyId: "MSFT",
        periodId: "2026-Q3",
        filingId: "msft-filing-2",
        themeId: "theme-review-1",
        title: "Security review investment",
        registryVersion: 1,
        status: "human_review",
        candidates: [
          ["cybersecurity", 0.72, "semantic_match", "rejected"],
          ["regulation", 0.48, "semantic_match", "rejected"],
        ],
        finalAssignments: [],
      }),
      signal({
        companyId: "GOOG",
        periodId: "2026-Q3",
        filingId: "goog-filing-1",
        themeId: "theme-unassigned-1",
        title: "Unmapped execution observation",
        registryVersion: 2,
        status: "unassigned",
        candidates: [
          ["regulation", 0.2, "semantic_match", "rejected"],
        ],
        finalAssignments: [],
      }),
    ],
  };
}

function signal(input: {
  companyId: string;
  periodId: string;
  filingId: string;
  themeId: string;
  title: string;
  registryVersion: number;
  status: "assigned" | "human_review" | "unassigned";
  candidates: Array<[
    string,
    number,
    "exact_match" | "semantic_match",
    "accepted" | "rejected",
  ]>;
  finalAssignments: Array<[
    string,
    number,
    "exact_match" | "semantic_match",
  ]>;
}): TopicSignalExecutionRecord {
  return {
    execution_context: {
      company_id: input.companyId,
      period_id: input.periodId,
      filing_id: input.filingId,
      execution_id: `${input.companyId}:${input.periodId}:topic-assignment`,
    },
    theme: {
      theme_id: input.themeId,
      theme_title: input.title,
    },
    evaluation: {
      candidates: input.candidates.map(([
        topic_id,
        similarity_score,
        assignment_method,
        decision,
      ]) => ({
        topic_id,
        similarity_score,
        assignment_method,
        decision,
      })),
    },
    final_result: {
      assignment_status: input.status,
      final_assignments: input.finalAssignments.map(([
        topic_id,
        confidence,
        assignment_method,
      ]) => ({
        topic_id,
        confidence,
        assignment_method,
      })),
    },
    registry_context: {
      registry_version: input.registryVersion,
    },
    execution_metadata: {
      embedding_model: "text-embedding-3-small",
      generated_at: "2026-07-01T00:00:00.000Z",
    },
  };
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
