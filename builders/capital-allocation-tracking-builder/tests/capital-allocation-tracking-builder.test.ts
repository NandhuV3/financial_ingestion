import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { CapitalAllocationTrackingBuilder } from "../builder.js";
import {
  CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
  CAPITAL_ALLOCATION_TRACKING_BUILDER_VERSION,
  CAPITAL_ALLOCATION_TRACKING_PIPELINE_VERSION,
  CAPITAL_ALLOCATION_TRACKING_SCHEMA_VERSION,
} from "../contract.js";
import type {
  CapitalAllocationTrackingArtifactContent,
  CapitalAllocationTrackingBuilderInput,
} from "../types.js";
import { validateCapitalAllocationTrackingArtifactContent } from "../validator.js";
import {
  companyKnowledgeArtifact,
  filingArtifact,
  financialStatementsArtifact,
  input,
  priorCapitalAllocationArtifact,
  priorFinancialStatementsArtifact,
  TestArtifactRepository,
  validCapitalAllocationContent,
} from "./capital-allocation-tracking.fixtures.js";

describe("capital allocation tracking builder", () => {
  it("generates a first-period artifact through the Builder Framework", async () => {
    const repository = new TestArtifactRepository();
    const result = await executor(repository)
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-first-period",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies: requiredDependencies(),
      });

    assert.equal(result.identity.artifact_type, "capital_allocation_tracking");
    assert.equal(result.metadata.schema_version, CAPITAL_ALLOCATION_TRACKING_SCHEMA_VERSION);
    assert.equal(result.metadata.pipeline_version, CAPITAL_ALLOCATION_TRACKING_PIPELINE_VERSION);
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.equal(result.content.stated_priorities.length, 1);
    assert.equal(result.content.observed_deployments.length, 1);
    assert.equal(result.content.gaps[0]?.gap_type, "aligned");
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "capital_allocation_tracking",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), result);
  });

  it("sets full depth when prior period enrichment is available", async () => {
    const result = await executor(new TestArtifactRepository())
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-full-depth",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies: {
          ...requiredDependencies(),
          prior_capital_allocation_tracking: priorCapitalAllocationArtifact(),
          prior_financial_statements: priorFinancialStatementsArtifact(),
        },
      });

    assert.equal(result.content.depth_indicator.overall, "full");
    assert.equal(result.content.depth_indicator.prior_period_dimension, "present");
    assert.equal(result.content.coverage_status.prior_period_available, true);
  });

  it("detects under-supported priorities and unsupported deployments", async () => {
    const result = await executor(new TestArtifactRepository())
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-gaps",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies: {
          company_knowledge: companyKnowledgeArtifact(),
          current_filing: filingArtifact({
            capital_allocation_priorities: [
              {
                priority_id: "priority-dividends",
                priority_type: "dividends",
                description: "Return capital through dividends.",
                evidence_refs: ["filing:priority-dividends"],
                filing_refs: ["filing-1:item2"],
              },
            ],
          }),
          current_financial_statements: financialStatementsArtifact({
            coverage: "complete",
            capital_deployments: [
              {
                deployment_id: "deployment-buybacks",
                deployment_type: "buybacks",
                amount: 100,
                evidence_refs: ["financials:buybacks"],
                filing_refs: ["filing-1:cash-flow"],
                financial_statement_refs: ["financial-statements-1:cash-flow"],
              },
            ],
          }),
        },
      });
    const gapTypes = result.content.gaps.map((gap) => gap.gap_type).sort();

    assert.deepEqual(gapTypes, ["under_supported", "unsupported_deployment"]);
  });

  it("handles no priorities found without fabricating gaps", async () => {
    const result = await executor(new TestArtifactRepository())
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-no-priorities",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies: {
          ...requiredDependencies(),
          current_filing: filingArtifact({ capital_allocation_priorities: [] }),
        },
      });

    assert.equal(result.content.coverage_status.priorities_available, false);
    assert.equal(result.content.stated_priorities.length, 0);
    assert.equal(result.content.gaps.length, 1);
    assert.equal(result.content.gaps[0]?.gap_type, "unsupported_deployment");
  });

  it("fails fast when current financial statements are missing", async () => {
    await assert.rejects(
      executor(new TestArtifactRepository())
        .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
          builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
          companyId: "MSFT",
          periodId: "2026-Q2",
          executionId: "capital-allocation-missing-financials",
          input: input(),
          inputHash: "capital-allocation-input-hash",
          dependencies: {
            company_knowledge: companyKnowledgeArtifact(),
            current_filing: filingArtifact(),
          },
        }),
      BuilderDependencyError,
    );
  });

  it("rejects summary reconciliation mismatches", () => {
    const content = validCapitalAllocationContent();
    content.period_summary.gap_count += 1;

    assert.throws(
      () => validateCapitalAllocationTrackingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects invalid enrichment and depth consistency", () => {
    const content = validCapitalAllocationContent();
    content.enrichment_status.prior_financial_statements = {
      available: true,
      artifact_path: null,
      artifact_version: 1,
      absent_reason: null,
    };

    assert.throws(
      () => validateCapitalAllocationTrackingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("rejects orphaned gap references", () => {
    const content = validCapitalAllocationContent();
    content.gaps[0] = {
      ...content.gaps[0] as CapitalAllocationTrackingArtifactContent["gaps"][number],
      priority_refs: ["unknown-priority"],
    };

    assert.throws(
      () => validateCapitalAllocationTrackingArtifactContent(content),
      BuilderValidationError,
    );
  });

  it("is replayable for identical inputs", async () => {
    const dependencies = requiredDependencies();
    const first = await executor(new TestArtifactRepository())
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-replay-1",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies,
      });
    const second = await executor(new TestArtifactRepository())
      .executeBuilder<CapitalAllocationTrackingBuilderInput, CapitalAllocationTrackingArtifactContent>({
        builderType: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "capital-allocation-replay-2",
        input: input(),
        inputHash: "capital-allocation-input-hash",
        dependencies,
      });

    assert.deepEqual(first.content, second.content);
  });
});

function requiredDependencies(): Record<string, Artifact<unknown>> {
  return {
    company_knowledge: companyKnowledgeArtifact(),
    current_filing: filingArtifact(),
    current_financial_statements: financialStatementsArtifact(),
  };
}

function executor(repository: ArtifactRepository): BuilderExecutor {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: CAPITAL_ALLOCATION_TRACKING_BUILDER_TYPE,
    artifact_type: "capital_allocation_tracking",
    version: CAPITAL_ALLOCATION_TRACKING_BUILDER_VERSION,
    schema_version: CAPITAL_ALLOCATION_TRACKING_SCHEMA_VERSION,
    pipeline_version: CAPITAL_ALLOCATION_TRACKING_PIPELINE_VERSION,
  }, () => new CapitalAllocationTrackingBuilder());

  return new BuilderExecutor(registry, new ArtifactService(repository));
}
