import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
import { calculateArtifactHash } from "../packages/artifact-framework/src/artifact-service.js";
import { GovernanceEngine } from "../src/governance-engine/index.js";
import { runGovernanceReplay } from "../src/governance-engine/run-governance-replay.js";
import { loadGovernancePolicyRegistry } from "../src/governance-policy-registry/index.js";

describe("Governance replay runner", () => {
  it("produces one Governance Decision artifact for one Topic Candidate", async () => {
    const paths = await writeTopicCandidates([
      topicCandidateArtifact("alpha_topic"),
    ]);

    await runGovernanceReplay([
      "--topic-candidates",
      paths.inputPath,
      "--output",
      paths.outputPath,
      "--generated-at",
      "2026-07-04T00:00:00.000Z",
      "--generation-duration-ms",
      "0",
    ]);

    const decisions = await readDecisions(paths.outputPath);

    assert.equal(decisions.length, 1);
    assert.equal(
      decisions[0]!.content.candidate_reference.candidate_id,
      "topic-candidate:alpha_topic",
    );
    assert.equal(decisions[0]!.content.decision_outcome, "approved");
  });

  it("executes successfully and writes one Governance Decision artifact per Topic Candidate", async () => {
    const paths = await writeTopicCandidates([
      topicCandidateArtifact("zeta_topic"),
      topicCandidateArtifact("alpha_topic"),
    ]);

    await runGovernanceReplay([
      "--topic-candidates",
      paths.inputPath,
      "--output",
      paths.outputPath,
      "--generated-at",
      "2026-07-04T00:00:00.000Z",
      "--generation-duration-ms",
      "0",
    ]);

    const decisions = await readDecisions(paths.outputPath);

    assert.equal(decisions.length, 2);
    assert.deepEqual(
      decisions.map((artifact) =>
        artifact.content.candidate_reference.candidate_id),
      ["topic-candidate:alpha_topic", "topic-candidate:zeta_topic"],
    );
    assert.deepEqual(
      decisions.map((artifact) => artifact.identity.artifact_type),
      ["governance_decision", "governance_decision"],
    );
    assert.equal(decisions[0]!.identity.version, 1);
    assert.equal(decisions[1]!.identity.version, 2);
    assert.equal(
      decisions[0]!.metadata.artifact_hash,
      calculateArtifactHash(decisions[0]!.content),
    );
  });

  it("produces byte-identical JSON output for identical inputs", async () => {
    const first = await writeTopicCandidates([
      topicCandidateArtifact("zeta_topic"),
      topicCandidateArtifact("alpha_topic"),
    ]);
    const secondOutputPath = join(first.directory, "governance-second.json");

    const args = [
      "--topic-candidates",
      first.inputPath,
      "--generated-at",
      "2026-07-04T00:00:00.000Z",
      "--generation-duration-ms",
      "0",
    ];

    await runGovernanceReplay([...args, "--output", first.outputPath]);
    await runGovernanceReplay([...args, "--output", secondOutputPath]);

    assert.equal(
      await readFile(first.outputPath, "utf8"),
      await readFile(secondOutputPath, "utf8"),
    );
  });

  it("preserves Governance Engine decision behavior", async () => {
    const policy = (await loadGovernancePolicyRegistry()).getActivePolicy();
    const candidateArtifact = topicCandidateArtifact("alpha_topic");
    const decision = new GovernanceEngine().execute({
      topic_candidate_artifact: candidateArtifact,
      governance_policy: policy,
      execution_id:
        `platform:governance-replay:${policy.policy_version}:topic-candidate:alpha_topic`,
    });

    assert.equal(decision.decision_outcome, "approved");
    assert.equal(decision.registry_impact, "create_new_registry_entry");
  });
});

async function writeTopicCandidates(
  artifacts: Array<Artifact<TopicCandidateArtifactContent>>,
): Promise<{
  directory: string;
  inputPath: string;
  outputPath: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "governance-replay-"));
  const inputPath = join(directory, "topic-candidates.json");
  const outputPath = join(directory, "governance-decisions.json");

  await writeFile(inputPath, `${JSON.stringify(artifacts, null, 2)}\n`, "utf8");

  return {
    directory,
    inputPath,
    outputPath,
  };
}

async function readDecisions(
  path: string,
): Promise<Array<Artifact<GovernanceDecisionArtifactContent>>> {
  return JSON.parse(await readFile(path, "utf8")) as Array<
    Artifact<GovernanceDecisionArtifactContent>
  >;
}

function topicCandidateArtifact(
  topicId: string,
): Artifact<TopicCandidateArtifactContent> {
  const content: TopicCandidateArtifactContent = {
    discovery_context: {
      candidate_discovery_version: "candidate-discovery-bootstrap-v1",
      aggregation_id: "aggregation:platform:test",
      aggregation_version: "cross-company-aggregation-v1",
      aggregation_configuration_version: "cross-company-default-v1",
      candidate_count: 1,
    },
    candidates: [topicCandidate(topicId)],
  };

  return {
    identity: {
      artifact_id: `topic-candidate-artifact:${topicId}`,
      artifact_type: "topic_candidate",
      company_id: "PLATFORM",
      period_id: "PLATFORM_INTELLIGENCE",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "topic-candidate-artifact-v1",
      pipeline_version: "platform-intelligence-pipeline-v1",
      generated_at: "2026-07-03T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `topic-candidate-input:${topicId}`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "candidate-discovery-builder",
        execution_id: `candidate-discovery:${topicId}`,
      },
    },
    content,
  };
}

function topicCandidate(topicId: string): TopicCandidate {
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
      aggregation_id: "aggregation:platform:test",
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
