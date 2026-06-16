import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { BusinessSignalsBuilder } from "../builder.js";
import {
  BUSINESS_SIGNALS_BUILDER_TYPE,
  BUSINESS_SIGNALS_BUILDER_VERSION,
  BUSINESS_SIGNALS_PIPELINE_VERSION,
  BUSINESS_SIGNALS_SCHEMA_VERSION,
} from "../contract.js";
import type {
  BusinessSignal,
  BusinessSignalsArtifactContent,
  BusinessSignalsBuilderInput,
} from "../types.js";
import { validateBusinessSignalsArtifactContent } from "../validator.js";
import {
  artifact,
  companyKnowledgeArtifact,
  input,
  quarterChangeArtifact,
  TestArtifactRepository,
  topicEvolutionArtifact,
  validBusinessSignalsContent,
} from "./business-signals-builder.fixtures.js";

describe("business signals builder", () => {
  it("generates a valid base artifact from Company Knowledge only", async () => {
    const repository = new TestArtifactRepository();
    const companyKnowledge = companyKnowledgeArtifact();
    const result = await executor(repository).executeBuilder<BusinessSignalsBuilderInput, BusinessSignalsArtifactContent>({
      builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "business-signals-base",
      input: input(),
      inputHash: "business-signals-input-hash",
      dependencies: {
        company_knowledge: companyKnowledge,
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(result.identity.artifact_type, "business_signals");
    assert.equal(result.metadata.schema_version, BUSINESS_SIGNALS_SCHEMA_VERSION);
    assert.equal(result.metadata.pipeline_version, BUSINESS_SIGNALS_PIPELINE_VERSION);
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.equal(result.content.enrichment_status.quarter_change.available, false);
    assert.equal(result.content.enrichment_status.topic_evolution.available, false);
    assert.equal(result.content.signals.length > 0, true);
    assert.equal(result.content.signals.every((signal) => signal.evidence_refs.length > 0), true);
    assert.equal(result.content.signals.every((signal) => signal.company_knowledge_refs.length > 0), true);
    assert.equal(result.content.signals.every((signal) =>
      signal.source_artifact_refs.some((source) => source.artifact_type === "company_knowledge")), true);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "business_signals",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("generates movement signals only when Quarter Change is available", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<BusinessSignalsBuilderInput, BusinessSignalsArtifactContent>({
      builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "business-signals-movement",
      input: input(),
      inputHash: "business-signals-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        quarter_change: quarterChangeArtifact(),
      },
    });
    const movementSignals = result.content.signals.filter((signal) =>
      signal.rule_ref.startsWith("business_signals.movement."));

    assert.equal(result.content.depth_indicator.overall, "standard");
    assert.equal(result.content.enrichment_status.quarter_change.available, true);
    assert.equal(movementSignals.length, 2);
    assert.equal(movementSignals.every((signal) =>
      signal.source_artifact_refs.some((source) => source.artifact_type === "quarter_change")), true);
  });

  it("generates trend signals only when Topic Evolution is available", async () => {
    const result = await executor(new TestArtifactRepository()).executeBuilder<BusinessSignalsBuilderInput, BusinessSignalsArtifactContent>({
      builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "business-signals-trend",
      input: input(),
      inputHash: "business-signals-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        topic_evolution: topicEvolutionArtifact(),
      },
    });
    const trendSignals = result.content.signals.filter((signal) =>
      signal.rule_ref.startsWith("business_signals.trend."));

    assert.equal(result.content.enrichment_status.topic_evolution.available, true);
    assert.equal(trendSignals.length, 2);
    assert.equal(trendSignals.every((signal) =>
      signal.source_artifact_refs.some((source) => source.artifact_type === "topic_evolution")), true);
  });

  it("sets full depth when all supported enrichment inputs are available", async () => {
    const transcript = artifact("transcript-signals-1", "evaluation_report", {});
    const market = artifact("market-context-1", "evaluation_report", {});
    const industry = artifact("industry-context-1", "evaluation_report", {});
    const result = await executor(new TestArtifactRepository()).executeBuilder<BusinessSignalsBuilderInput, BusinessSignalsArtifactContent>({
      builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "business-signals-full-depth",
      input: input(),
      inputHash: "business-signals-input-hash",
      dependencies: {
        company_knowledge: companyKnowledgeArtifact(),
        quarter_change: quarterChangeArtifact(),
        topic_evolution: topicEvolutionArtifact(),
        transcript_signals: transcript,
        market_context: market,
        industry_context: industry,
      },
    });

    assert.equal(result.content.depth_indicator.overall, "full");
    assert.equal(result.content.enrichment_status.transcript_signals?.available, true);
    assert.equal(result.content.enrichment_status.market_context?.available, true);
    assert.equal(result.content.enrichment_status.industry_context?.available, true);
  });

  it("fails fast when Company Knowledge dependency is missing", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository()).executeBuilder<BusinessSignalsBuilderInput, BusinessSignalsArtifactContent>({
        builderType: BUSINESS_SIGNALS_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "business-signals-missing-ck",
        input: input(),
        inputHash: "business-signals-input-hash",
        dependencies: {},
      }),
      BuilderDependencyError,
    );
  });

  it("rejects signals without evidence references", () => {
    const content = validBusinessSignalsContent();
    content.signals[0] = {
      ...content.signals[0] as BusinessSignal,
      evidence_refs: [],
    };

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects movement signals without Quarter Change source references", () => {
    const content = validBusinessSignalsContent();
    content.signals[0] = {
      ...content.signals[0] as BusinessSignal,
      rule_ref: "business_signals.movement.quarter_change_observed",
      source_artifact_refs: [
        {
          artifact_id: "company-knowledge-1",
          artifact_type: "company_knowledge",
          artifact_version: 1,
        },
      ],
    };

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects signal summary mismatches", () => {
    const content = validBusinessSignalsContent();
    content.signal_summary.total_signals += 1;

    assert.throws(
      () => validateBusinessSignalsArtifactContent(content),
      BuilderValidationError,
    );
  });
});

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: BUSINESS_SIGNALS_BUILDER_TYPE,
    artifact_type: "business_signals",
    version: BUSINESS_SIGNALS_BUILDER_VERSION,
    schema_version: BUSINESS_SIGNALS_SCHEMA_VERSION,
    pipeline_version: BUSINESS_SIGNALS_PIPELINE_VERSION,
  }, () => new BusinessSignalsBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
