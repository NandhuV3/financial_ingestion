import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  TopicAssignment,
  TopicAssignmentArtifactContent,
} from "../../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicEvolutionArtifactContent,
} from "../../../contracts/artifacts/topic-evolution-artifact-content.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import {
  parseArguments,
  runTopicEvolutionReplay,
} from "../run-topic-evolution.js";

describe("Topic Evolution replay runner", () => {
  it("uses deterministic default paths", () => {
    const args = parseArguments([]);

    assert.equal(
      args.currentTopicAssignmentPath,
      "output/demo/artifacts/03-topic-assignment.json",
    );
    assert.deepEqual(args.historicalTopicAssignmentPaths, []);
    assert.equal(args.outputPath, "output/demo/artifacts/10-topic-evolution.json");
    assert.equal(args.generationDurationMs, 0);
  });

  it("replays first-period Topic Evolution without historical artifacts", async () => {
    const fixture = await createFixture();
    const currentPath = join(fixture.directory, "current.json");
    const outputPath = join(fixture.directory, "10-topic-evolution.json");

    await writeJson(currentPath, topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud demand.", 0.8),
    ]));

    await runTopicEvolutionReplay([
      "--current-topic-assignment",
      currentPath,
      "--output",
      outputPath,
    ]);

    const artifact = await readTopicEvolution(outputPath);

    assert.equal(artifact.identity.artifact_type, "topic_evolution");
    assert.equal(artifact.content.history.history_state, "FIRST_FILING");
    assert.equal(artifact.content.history.reason, "FIRST_FILING");
    assert.equal(artifact.content.history.comparison_performed, false);
    assert.deepEqual(artifact.content.topics, []);
  });

  it("replays Topic Evolution with historical Topic Assignment artifacts", async () => {
    const fixture = await createFixture();
    const priorPath = join(fixture.directory, "prior.json");
    const currentPath = join(fixture.directory, "current.json");
    const outputPath = join(fixture.directory, "10-topic-evolution.json");

    await writeJson(priorPath, topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud demand.", 0.8),
    ]));
    await writeJson(currentPath, topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud demand.", 0.9),
    ]));

    await runTopicEvolutionReplay([
      "--current-topic-assignment",
      currentPath,
      "--historical-topic-assignments",
      priorPath,
      "--output",
      outputPath,
    ]);

    const artifact = await readTopicEvolution(outputPath);

    assert.equal(artifact.content.history.history_state, "HISTORY_AVAILABLE");
    assert.deepEqual(
      artifact.content.topics.map(({ topic_id, evolution_type }) => ({
        topic_id,
        evolution_type,
      })),
      [{
        topic_id: "cloud",
        evolution_type: "persistent",
      }],
    );
    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map(({ artifact_type }) =>
        artifact_type),
      ["topic_assignment", "topic_assignment"],
    );
  });

  it("sorts historical Topic Assignments deterministically", async () => {
    const fixture = await createFixture();
    const firstPriorPath = join(fixture.directory, "prior-q1.json");
    const secondPriorPath = join(fixture.directory, "prior-q2.json");
    const currentPath = join(fixture.directory, "current.json");
    const outputPath = join(fixture.directory, "10-topic-evolution.json");

    await writeJson(firstPriorPath, topicAssignmentArtifact("2026-Q1", [
      assignment("q1-cloud", "cloud", "Cloud research.", 0.8),
    ]));
    await writeJson(secondPriorPath, topicAssignmentArtifact("2026-Q2", [
      assignment("q2-cloud", "cloud", "Cloud products.", 0.8),
    ]));
    await writeJson(currentPath, topicAssignmentArtifact("2026-Q3", [
      assignment("q3-cloud", "cloud", "Cloud products.", 0.8),
    ]));

    await runTopicEvolutionReplay([
      "--current-topic-assignment",
      currentPath,
      "--historical-topic-assignments",
      [secondPriorPath, firstPriorPath].join(","),
      "--output",
      outputPath,
      "--generated-at",
      "2026-07-07T00:00:00.000Z",
    ]);

    const artifact = await readTopicEvolution(outputPath);

    assert.deepEqual(
      artifact.content.topics[0]?.historical_periods_analyzed,
      ["2026-Q1", "2026-Q2"],
    );
    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map(({ artifact_id }) =>
        artifact_id),
      [
        "topic-assignment-2026-Q1",
        "topic-assignment-2026-Q2",
        "topic-assignment-2026-Q3",
      ],
    );
  });

  it("uses current Topic Assignment metadata by default and honors CLI overrides", async () => {
    const fixture = await createFixture();
    const currentPath = join(fixture.directory, "current.json");
    const defaultOutputPath = join(fixture.directory, "default.json");
    const overrideOutputPath = join(fixture.directory, "override.json");

    await writeJson(currentPath, topicAssignmentArtifact("2026-Q2", []));

    await runTopicEvolutionReplay([
      "--current-topic-assignment",
      currentPath,
      "--output",
      defaultOutputPath,
    ]);
    await runTopicEvolutionReplay([
      "--current-topic-assignment",
      currentPath,
      "--output",
      overrideOutputPath,
      "--generated-at",
      "2026-07-07T00:00:00.000Z",
      "--generation-duration-ms",
      "12",
    ]);

    const defaultArtifact = await readTopicEvolution(defaultOutputPath);
    const overrideArtifact = await readTopicEvolution(overrideOutputPath);

    assert.equal(
      defaultArtifact.metadata.generated_at,
      "2026-06-19T00:00:00.000Z",
    );
    assert.equal(
      overrideArtifact.metadata.generated_at,
      "2026-07-07T00:00:00.000Z",
    );
    assert.equal(overrideArtifact.metadata.generation_duration_ms, 12);
  });

  it("produces deterministic JSON for identical replay inputs", async () => {
    const fixture = await createFixture();
    const priorPath = join(fixture.directory, "prior.json");
    const currentPath = join(fixture.directory, "current.json");
    const firstOutputPath = join(fixture.directory, "first.json");
    const secondOutputPath = join(fixture.directory, "second.json");
    const args = [
      "--current-topic-assignment",
      currentPath,
      "--historical-topic-assignments",
      priorPath,
      "--generated-at",
      "2026-07-07T00:00:00.000Z",
      "--generation-duration-ms",
      "0",
    ];

    await writeJson(priorPath, topicAssignmentArtifact("2026-Q1", [
      assignment("prior-cloud", "cloud", "Cloud.", 0.8),
    ]));
    await writeJson(currentPath, topicAssignmentArtifact("2026-Q2", [
      assignment("current-cloud", "cloud", "Cloud.", 0.9),
    ]));

    await runTopicEvolutionReplay([...args, "--output", firstOutputPath]);
    await runTopicEvolutionReplay([...args, "--output", secondOutputPath]);

    assert.equal(
      await readFile(firstOutputPath, "utf8"),
      await readFile(secondOutputPath, "utf8"),
    );
  });
});

async function createFixture(): Promise<{ directory: string }> {
  const directory = await mkdtemp(join(tmpdir(), "topic-evolution-replay-"));

  return { directory };
}

async function readTopicEvolution(
  path: string,
): Promise<Artifact<TopicEvolutionArtifactContent>> {
  return JSON.parse(
    await readFile(path, "utf8"),
  ) as Artifact<TopicEvolutionArtifactContent>;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
        execution_id: `topic-assignment:${period}`,
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
