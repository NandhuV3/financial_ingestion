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
import { AccountingStabilityBuilder } from "../builder.js";
import {
  ACCOUNTING_STABILITY_BUILDER_TYPE,
  ACCOUNTING_STABILITY_BUILDER_VERSION,
  ACCOUNTING_STABILITY_PIPELINE_VERSION,
  ACCOUNTING_STABILITY_SCHEMA_VERSION,
} from "../contract.js";
import type {
  AccountingStabilityArtifactContent,
  AccountingStabilityBuilderInput,
} from "../types.js";
import { validateAccountingContent } from "../validator.js";
import {
  currentSource,
  input,
  priorSource,
  sourceForPeriod,
  TestArtifactRepository,
} from "./accounting-stability.fixtures.js";

describe("accounting stability builder", () => {
  it("generates a valid deterministic artifact without a stability score", async () => {
    const result = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );

    assert.equal(result.identity.artifact_type, "accounting_stability");
    assert.equal(result.content.policy_changes.length, 1);
    assert.equal(result.content.segment_changes.length, 1);
    assert.equal(result.content.restatements.length, 1);
    assert.equal(
      result.content.non_gaap_analysis?.trend_assessment.direction,
      "widening",
    );
    assert.equal(
      result.content.non_gaap_analysis?.trend_assessment.materiality,
      "medium",
    );
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.equal(result.content.coverage_status.overall, "complete");
    assert.equal("reporting_stability_score" in result.content.summary, false);
    assert.equal(
      result.content.accounting_timeline.some((entry) =>
        "reporting_stability_score" in entry),
      false,
    );
  });

  it("rejects insufficient history", async () => {
    await assert.rejects(
      execute(
        new TestArtifactRepository(),
        { current_filing: currentSource() },
        input({
          source_dependencies: [{
            dependency_name: "current_filing",
            period_id: "2026-Q2",
            artifact_type: "filing",
          }],
        }),
      ),
      BuilderDependencyError,
    );
  });

  it("classifies base, standard, and full depth by unique period count", async () => {
    const base = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );
    const standardInput = input({
      source_dependencies: dependenciesForPeriods([
        "2025-Q4",
        "2026-Q1",
        "2026-Q2",
      ]),
    });
    const standard = await execute(
      new TestArtifactRepository(),
      artifactsForPeriods(["2025-Q4", "2026-Q1", "2026-Q2"]),
      standardInput,
    );
    const fullInput = input({
      source_dependencies: dependenciesForPeriods([
        "2025-Q3",
        "2025-Q4",
        "2026-Q1",
        "2026-Q2",
      ]),
    });
    const full = await execute(
      new TestArtifactRepository(),
      artifactsForPeriods(["2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2"]),
      fullInput,
    );

    assert.equal(base.content.depth_indicator.overall, "base");
    assert.equal(standard.content.depth_indicator.overall, "standard");
    assert.equal(full.content.depth_indicator.overall, "full");
  });

  it("records partial dimension coverage without blocking generation", async () => {
    const prior = priorSource();
    prior.content.coverage.non_gaap_available = false;
    prior.content.non_gaap_measure = null;
    const result = await execute(new TestArtifactRepository(), {
      prior_filing: prior,
      current_filing: currentSource(),
    });

    assert.equal(result.content.coverage_status.non_gaap, "partial");
    assert.equal(result.content.coverage_status.overall, "partial");
    assert.equal(result.content.non_gaap_analysis, null);
    assert.equal(result.content.summary.non_gaap_gap_direction, null);
  });

  it("preserves evidence and source provenance", async () => {
    const result = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );
    const policy = result.content.policy_changes[0]!;
    const restatement = result.content.restatements[0]!;

    assert.deepEqual(policy.evidence_refs, [
      "q1:policy:revenue",
      "q2:policy:revenue",
    ]);
    assert.deepEqual(policy.source_artifact_refs, ["filing-q1", "filing-q2"]);
    assert.deepEqual(restatement.evidence_refs, ["q2:restatement"]);
    assert.ok(
      result.content.replayability_metadata.evidence_references.includes(
        "q2:restatement",
      ),
    );
  });

  it("is stable when source and observation order changes", async () => {
    const first = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );
    const prior = priorSource();
    const current = currentSource();
    prior.content.segments.reverse();
    current.content.segments.reverse();
    const reversedInput = input({
      source_dependencies: [...input().source_dependencies].reverse(),
    });
    const second = await execute(
      new TestArtifactRepository(),
      {
        prior_filing: prior,
        current_filing: current,
      },
      reversedInput,
    );

    assert.deepEqual(first.content, second.content);
  });

  it("rejects dependency company and period mismatches", async () => {
    const wrongCompany = currentSource();
    wrongCompany.identity.company_id = "AAPL";
    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: wrongCompany,
      }),
      BuilderDependencyError,
    );

    const wrongPeriod = currentSource();
    wrongPeriod.identity.period_id = "2026-Q1";
    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: wrongPeriod,
      }),
      BuilderDependencyError,
    );
  });

  it("rejects inconsistent source coverage", async () => {
    const current = currentSource();
    current.content.coverage.non_gaap_available = false;

    await assert.rejects(
      execute(new TestArtifactRepository(), {
        prior_filing: priorSource(),
        current_filing: current,
      }),
      BuilderDependencyError,
    );
  });

  it("rejects summary, confidence, and replayability mismatches", async () => {
    const result = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );
    const summary = structuredClone(result.content);
    summary.summary.policy_changes_detected += 1;
    assert.throws(() => validateAccountingContent(summary), BuilderValidationError);

    const confidence = structuredClone(result.content);
    confidence.confidence.overall = 0;
    assert.throws(
      () => validateAccountingContent(confidence),
      BuilderValidationError,
    );

    const replayability = structuredClone(result.content);
    replayability.replayability_metadata.evidence_references = ["unknown"];
    assert.throws(
      () => validateAccountingContent(replayability),
      BuilderValidationError,
    );
  });

  it("is replayable for identical inputs", async () => {
    const first = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );
    const second = await execute(
      new TestArtifactRepository(),
      requiredDependencies(),
    );

    assert.deepEqual(first.content, second.content);
  });
});

function requiredDependencies(): Record<string, Artifact<unknown>> {
  return {
    prior_filing: priorSource(),
    current_filing: currentSource(),
  };
}

function dependenciesForPeriods(
  periods: string[],
): AccountingStabilityBuilderInput["source_dependencies"] {
  return periods.map((period) => ({
    dependency_name: `source_${period}`,
    period_id: period,
    artifact_type: "filing",
  }));
}

function artifactsForPeriods(
  periods: string[],
): Record<string, Artifact<unknown>> {
  return Object.fromEntries(
    periods.map((period) => [`source_${period}`, sourceForPeriod(period)]),
  );
}

async function execute(
  repository: ArtifactRepository,
  dependencies: Record<string, Artifact<unknown>>,
  builderInput: AccountingStabilityBuilderInput = input(),
): Promise<Artifact<AccountingStabilityArtifactContent>> {
  return executor(repository)
    .executeBuilder<
      AccountingStabilityBuilderInput,
      AccountingStabilityArtifactContent
    >({
      builderType: ACCOUNTING_STABILITY_BUILDER_TYPE,
      companyId: builderInput.company_id,
      periodId: builderInput.period_id,
      executionId: `accounting-stability-${builderInput.period_id}`,
      input: builderInput,
      inputHash: `accounting-stability-input-${builderInput.period_id}`,
      dependencies,
      generatedAt: "2026-06-19T00:00:00.000Z",
    });
}

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();
  registry.registerBuilder({
    builder_type: ACCOUNTING_STABILITY_BUILDER_TYPE,
    artifact_type: "accounting_stability",
    version: ACCOUNTING_STABILITY_BUILDER_VERSION,
    schema_version: ACCOUNTING_STABILITY_SCHEMA_VERSION,
    pipeline_version: ACCOUNTING_STABILITY_PIPELINE_VERSION,
  }, () => new AccountingStabilityBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
