import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { CommitmentTrackingBuilder } from "../builder.js";
import {
  COMMITMENT_TRACKING_BUILDER_TYPE,
  COMMITMENT_TRACKING_BUILDER_VERSION,
  COMMITMENT_TRACKING_PIPELINE_VERSION,
  COMMITMENT_TRACKING_SCHEMA_VERSION,
} from "../contract.js";
import type {
  CommitmentSourceRecord,
  CommitmentTrackingArtifactContent,
  CommitmentTrackingBuilderInput,
} from "../types.js";
import { validateCommitmentTrackingArtifactContent } from "../validator.js";
import {
  builderInput,
  priorCommitmentArtifact,
  sourceArtifact,
  sourceRecord,
  TestArtifactRepository,
  validFirstPopulationContent,
} from "./commitment-tracking.fixtures.js";

describe("commitment tracking builder", () => {
  it("generates a replayable first-population artifact", async () => {
    const repository = new TestArtifactRepository();
    const result = await execute(repository, {
      current_filing: sourceArtifact(),
    });

    assert.equal(result.identity.artifact_type, "commitment_tracking");
    assert.equal(result.metadata.schema_version, COMMITMENT_TRACKING_SCHEMA_VERSION);
    assert.equal(result.content.depth_indicator.first_population, true);
    assert.equal(result.content.depth_indicator.longitudinal_tracking_available, false);
    assert.equal(result.content.coverage.status, "complete");
    assert.equal(result.content.commitments[0]?.status, "new");
    assert.equal(result.content.confidence.linkage_confidence, 0);
    assert.deepEqual(
      result.content.replayability_metadata.source_artifact_references,
      ["filing-2026-q2"],
    );
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "commitment_tracking",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("records partial source coverage without blocking generation", async () => {
    const input = builderInput({
      source_dependencies: [
        ...builderInput().source_dependencies,
        {
          dependency_name: "current_earnings_call",
          period_id: "2026-Q2",
          source_type: "earnings_call",
          artifact_type: "filing",
          absent_reason: "Earnings call artifact unavailable.",
        },
      ],
    });
    const result = await execute(
      new TestArtifactRepository(),
      { current_filing: sourceArtifact() },
      input,
    );

    assert.equal(result.content.coverage.status, "partial");
    assert.equal(result.content.coverage.current_period_source_count, 1);
    assert.deepEqual(result.content.coverage.missing_sources, [
      {
        period_id: "2026-Q2",
        source_type: "earnings_call",
        absent_reason: "Earnings call artifact unavailable.",
      },
    ]);
  });

  it("uses prior history to validate lifecycle and produce longitudinal depth", async () => {
    const achievedRecord = sourceRecord({
      status: "achieved",
      actual_resolution_period: "2026-Q3",
      evidence: [
        sourceRecord().evidence[0]!,
        {
          evidence_id: "evidence-ai-capacity-achieved",
          source_record_ref: "filing-2026-q3:item2:commitment-1",
          evidence_text: "The planned AI capacity expansion is operational.",
          evidence_role: "resolution",
          confidence: 0.95,
        },
      ],
      resolution: {
        result: "fulfilled",
        assessed_period: "2026-Q3",
        evidence_refs: ["evidence-ai-capacity-achieved"],
        rule_version: "commitment-tracking-rules-v1",
      },
      confidence: {
        extraction_confidence: 0.9,
        linkage_confidence: 0.92,
        resolution_confidence: 0.95,
      },
    });
    const input = builderInput({
      period_id: "2026-Q3",
      source_dependencies: [
        {
          dependency_name: "current_filing",
          period_id: "2026-Q3",
          source_type: "10Q",
          artifact_type: "filing",
          absent_reason: null,
        },
      ],
    });
    const result = await execute(
      new TestArtifactRepository(),
      {
        current_filing: sourceArtifact([achievedRecord], {
          artifactId: "filing-2026-q3",
          periodId: "2026-Q3",
        }),
        prior_commitment_tracking: priorCommitmentArtifact(),
      },
      input,
    );

    assert.equal(result.content.depth_indicator.historical_periods_available, 2);
    assert.equal(result.content.depth_indicator.longitudinal_tracking_available, true);
    assert.equal(result.content.commitments[0]?.status, "achieved");
    assert.equal(result.content.commitments[0]?.resolution?.result, "fulfilled");
    assert.deepEqual(
      result.content.commitments[0]?.timeline.map((event) => event.status),
      ["new", "achieved"],
    );
    assert.equal(result.content.summary.fulfillment_rate, 1);
    assert.equal(
      result.content.replayability_metadata.prior_commitment_tracking_ref,
      "commitment-tracking-2026-q2",
    );
  });

  it("derives overdue timing without changing lifecycle status", async () => {
    const record = sourceRecord({
      status: "active",
      expected_resolution_passed: true,
      evidence: [
        sourceRecord().evidence[0]!,
        {
          evidence_id: "evidence-ai-capacity-confirmed",
          source_record_ref: "filing-2026-q2:item2:commitment-1",
          evidence_text: "The capacity project remains in progress.",
          evidence_role: "confirmation",
          confidence: 0.85,
        },
      ],
    });
    const result = await execute(new TestArtifactRepository(), {
      current_filing: sourceArtifact([record]),
    });

    assert.equal(result.content.commitments[0]?.status, "active");
    assert.equal(result.content.commitments[0]?.timing.overdue, true);
  });

  it("preserves source artifact and record provenance", async () => {
    const result = await execute(new TestArtifactRepository(), {
      current_filing: sourceArtifact(),
    });
    const evidence = result.content.commitments[0]?.evidence[0];

    assert.equal(evidence?.source_artifact_ref, "filing-2026-q2");
    assert.equal(evidence?.source_artifact_version, 1);
    assert.equal(evidence?.source_record_ref, "filing-2026-q2:item2:commitment-1");
    assert.equal(evidence?.filing_period, "2026-Q2");
  });

  it("rejects a stable identity basis change", async () => {
    const changedIdentity = sourceRecord({
      status: "active",
      identity_basis: {
        ...sourceRecord().identity_basis,
        canonical_statement: "Build a new global sales organization.",
      },
      evidence: [
        sourceRecord().evidence[0]!,
        {
          evidence_id: "evidence-ai-capacity-confirmed",
          source_record_ref: "filing-2026-q3:item2:commitment-1",
          evidence_text: "The capacity project remains in progress.",
          evidence_role: "confirmation",
          confidence: 0.9,
        },
      ],
    });
    const input = inputForPeriod("2026-Q3");

    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        {
          current_filing: sourceArtifact([changedIdentity], {
            artifactId: "filing-2026-q3",
            periodId: "2026-Q3",
          }),
          prior_commitment_tracking: priorCommitmentArtifact(),
        },
        input,
      ),
      BuilderValidationError,
    );
  });

  it("rejects transitions out of terminal lifecycle states", async () => {
    const prior = priorCommitmentArtifact();
    prior.content.commitments[0]!.status = "achieved";
    prior.content.commitments[0]!.resolution = {
      result: "fulfilled",
      assessed_period: "2026-Q2",
      evidence_refs: ["evidence-ai-capacity-created"],
      rule_version: "commitment-tracking-rules-v1",
    };
    const activeRecord = sourceRecord({
      status: "active",
      evidence: [
        sourceRecord().evidence[0]!,
        {
          evidence_id: "evidence-ai-capacity-confirmed",
          source_record_ref: "filing-2026-q3:item2:commitment-1",
          evidence_text: "The capacity project is active.",
          evidence_role: "confirmation",
          confidence: 0.9,
        },
      ],
    });

    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        {
          current_filing: sourceArtifact([activeRecord], {
            artifactId: "filing-2026-q3",
            periodId: "2026-Q3",
          }),
          prior_commitment_tracking: prior,
        },
        inputForPeriod("2026-Q3"),
      ),
      BuilderValidationError,
    );
  });

  it("rejects missing current-period sources", async () => {
    await assert.rejects(
      execute(new TestArtifactRepository(), {}, builderInput({
        source_dependencies: [
          {
            dependency_name: "current_filing",
            period_id: "2026-Q2",
            source_type: "10Q",
            artifact_type: "filing",
            absent_reason: "Current filing unavailable.",
          },
        ],
      })),
      BuilderDependencyError,
    );
  });

  it("rejects summary and replayability mismatches", () => {
    const content = validFirstPopulationContent();
    content.summary.total_commitments = 2;

    assert.throws(
      () => validateCommitmentTrackingArtifactContent(content),
      BuilderValidationError,
    );

    const replayMismatch = validFirstPopulationContent();
    replayMismatch.replayability_metadata.source_artifact_versions = [];

    assert.throws(
      () => validateCommitmentTrackingArtifactContent(replayMismatch),
      BuilderValidationError,
    );
  });

  it("is deterministic for identical inputs and dependencies", async () => {
    const dependencies = {
      current_filing: sourceArtifact(),
    };
    const first = await execute(new TestArtifactRepository(), dependencies);
    const second = await execute(new TestArtifactRepository(), dependencies);

    assert.deepEqual(first.content, second.content);
  });
});

function inputForPeriod(periodId: string): CommitmentTrackingBuilderInput {
  return builderInput({
    period_id: periodId,
    source_dependencies: [
      {
        dependency_name: "current_filing",
        period_id: periodId,
        source_type: "10Q",
        artifact_type: "filing",
        absent_reason: null,
      },
    ],
  });
}

async function execute(
  repository: ArtifactRepository,
  dependencies: Record<string, Artifact<unknown>>,
  input: CommitmentTrackingBuilderInput = builderInput(),
): Promise<Artifact<CommitmentTrackingArtifactContent>> {
  return executor(repository)
    .executeBuilder<CommitmentTrackingBuilderInput, CommitmentTrackingArtifactContent>({
      builderType: COMMITMENT_TRACKING_BUILDER_TYPE,
      companyId: input.company_id,
      periodId: input.period_id,
      executionId: `commitment-tracking-${input.period_id}`,
      input,
      inputHash: `commitment-tracking-input-${input.period_id}`,
      dependencies,
    });
}

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: COMMITMENT_TRACKING_BUILDER_TYPE,
    artifact_type: "commitment_tracking",
    version: COMMITMENT_TRACKING_BUILDER_VERSION,
    schema_version: COMMITMENT_TRACKING_SCHEMA_VERSION,
    pipeline_version: COMMITMENT_TRACKING_PIPELINE_VERSION,
  }, () => new CommitmentTrackingBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
