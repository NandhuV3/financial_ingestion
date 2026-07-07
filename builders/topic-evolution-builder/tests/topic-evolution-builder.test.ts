import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  TopicAssignment,
  TopicAssignmentArtifactContent,
} from "../../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicEvolutionArtifactContent,
} from "../../../contracts/artifacts/topic-evolution-artifact-content.js";
import { ArtifactService, calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import type { BuilderContext } from "../../../packages/builder-framework/src/builder-context.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { TopicEvolutionBuilder } from "../builder.js";
import {
  historicalTopicAssignmentDependencyKey,
  TOPIC_EVOLUTION_BUILDER_TYPE,
  TOPIC_EVOLUTION_BUILDER_VERSION,
  TOPIC_EVOLUTION_PIPELINE_VERSION,
  TOPIC_EVOLUTION_SCHEMA_VERSION,
} from "../contract.js";
import { topicEvolutionArtifactId } from "../identity.js";
import type { TopicEvolutionBuilderInput } from "../types.js";
import { validateTopicEvolutionArtifactContent } from "../validator.js";

describe("TopicEvolutionBuilder", () => {
  it("detects persistent Topic behavior", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud demand.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud demand.", 0.9),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.equal(result.content.history.history_state, "HISTORY_AVAILABLE");
    assert.equal(result.content.history.comparison_performed, true);
    assert.deepEqual(
      result.content.topics.map(({ topic_id, evolution_type }) => ({
        topic_id,
        evolution_type,
      })),
      [
        {
          topic_id: "cloud",
          evolution_type: "persistent",
        },
      ],
    );
  });

  it("detects emerging Topic behavior", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", []);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-ai", "artificial_intelligence", "AI capacity.", 0.85),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.deepEqual(result.content.topics.map((topic) => topic.evolution_type), [
      "emerging",
    ]);
    assert.equal(result.content.topics[0]?.first_observed_period, "2026-Q2");
    assert.equal(result.content.topics[0]?.current_assignment_count, 1);
  });

  it("detects disappearing Topic behavior", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-legacy", "legacy", "Legacy products.", 0.7),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", []);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.equal(result.content.topics[0]?.topic_id, "legacy");
    assert.equal(result.content.topics[0]?.evolution_type, "disappearing");
    assert.equal(result.content.topics[0]?.last_observed_period, "2026-Q1");
    assert.equal(result.content.topics[0]?.current_assignment_count, 0);
  });

  it("detects strengthening Topic behavior", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud-a", "cloud", "Cloud.", 0.8),
      assignment("current-cloud-b", "cloud", "Azure.", 0.9),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.deepEqual(
      result.content.topics.map((topic) => topic.evolution_type),
      ["narrative_drift", "persistent", "strengthening"],
    );
    assert.equal(
      result.content.topics.find((topic) =>
        topic.evolution_type === "strengthening")?.assignment_count_delta,
      1,
    );
  });

  it("detects weakening Topic behavior", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud-a", "cloud", "Cloud.", 0.8),
      assignment("prior-cloud-b", "cloud", "Azure.", 0.9),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud.", 0.8),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.deepEqual(
      result.content.topics.map((topic) => topic.evolution_type),
      ["narrative_drift", "persistent", "weakening"],
    );
    assert.equal(
      result.content.topics.find((topic) =>
        topic.evolution_type === "weakening")?.assignment_count_delta,
      -1,
    );
  });

  it("detects narrative drift without explaining business meaning", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-ai", "artificial_intelligence", "AI research investment.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-ai", "artificial_intelligence", "AI product commercialization.", 0.8),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.deepEqual(
      result.content.topics.map((topic) => topic.evolution_type),
      ["narrative_drift", "persistent"],
    );
    assert.deepEqual(
      result.content.topics.find((topic) =>
        topic.evolution_type === "narrative_drift")?.evidence_by_period
        .map(({ period_id, theme_summaries }) => ({
          period_id,
          theme_summaries,
        })),
      [
        {
          period_id: "2026-Q1",
          theme_summaries: ["AI research investment."],
        },
        {
          period_id: "2026-Q2",
          theme_summaries: ["AI product commercialization."],
        },
      ],
    );
  });

  it("emits FIRST_FILING without fabricating historical observations", async () => {
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud demand.", 0.8),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, []),
    );

    assert.deepEqual(result.content.history, {
      history_state: "FIRST_FILING",
      reason: "FIRST_FILING",
      requires_previous_period: true,
      comparison_performed: false,
    });
    assert.deepEqual(result.content.topics, []);
    assert.equal(result.content.confidence.overall, 0);
  });

  it("rejects missing historical Topic Assignment dependency", async () => {
    const current = topicAssignmentArtifact("2026-Q2", []);
    const builderContext = context(current, []);
    builderContext.input.historical_periods = ["2026-Q1"];

    await assert.rejects(
      new TopicEvolutionBuilder().execute(builderContext),
      BuilderDependencyError,
    );
  });

  it("rejects duplicate, unordered, and future historical periods", async () => {
    const builder = new TopicEvolutionBuilder();

    await assert.rejects(
      builder.validateInput(input(["2026-Q1", "2026-Q1"])),
      BuilderValidationError,
    );
    await assert.rejects(
      builder.validateInput(input(["2026-Q1", "2025-Q4"])),
      BuilderValidationError,
    );
    await assert.rejects(
      builder.validateInput(input(["2026-Q3"])),
      BuilderValidationError,
    );
  });

  it("rejects dependency company and period mismatches", async () => {
    const current = topicAssignmentArtifact("2026-Q2", []);
    const prior = topicAssignmentArtifact("2026-Q1", []);

    await assert.rejects(
      new TopicEvolutionBuilder().execute(context({
        ...current,
        identity: {
          ...current.identity,
          company_id: "OTHER",
        },
      }, [prior])),
      BuilderDependencyError,
    );
    await assert.rejects(
      new TopicEvolutionBuilder().execute(context(current, [{
        ...prior,
        content: {
          ...prior.content,
          period_id: "2025-Q4",
        },
      }])),
      BuilderDependencyError,
    );
  });

  it("rejects classification, evidence, and confidence drift", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud.", 0.6),
    ]);
    const builderContext = context(current, [prior]);
    const valid = (await new TopicEvolutionBuilder().execute(builderContext))
      .content;
    const dependencies = {
      current_topic_assignments: current,
      historical_topic_assignments: [prior],
    };

    assert.throws(
      () => validateTopicEvolutionArtifactContent({
        ...valid,
        topics: [{
          ...valid.topics[0]!,
          evolution_type: "emerging",
        }],
      }, builderContext.input, dependencies),
      BuilderValidationError,
    );
    assert.throws(
      () => validateTopicEvolutionArtifactContent({
        ...valid,
        topics: [{
          ...valid.topics[0]!,
          evidence_refs: ["unknown"],
        }],
      }, builderContext.input, dependencies),
      BuilderValidationError,
    );
    assert.throws(
      () => validateTopicEvolutionArtifactContent({
        ...valid,
        confidence: {
          overall: 0.5,
        },
      }, builderContext.input, dependencies),
      BuilderValidationError,
    );
  });

  it("is deterministic when assignment and dependency insertion order changes", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-b", "cloud", "Cloud B.", 0.6),
      assignment("prior-a", "cloud", "Cloud A.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-b", "cloud", "Cloud B.", 0.7),
      assignment("current-a", "cloud", "Cloud A.", 0.9),
    ]);
    const first = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );
    const second = await new TopicEvolutionBuilder().execute(
      context(
        topicAssignmentArtifact("2026-Q2", [...current.content.assignments].reverse()),
        [topicAssignmentArtifact("2026-Q1", [...prior.content.assignments].reverse())],
      ),
    );

    assert.deepEqual(first.content, second.content);
  });

  it("persists deterministic artifact identity, hash, and lineage", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud.", 0.6),
    ]);
    const first = await executeThroughFramework(current, [prior]);
    const second = await executeThroughFramework(current, [prior]);

    assert.equal(first.identity.artifact_id, second.identity.artifact_id);
    assert.equal(first.metadata.artifact_hash, second.metadata.artifact_hash);
    assert.deepEqual(first.content, second.content);
    assert.deepEqual(first.lineage, second.lineage);
    assert.deepEqual(
      first.lineage.upstream_dependencies.map((dependency) => ({
        artifact_id: dependency.artifact_id,
        artifact_type: dependency.artifact_type,
      })),
      [
        {
          artifact_id: prior.identity.artifact_id,
          artifact_type: "topic_assignment",
        },
        {
          artifact_id: current.identity.artifact_id,
          artifact_type: "topic_assignment",
        },
      ],
    );
  });
});

async function executeThroughFramework(
  current: Artifact<TopicAssignmentArtifactContent>,
  historical: Array<Artifact<TopicAssignmentArtifactContent>>,
): Promise<Artifact<TopicEvolutionArtifactContent>> {
  const registry = new BuilderRegistry();
  registry.registerBuilder({
    builder_type: TOPIC_EVOLUTION_BUILDER_TYPE,
    artifact_type: "topic_evolution",
    version: TOPIC_EVOLUTION_BUILDER_VERSION,
    schema_version: TOPIC_EVOLUTION_SCHEMA_VERSION,
    pipeline_version: TOPIC_EVOLUTION_PIPELINE_VERSION,
  }, () => new TopicEvolutionBuilder());

  const executor = new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  );
  const builderInput = input(historical.map(({ content }) => content.period_id));
  const dependencies = dependenciesFor(current, historical);

  return executor.executeBuilder<
    TopicEvolutionBuilderInput,
    TopicEvolutionArtifactContent
  >({
    builderType: TOPIC_EVOLUTION_BUILDER_TYPE,
    artifactId: topicEvolutionArtifactId({ current, historical }),
    companyId: builderInput.company_id,
    periodId: builderInput.period_id,
    executionId: "topic-evolution-test",
    input: builderInput,
    inputHash: calculateArtifactHash(builderInput),
    dependencies,
    lineageDependencies: dependencies,
    generatedAt: "2026-07-07T00:00:00.000Z",
    generationDurationMs: 0,
  });
}

function context(
  current: Artifact<TopicAssignmentArtifactContent>,
  historical: Artifact<TopicAssignmentArtifactContent>[],
): BuilderContext<TopicEvolutionBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "topic-evolution-test",
    input: input(historical.map(({ content }) => content.period_id)),
    dependencies: dependenciesFor(current, historical),
    recordPromptReference() {},
    recordModelReference() {},
  };
}

function dependenciesFor(
  current: Artifact<TopicAssignmentArtifactContent>,
  historical: Artifact<TopicAssignmentArtifactContent>[],
): Record<string, Artifact<TopicAssignmentArtifactContent>> {
  return {
    current_topic_assignments: current,
    ...Object.fromEntries(historical.map((artifact) => [
      historicalTopicAssignmentDependencyKey(artifact.content.period_id),
      artifact,
    ])),
  };
}

function input(historicalPeriods: string[]): TopicEvolutionBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    historical_periods: historicalPeriods,
  };
}

function topicAssignmentArtifact(
  period: string,
  assignments: TopicAssignment[],
): Artifact<TopicAssignmentArtifactContent> {
  const content: TopicAssignmentArtifactContent = {
    company_id: "MSFT",
    period_id: period,
    filing_id: `msft-${period.toLowerCase()}-10q`,
    registry_version: 1,
    assignments,
    unassigned_themes: [],
    confidence: {
      overall: assignments.length === 0 ? 0 : 1,
      exact_match_rate: assignments.length === 0 ? 0 : 1,
      semantic_match_rate: 0,
      unassigned_rate: 0,
    },
  };

  return {
    identity: {
      artifact_id: `topic-assignment-${period}`,
      artifact_type: "topic_assignment",
      company_id: "MSFT",
      period_id: period,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "topic-assignment-artifact-v1",
      pipeline_version: "topic-assignment-pipeline-v1",
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `topic-assignment-input-${period}`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "topic-assignment-builder",
      },
    },
    content,
  };
}

function assignment(
  assignmentId: string,
  topicId: string,
  themeSummary: string,
  confidence: number,
): TopicAssignment {
  return {
    assignment_id: assignmentId,
    theme_id: `theme-${assignmentId}`,
    topic_id: topicId,
    theme_title: themeSummary,
    theme_summary: themeSummary,
    assignment_method: "semantic_match",
    similarity_score: confidence,
    confidence,
  };
}
