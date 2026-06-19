import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { TrustSignalsBuilder } from "../builder.js";
import { TRUST_SIGNALS_CALIBRATION } from "../calibration-contract.js";
import {
  TRUST_SIGNALS_BUILDER_TYPE,
  TRUST_SIGNALS_BUILDER_VERSION,
  TRUST_SIGNALS_PIPELINE_VERSION,
  TRUST_SIGNALS_SCHEMA_VERSION,
} from "../contract.js";
import type {
  TrustSignal,
  TrustSignalsArtifactContent,
  TrustSignalsBuilderInput,
} from "../types.js";
import { validateTrustSignalsArtifactContent } from "../validator.js";
import {
  accountingStabilityArtifact,
  capitalAllocationTrackingArtifact,
  commitmentTrackingArtifact,
  input,
  narrativeConsistencyArtifact,
  TestArtifactRepository,
  validTrustSignalsContent,
} from "./trust-signals-builder.fixtures.js";

describe("trust signals builder", () => {
  it("generates a valid base artifact from one trust pillar", async () => {
    const repository = new TestArtifactRepository();
    const result = await executor(repository).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-base",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        commitment_tracking: commitmentTrackingArtifact(),
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(result.identity.artifact_type, "trust_signals");
    assert.equal(result.metadata.schema_version, TRUST_SIGNALS_SCHEMA_VERSION);
    assert.equal(result.metadata.pipeline_version, TRUST_SIGNALS_PIPELINE_VERSION);
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.deepEqual(result.content.missing_dimensions, [
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ]);
    assert.equal(result.content.trust_signals.length, 2);
    assert.equal(result.content.trust_signals.every((signal) => signal.dimension === "commitment_follow_through"), true);
    assert.equal(result.content.trust_signals.every((signal) => signal.evidence_refs.length > 0), true);
    assert.equal(result.content.trust_signals.every((signal) => signal.source_record_refs.length > 0), true);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "trust_signals",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("generates standard depth from two trust pillars", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-standard",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        commitment_tracking: commitmentTrackingArtifact(),
        narrative_consistency: narrativeConsistencyArtifact(),
      },
    });

    assert.equal(result.content.depth_indicator.overall, "standard");
    assert.equal(result.content.depth_indicator.commitment_dimension, "present");
    assert.equal(result.content.depth_indicator.narrative_dimension, "present");
    assert.equal(result.content.depth_indicator.explanation_dimension, "present");
    assert.deepEqual(result.content.missing_dimensions, [
      "accounting_stability",
      "capital_allocation_consistency",
    ]);
    assert.equal(result.content.trust_signals.some((signal) => signal.dimension === "narrative_consistency"), true);
    assert.equal(result.content.trust_signals.some((signal) => signal.dimension === "explanation_quality"), true);
  });

  it("generates full depth from all trust pillars", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-full",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        commitment_tracking: commitmentTrackingArtifact(),
        narrative_consistency: narrativeConsistencyArtifact(),
        accounting_stability: accountingStabilityArtifact(),
        capital_allocation_tracking: capitalAllocationTrackingArtifact(),
      },
    });

    assert.equal(result.content.depth_indicator.overall, "full");
    assert.deepEqual(result.content.missing_dimensions, []);
    assert.equal(result.content.trust_signals.some((signal) => signal.dimension === "accounting_stability"), true);
    assert.equal(result.content.trust_signals.some((signal) => signal.dimension === "capital_allocation_consistency"), true);
    assert.equal(result.content.confidence.source_data_confidence, 1);
  });

  it("uses contract constants for narrative stability classification", async () => {
    const narrativeArtifact = narrativeConsistencyArtifact();

    narrativeArtifact.content.strategic_priorities = [];
    narrativeArtifact.content.language_shifts = [];
    narrativeArtifact.content.summary = {
      stable_priority_ratio: TRUST_SIGNALS_CALIBRATION.NARRATIVE_STABILITY_LOW_MAX_RATIO,
    };
    narrativeArtifact.content.confidence = {};

    const result = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-narrative-calibration",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        narrative_consistency: narrativeArtifact,
      },
    });

    assert.deepEqual(result.content.trust_signals.map((signal) => signal.rule_ref), [
      "trust_signals.narrative.stability_low",
    ]);
    assert.equal(
      result.content.trust_signals[0]?.confidence,
      TRUST_SIGNALS_CALIBRATION.NARRATIVE_STABILITY_CONFIDENCE_FALLBACK,
    );
  });

  it("uses contract constants for capital allocation confidence tiers", async () => {
    const capitalArtifact = capitalAllocationTrackingArtifact();

    capitalArtifact.content.gaps = [
      ...(capitalArtifact.content.gaps ?? []),
      {
        gap_id: "gap-3",
        gap_type: "insufficient_evidence",
        priority_refs: [],
        deployment_refs: [],
        evidence_refs: [],
      },
    ];

    const result = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-capital-calibration",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        capital_allocation_tracking: capitalArtifact,
      },
    });

    const confidenceByRecord = new Map(
      result.content.trust_signals.map((signal) => [signal.source_record_refs[0], signal.confidence]),
    );

    assert.equal(confidenceByRecord.get("gap-1"), TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_MULTI_EVIDENCE_CONFIDENCE);
    assert.equal(confidenceByRecord.get("gap-2"), TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_SINGLE_EVIDENCE_CONFIDENCE);
    assert.equal(confidenceByRecord.get("gap-3"), TRUST_SIGNALS_CALIBRATION.CAPITAL_ALLOCATION_NO_EVIDENCE_CONFIDENCE);
  });

  it("uses contract constants for commitment fallback confidence", async () => {
    const commitmentArtifact = commitmentTrackingArtifact();

    commitmentArtifact.content.commitments = [
      {
        commitment_id: "commitment-without-confidence",
        status: "delayed",
        statement: "Expand cloud capacity.",
        evidence: [],
      },
    ];

    const result = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-commitment-calibration",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies: {
        commitment_tracking: commitmentArtifact,
      },
    });

    assert.equal(
      result.content.trust_signals[0]?.confidence,
      TRUST_SIGNALS_CALIBRATION.COMMITMENT_CONFIDENCE_FALLBACK,
    );
  });

  it("fails when no trust pillar is provided", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
        builderType: TRUST_SIGNALS_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "trust-signals-missing-pillars",
        input: input(),
        inputHash: "trust-signals-input-hash",
        dependencies: {},
      }),
      BuilderDependencyError,
    );
  });

  it("enforces dimension ownership and no adjacent evidence substitution", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      dimension: "accounting_stability",
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects missing evidence references", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      evidence_refs: [],
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects missing source artifact references", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      source_artifact_refs: [],
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects missing source record references", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      source_record_refs: [],
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects invalid confidence bounds", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      confidence: 1.1,
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects summary reconciliation mismatches", () => {
    const content = validTrustSignalsContent();
    content.summary.total_signals += 1;

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects enrichment consistency violations", () => {
    const content = validTrustSignalsContent();
    content.enrichment_status.narrative_consistency = {
      available: true,
      artifact_path: null,
      artifact_version: 1,
      absent_reason: null,
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects depth consistency violations", () => {
    const content = validTrustSignalsContent();
    content.depth_indicator.overall = "standard";

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects missing dimension mismatches", () => {
    const content = validTrustSignalsContent();
    content.missing_dimensions = [];

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden trust verdict and investor language", () => {
    const content = validTrustSignalsContent();
    content.trust_signals[0] = {
      ...content.trust_signals[0] as TrustSignal,
      observation: "Management appears reliable and investors should buy.",
    };

    assert.throws(
      () => validateTrustSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("emits deterministic signal ordering for replayability", async () => {
    const dependencies = {
      commitment_tracking: commitmentTrackingArtifact(),
      narrative_consistency: narrativeConsistencyArtifact(),
      accounting_stability: accountingStabilityArtifact(),
      capital_allocation_tracking: capitalAllocationTrackingArtifact(),
    };
    const first = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-replay-1",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies,
    });
    const second = await executor(new TestArtifactRepository()).executeBuilder<TrustSignalsBuilderInput, TrustSignalsArtifactContent>({
      builderType: TRUST_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "trust-signals-replay-2",
      input: input(),
      inputHash: "trust-signals-input-hash",
      dependencies,
    });

    assert.deepEqual(
      first.content.trust_signals.map((signal) => signal.signal_id),
      second.content.trust_signals.map((signal) => signal.signal_id),
    );
  });

  it("keeps calibration values out of implementation modules", () => {
    const implementationFiles = [
      "../commitment-signals.ts",
      "../narrative-signals.ts",
      "../accounting-signals.ts",
      "../capital-allocation-signals.ts",
      "../signal-factory.ts",
      "../signal-summary.ts",
      "../enrichment.ts",
      "../validator.ts",
    ];

    for (const file of implementationFiles) {
      const source = readFileSync(join(process.cwd(), "builders/trust-signals-builder/tests", file), "utf8");

      assert.equal(/\b0\.\d+\b/.test(source), false, `${file} contains a hidden confidence literal.`);
      assert.equal(/toFixed\(\d+/.test(source), false, `${file} contains hidden rounding precision.`);
      assert.equal(/availableCount === \d+/.test(source), false, `${file} contains hidden full-depth pillar count.`);
      assert.equal(/availableCount >= \d+/.test(source), false, `${file} contains hidden standard-depth pillar count.`);
    }
  });
});

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: TRUST_SIGNALS_BUILDER_TYPE,
    artifact_type: "trust_signals",
    version: TRUST_SIGNALS_BUILDER_VERSION,
    schema_version: TRUST_SIGNALS_SCHEMA_VERSION,
    pipeline_version: TRUST_SIGNALS_PIPELINE_VERSION,
  }, () => new TrustSignalsBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
