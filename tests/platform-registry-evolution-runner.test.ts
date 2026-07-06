import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  PLATFORM_REGISTRY_PIPELINE_VERSION,
  PLATFORM_REGISTRY_SCHEMA_VERSION,
} from "../contracts/governance/registry-evolution-contract.js";
import { calculateArtifactHash } from "../packages/artifact-framework/src/artifact-service.js";
import {
  runPlatformRegistryEvolution,
} from "../src/platform-registry-evolution/run-platform-registry-evolution.js";

describe("Platform Registry Evolution runner", () => {
  it("executes successfully and writes one Platform Registry artifact", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:zeta",
        topicId: "zeta_topic",
        canonicalName: "Zeta Topic",
      }),
    ]);

    await runPlatformRegistryEvolution(runnerArgs(paths));

    const artifact = await readRegistry(paths.outputPath);

    assert.equal(artifact.identity.artifact_type, "topic_registry");
    assert.equal(artifact.content.registry_version, 2);
    assert.equal(
      artifact.content.topics.some((topic) => topic.topic_id === "zeta_topic"),
      true,
    );
  });

  it("sorts Governance Decisions deterministically before evolution", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:zeta",
        topicId: "zeta_topic",
        canonicalName: "Zeta Topic",
      }),
      governanceDecisionArtifact({
        decisionId: "governance-decision:alpha",
        topicId: "alpha_topic",
        canonicalName: "Alpha Topic",
      }),
    ]);

    await runPlatformRegistryEvolution(runnerArgs(paths));

    const artifact = await readRegistry(paths.outputPath);

    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map((dependency) =>
        dependency.artifact_id),
      [
        "topic-registry-artifact:current",
        "governance-decision-artifact:governance-decision:alpha",
        "governance-decision-artifact:governance-decision:zeta",
      ],
    );
  });

  it("produces byte-identical Platform Registry artifacts for identical inputs", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:zeta",
        topicId: "zeta_topic",
        canonicalName: "Zeta Topic",
      }),
      governanceDecisionArtifact({
        decisionId: "governance-decision:alpha",
        topicId: "alpha_topic",
        canonicalName: "Alpha Topic",
      }),
    ]);
    const secondOutputPath = join(paths.directory, "platform-registry-second.json");
    const args = runnerArgs(paths).slice(0, -2);

    await runPlatformRegistryEvolution([...args, "--output", paths.outputPath]);
    await runPlatformRegistryEvolution([...args, "--output", secondOutputPath]);

    assert.equal(
      await readFile(paths.outputPath, "utf8"),
      await readFile(secondOutputPath, "utf8"),
    );
  });

  it("does not require or reference Topic Candidate artifacts", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:alpha",
        topicId: "alpha_topic",
        canonicalName: "Alpha Topic",
      }),
    ]);

    await runPlatformRegistryEvolution(runnerArgs(paths));

    const artifact = await readRegistry(paths.outputPath);

    assert.equal(
      artifact.lineage.upstream_dependencies.some((dependency) =>
        dependency.artifact_type === "topic_candidate"),
      false,
    );
  });

  it("does not invoke Governance Engine and preserves precomputed decision ids", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:precomputed-only",
        topicId: "precomputed_topic",
        canonicalName: "Precomputed Topic",
      }),
    ]);

    await runPlatformRegistryEvolution(runnerArgs(paths));

    const artifact = await readRegistry(paths.outputPath);

    assert.equal(
      artifact.lineage.upstream_dependencies[1]?.artifact_id,
      "governance-decision-artifact:governance-decision:precomputed-only",
    );
  });

  it("preserves previous registry artifact files unchanged", async () => {
    const paths = await writeRegistryEvolutionInputs([
      governanceDecisionArtifact({
        decisionId: "governance-decision:alpha",
        topicId: "alpha_topic",
        canonicalName: "Alpha Topic",
      }),
    ]);
    const before = await readFile(paths.registryPath, "utf8");

    await runPlatformRegistryEvolution(runnerArgs(paths));

    assert.equal(await readFile(paths.registryPath, "utf8"), before);
  });
});

function runnerArgs(paths: {
  decisionsPath: string;
  registryPath: string;
  outputPath: string;
}): string[] {
  return [
    "--governance-decisions",
    paths.decisionsPath,
    "--current-registry",
    paths.registryPath,
    "--output",
    paths.outputPath,
    "--generated-at",
    "2026-07-06T00:00:00.000Z",
    "--generation-duration-ms",
    "0",
  ];
}

async function writeRegistryEvolutionInputs(
  decisions: Array<Artifact<GovernanceDecisionArtifactContent>>,
): Promise<{
  directory: string;
  decisionsPath: string;
  registryPath: string;
  outputPath: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "registry-evolution-"));
  const decisionsPath = join(directory, "governance-decisions.json");
  const registryPath = join(directory, "current-registry.json");
  const outputPath = join(directory, "platform-registry.json");

  await writeFile(
    decisionsPath,
    `${JSON.stringify(decisions, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    registryPath,
    `${JSON.stringify(currentRegistryArtifact(), null, 2)}\n`,
    "utf8",
  );

  return {
    directory,
    decisionsPath,
    registryPath,
    outputPath,
  };
}

async function readRegistry(
  path: string,
): Promise<Artifact<TopicRegistryArtifactContent>> {
  return JSON.parse(
    await readFile(path, "utf8"),
  ) as Artifact<TopicRegistryArtifactContent>;
}

function currentRegistryArtifact(): Artifact<TopicRegistryArtifactContent> {
  const content: TopicRegistryArtifactContent = {
    registry_version: 1,
    topics: [registryEntry("base_topic", "Base Topic", 1)],
  };

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
      input_hash: "current-registry-input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "platform-registry-test-bootstrap",
        execution_id: "platform-registry-test-bootstrap-execution",
      },
    },
    content,
  };
}

function governanceDecisionArtifact(input: {
  decisionId: string;
  topicId: string;
  canonicalName: string;
}): Artifact<GovernanceDecisionArtifactContent> {
  const approvedRegistryChange: GovernanceApprovedRegistryChange = {
    mutation_type: "create_registry_entry",
    registry_entry: registryEntry(input.topicId, input.canonicalName, 2),
  };
  const content: GovernanceDecisionArtifactContent = {
    governance_decision_id: input.decisionId,
    governance_policy_version: "topic-candidate-governance-v1",
    decision_version: "governance-decision-v1",
    candidate_reference: {
      artifact_id: `topic-candidate-artifact:${input.topicId}`,
      artifact_version: 1,
      candidate_id: `topic-candidate:${input.topicId}`,
      candidate_version: "topic-candidate-v1",
    },
    decision_outcome: "approved",
    decision_basis: {
      rule_evaluations: [
        {
          rule_id: "candidate-eligibility-v1",
          rule_type: "candidate_eligibility",
          result: "passed",
          reason: "Registry evolution runner fixture.",
        },
      ],
    },
    registry_impact: "create_new_registry_entry",
    approved_registry_change: approvedRegistryChange,
    governance_metadata: {
      governance_engine_version: "governance-engine-v1",
      governance_policy_version: "topic-candidate-governance-v1",
      execution_id: `governance-execution:${input.topicId}`,
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
      input_hash: `governance-decision-input:${input.topicId}`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "governance-engine",
        execution_id: `governance-execution:${input.topicId}`,
      },
    },
    content,
  };
}

function registryEntry(
  topicId: string,
  canonicalName: string,
  registryVersion: number,
): TopicRegistryEntry {
  return {
    topic_id: topicId,
    canonical_name: canonicalName,
    definition: `${canonicalName} registry definition.`,
    aliases: [],
    lifecycle_state: "active",
    created_registry_version: registryVersion,
    updated_registry_version: registryVersion,
    child_topic_ids: [],
    examples: [],
    created_at: "2026-07-06T00:00:00.000Z",
    updated_at: "2026-07-06T00:00:00.000Z",
  };
}
