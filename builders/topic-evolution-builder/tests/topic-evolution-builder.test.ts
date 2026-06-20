import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { BuilderContext } from "../../../packages/builder-framework/src/builder-context.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type {
  TopicAssignment,
  TopicAssignmentArtifactContent,
} from "../../topic-assignment-builder/types.js";
import { TopicEvolutionBuilder } from "../builder.js";
import { historicalTopicAssignmentDependencyKey } from "../contract.js";
import type {
  TopicEvolutionArtifactContent,
  TopicEvolutionBuilderInput,
} from "../types.js";
import { validateTopicEvolutionArtifactContent } from "../validator.js";

describe("TopicEvolutionBuilder", () => {
  it("emits persistent, emerging, and disappeared states with locked confidence", async () => {
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud-a", "cloud", "Cloud demand.", 0.8),
      assignment("prior-cloud-b", "cloud", "Azure usage.", 0.6),
      assignment("prior-legacy", "legacy", "Legacy products.", 0.9),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-ai", "ai", "AI infrastructure.", 0.85),
      assignment("current-cloud-b", "cloud", "Azure capacity.", 0.7),
      assignment("current-cloud-a", "cloud", "Cloud demand.", 0.9),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [prior]),
    );

    assert.equal(result.content.status, "complete");
    assert.deepEqual(
      result.content.topic_evolutions.map((evolution) => ({
        topic_id: evolution.topic_id,
        evolution_state: evolution.evolution_state,
        confidence: evolution.confidence,
        strength_direction: evolution.strength_direction,
        narrative_drift: evolution.narrative_drift,
      })),
      [
        {
          topic_id: "ai",
          evolution_state: "EMERGING",
          confidence: 0.85,
          strength_direction: "not_assessed",
          narrative_drift: "not_assessed",
        },
        {
          topic_id: "cloud",
          evolution_state: "PERSISTENT",
          confidence: 0.75,
          strength_direction: "not_assessed",
          narrative_drift: "not_assessed",
        },
        {
          topic_id: "legacy",
          evolution_state: "DISAPPEARED",
          confidence: 0.9,
          strength_direction: "not_assessed",
          narrative_drift: "not_assessed",
        },
      ],
    );
    assert.equal(result.content.confidence.overall, 0.8333);

    const emerging = result.content.topic_evolutions[0]!;
    const cloud = result.content.topic_evolutions[1]!;
    const disappeared = result.content.topic_evolutions[2]!;
    assert.deepEqual(emerging.evidence.periods_analyzed, ["2026-Q1", "2026-Q2"]);
    assert.deepEqual(emerging.evidence.theme_summaries_by_period[0], {
      period: "2026-Q1",
      theme_summaries: [],
    });
    assert.deepEqual(cloud.evidence.periods_analyzed, ["2026-Q1", "2026-Q2"]);
    assert.deepEqual(cloud.evidence.supporting_assignment_refs, [
      "current-cloud-a",
      "current-cloud-b",
      "prior-cloud-a",
      "prior-cloud-b",
    ]);
    assert.deepEqual(cloud.evidence.theme_summaries_by_period, [
      {
        period: "2026-Q1",
        theme_summaries: ["Azure usage.", "Cloud demand."],
      },
      {
        period: "2026-Q2",
        theme_summaries: ["Azure capacity.", "Cloud demand."],
      },
    ]);
    assert.deepEqual(disappeared.evidence.periods_analyzed, [
      "2026-Q1",
      "2026-Q2",
    ]);
    assert.deepEqual(disappeared.evidence.theme_summaries_by_period[1], {
      period: "2026-Q2",
      theme_summaries: [],
    });
  });

  it("emits insufficient_history with no classifications", async () => {
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud demand.", 0.8),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, []),
    );

    assert.deepEqual(result.content, {
      artifact_type: "topic_evolution",
      company: "MSFT",
      period: "2026-Q2",
      status: "insufficient_history",
      topic_evolutions: [],
      confidence: {
        overall: 0,
      },
    });
  });

  it("uses the immediately preceding period from ordered history", async () => {
    const older = topicAssignmentArtifact("2025-Q4", [
      assignment("older-legacy", "legacy", "Legacy.", 0.4),
    ]);
    const prior = topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud.", 0.8),
    ]);
    const current = topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud.", 0.6),
    ]);
    const result = await new TopicEvolutionBuilder().execute(
      context(current, [older, prior]),
    );

    assert.deepEqual(
      result.content.topic_evolutions.map(({ topic_id }) => topic_id),
      ["cloud"],
    );
    assert.equal(result.content.topic_evolutions[0]?.confidence, 0.7);
  });

  it("rejects duplicate, unordered, and future historical periods", async () => {
    const builder = new TopicEvolutionBuilder();

    await assert.rejects(
      builder.validateInput({
        company_id: "MSFT",
        period_id: "2026-Q2",
        historical_periods: ["2026-Q1", "2026-Q1"],
      }),
      BuilderValidationError,
    );
    await assert.rejects(
      builder.validateInput({
        company_id: "MSFT",
        period_id: "2026-Q2",
        historical_periods: ["2026-Q1", "2025-Q4"],
      }),
      BuilderValidationError,
    );
    await assert.rejects(
      builder.validateInput({
        company_id: "MSFT",
        period_id: "2026-Q2",
        historical_periods: ["2026-Q3"],
      }),
      BuilderValidationError,
    );
  });

  it("rejects dependency company and period mismatches", async () => {
    const current = topicAssignmentArtifact("2026-Q2", []);
    const prior = topicAssignmentArtifact("2026-Q1", []);
    const builder = new TopicEvolutionBuilder();

    await assert.rejects(
      builder.execute(context({
        ...current,
        identity: {
          ...current.identity,
          company_id: "OTHER",
        },
      }, [prior])),
      BuilderDependencyError,
    );
    await assert.rejects(
      builder.execute(context(current, [{
        ...prior,
        content: {
          ...prior.content,
          period: "2025-Q4",
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
        topic_evolutions: [{
          ...valid.topic_evolutions[0]!,
          evolution_state: "EMERGING",
        }],
      }, builderContext.input, dependencies),
      BuilderValidationError,
    );
    assert.throws(
      () => validateTopicEvolutionArtifactContent({
        ...valid,
        topic_evolutions: [{
          ...valid.topic_evolutions[0]!,
          evidence: {
            ...valid.topic_evolutions[0]!.evidence,
            supporting_assignment_refs: ["unknown"],
          },
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
});

function context(
  current: Artifact<TopicAssignmentArtifactContent>,
  historical: Artifact<TopicAssignmentArtifactContent>[],
): BuilderContext<TopicEvolutionBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "topic-evolution-test",
    input: {
      company_id: "MSFT",
      period_id: "2026-Q2",
      historical_periods: historical.map(({ content }) => content.period),
    },
    dependencies: {
      current_topic_assignments: current,
      ...Object.fromEntries(historical.map((artifact) => [
        historicalTopicAssignmentDependencyKey(artifact.content.period),
        artifact,
      ])),
    },
    recordPromptReference() {},
    recordModelReference() {},
  };
}

function topicAssignmentArtifact(
  period: string,
  assignments: TopicAssignment[],
): Artifact<TopicAssignmentArtifactContent> {
  const content: TopicAssignmentArtifactContent = {
    artifact_type: "topic_assignment",
    company: "MSFT",
    filing_id: `msft-${period}-10q`,
    period,
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
