import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { QuarterUnderstandingBuilder } from "../builder.js";
import { QUARTER_UNDERSTANDING_CALIBRATION } from "../calibration-contract.js";
import {
  QUARTER_UNDERSTANDING_BUILDER_TYPE,
  QUARTER_UNDERSTANDING_BUILDER_VERSION,
  QUARTER_UNDERSTANDING_PIPELINE_VERSION,
  QUARTER_UNDERSTANDING_SCHEMA_VERSION,
} from "../contract.js";
import type {
  QuarterUnderstandingArtifactContent,
  QuarterUnderstandingBuilderInput,
  Understanding,
} from "../types.js";
import { validateQuarterUnderstandingArtifactContent } from "../validator.js";
import {
  artifact,
  businessSignalsArtifact,
  companyKnowledgeArtifact,
  conceptRegistryArtifact,
  input,
  TestArtifactRepository,
  topicEvolutionArtifact,
  trustSignalsArtifact,
  validQuarterUnderstandingContent,
} from "./quarter-understanding-builder.fixtures.js";

describe("quarter understanding builder", () => {
  it("generates a valid base artifact from Company Knowledge and Business Signals", async () => {
    const repository = new TestArtifactRepository();
    const result = await executor(repository).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-base",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(result.identity.artifact_type, "quarter_understanding");
    assert.equal(result.metadata.schema_version, QUARTER_UNDERSTANDING_SCHEMA_VERSION);
    assert.equal(result.metadata.pipeline_version, QUARTER_UNDERSTANDING_PIPELINE_VERSION);
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.equal(result.content.depth_indicator.trust_dimension, "absent");
    assert.equal(result.content.depth_indicator.longitudinal_dimension, "absent");
    assert.equal(result.content.understandings.some((understanding) => understanding.category === "trust"), false);
    assert.equal(result.content.understandings.every((understanding) =>
      understanding.evidence_package.trust_signal_refs.length === 0), true);
    assert.deepEqual(result.content.limitations.trust_dimension_gaps, [
      "commitment_follow_through",
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ]);
    assert.equal(result.content.proposed_concepts.length > 0, true);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "quarter_understanding",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("adds trust interpretation only when Trust Signals are present", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-trust",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
        trust_signals: trustSignalsArtifact(),
      },
    });
    const trustUnderstandings = result.content.understandings.filter((understanding) =>
      understanding.category === "trust");

    assert.equal(result.content.depth_indicator.trust_dimension, "present");
    assert.equal(trustUnderstandings.length, 1);
    assert.deepEqual(trustUnderstandings[0]?.evidence_package.trust_signal_refs, ["trust-signal-1"]);
    assert.deepEqual(result.content.limitations.trust_dimension_gaps, [
      "narrative_consistency",
      "explanation_quality",
      "accounting_stability",
      "capital_allocation_consistency",
    ]);
  });

  it("propagates full trust coverage when Trust Signals have no missing dimensions", async () => {
    const trustSignals = trustSignalsArtifact();
    trustSignals.content.missing_dimensions = [];
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-full-trust-coverage",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
        trust_signals: trustSignals,
      },
    });

    assert.deepEqual(result.content.limitations.trust_dimension_gaps, []);
  });

  it("enriches longitudinal interpretation only when Topic Evolution is present", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-topic",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
        topic_evolution: topicEvolutionArtifact(),
      },
    });

    assert.equal(result.content.depth_indicator.longitudinal_dimension, "present");
    assert.equal(result.content.understandings.some((understanding) =>
      understanding.evidence_package.topic_refs.includes("cloud")), true);
  });

  it("uses Concept Registry enrichment without creating concepts", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-concepts",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
        concept_registry: conceptRegistryArtifact(),
      },
    });

    assert.equal(result.content.enrichment_status.concept_registry.available, true);
    assert.equal(result.content.proposed_concepts.length, 0);
    assert.equal(result.content.understandings.every((understanding) => understanding.concept_id !== undefined), true);
  });

  it("sets full depth when all enrichment inputs are available", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-full",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
        trust_signals: trustSignalsArtifact(),
        topic_evolution: topicEvolutionArtifact(),
        concept_registry: conceptRegistryArtifact(),
      },
    });

    assert.equal(result.content.depth_indicator.overall, "full");
    assert.equal(result.content.depth_indicator.trust_dimension, "present");
    assert.equal(result.content.depth_indicator.longitudinal_dimension, "present");
  });

  it("fails when Company Knowledge is missing", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
        builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "quarter-understanding-missing-ck",
        input: input(),
        inputHash: "quarter-understanding-input-hash",
        dependencies: {
          business_signals: businessSignalsArtifact(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("fails when Business Signals is missing", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
        builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "quarter-understanding-missing-signals",
        input: input(),
        inputHash: "quarter-understanding-input-hash",
        dependencies: {
          company_knowledge: companyKnowledgeArtifact(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("rejects forbidden direct Quarter Change and trust pillar dependencies", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
        builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "quarter-understanding-forbidden",
        input: input(),
        inputHash: "quarter-understanding-input-hash",
        dependencies: {
          company_knowledge: companyKnowledgeArtifact(),
          business_signals: businessSignalsArtifact(),
          quarter_change: artifact("quarter-change-1", "quarter_change", {}),
        },
      }),
      BuilderDependencyError,
    );

    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
        builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "quarter-understanding-forbidden-pillar",
        input: input(),
        inputHash: "quarter-understanding-input-hash",
        dependencies: {
          company_knowledge: companyKnowledgeArtifact(),
          business_signals: businessSignalsArtifact(),
          commitment_tracking: artifact("commitment-tracking-1", "commitment_tracking", {}),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("rejects enrichment status consistency violations", () => {
    const content = validQuarterUnderstandingContent();
    content.enrichment_status.trust_signals = {
      available: true,
      artifact_path: null,
      artifact_version: 1,
      absent_reason: null,
    };

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects depth consistency violations", () => {
    const content = validQuarterUnderstandingContent();
    content.depth_indicator.overall = "standard";

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects trust references and trust understandings when trust is absent", () => {
    const content = validQuarterUnderstandingContent();
    content.understandings[0] = {
      ...content.understandings[0] as Understanding,
      category: "trust",
      evidence_package: {
        ...content.understandings[0]?.evidence_package,
        trust_signal_refs: ["trust-signal-1"],
      },
    };

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects trust coverage limitation mismatches", () => {
    const content = validQuarterUnderstandingContent();
    content.limitations.trust_dimension_gaps = [];

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects topic references when longitudinal dimension is absent", () => {
    const content = validQuarterUnderstandingContent();
    content.understandings[0] = {
      ...content.understandings[0] as Understanding,
      evidence_package: {
        ...content.understandings[0]?.evidence_package,
        topic_refs: ["cloud"],
      },
    };

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects confidence values outside bounds", () => {
    const content = validQuarterUnderstandingContent();
    content.confidence.overall = 1.1;

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden recommendation, valuation, and investor language", () => {
    const content = validQuarterUnderstandingContent();
    content.understandings[0] = {
      ...content.understandings[0] as Understanding,
      explanation: "This is a buy recommendation with valuation upside.",
    };

    assert.throws(
      () => validateQuarterUnderstandingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects forbidden language variants across understanding text", () => {
    const forbiddenPhrases = [
      "should buy",
      "should sell",
      "should hold",
      "price target",
      "price targets",
      "target price",
      "target prices",
      "expected return",
      "expected returns",
    ];

    for (const phrase of forbiddenPhrases) {
      const content = validQuarterUnderstandingContent();

      content.understandings[0] = {
        ...content.understandings[0] as Understanding,
        explanation: `This text includes ${phrase}.`,
      };

      assert.throws(
        () => validateQuarterUnderstandingArtifactContent(content),
        BuilderValidationError,
        phrase,
      );
    }
  });

  it("rejects forbidden language in proposed concept text fields", () => {
    const conceptFields = [
      ["title", "price target"],
      ["description", "expected return"],
      ["rationale", "should buy"],
    ] as const;

    for (const [field, phrase] of conceptFields) {
      const content = validQuarterUnderstandingContent();

      content.proposed_concepts[0] = {
        ...content.proposed_concepts[0]!,
        [field]: `Contains ${phrase}.`,
      };

      assert.throws(
        () => validateQuarterUnderstandingArtifactContent(content),
        BuilderValidationError,
        field,
      );
    }
  });

  it("uses contract constants for deterministic confidence calibration", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-calibration",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        business_signals: businessSignalsArtifact(),
      },
    });

    assert.equal(QUARTER_UNDERSTANDING_CALIBRATION.SUPPORTED_ENRICHMENT_DIMENSION_COUNT, 3);
    assert.equal(QUARTER_UNDERSTANDING_CALIBRATION.OVERALL_CONFIDENCE_COMPONENT_COUNT, 4);
    assert.equal(typeof result.content.confidence.overall, "number");
  });

  it("keeps calibration values out of implementation modules", () => {
    const implementationFiles = [
      "../business-interpretation.ts",
      "../trust-interpretation.ts",
      "../confidence.ts",
    ];

    for (const file of implementationFiles) {
      const source = readFileSync(join(process.cwd(), "builders/quarter-understanding-builder/tests", file), "utf8");

      assert.equal(/\b0\.\d+\b/.test(source), false, `${file} contains a hidden confidence literal.`);
      assert.equal(/toFixed\(\d+/.test(source), false, `${file} contains hidden rounding precision.`);
      assert.equal(/\/\s*\d+/.test(source), false, `${file} contains hidden component count.`);
    }
  });

  it("is deterministic for repeated executions with identical inputs", async () => {
    const dependencies = {
      company_knowledge: companyKnowledgeArtifact(),
      business_signals: businessSignalsArtifact(),
      trust_signals: trustSignalsArtifact(),
      topic_evolution: topicEvolutionArtifact(),
    };
    const first = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-replay-1",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies,
    });
    const second = await executor(new TestArtifactRepository()).executeBuilder<QuarterUnderstandingBuilderInput, QuarterUnderstandingArtifactContent>({
      builderType: QUARTER_UNDERSTANDING_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "quarter-understanding-replay-2",
      input: input(),
      inputHash: "quarter-understanding-input-hash",
      dependencies,
    });

    assert.deepEqual(first.content, second.content);
  });
});

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: QUARTER_UNDERSTANDING_BUILDER_TYPE,
    artifact_type: "quarter_understanding",
    version: QUARTER_UNDERSTANDING_BUILDER_VERSION,
    schema_version: QUARTER_UNDERSTANDING_SCHEMA_VERSION,
    pipeline_version: QUARTER_UNDERSTANDING_PIPELINE_VERSION,
  }, () => new QuarterUnderstandingBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
