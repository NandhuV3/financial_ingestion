import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { stableHash } from "../../investor-intelligence-builder/hashes.js";
import { FilingArtifactBuilder } from "../builder.js";
import {
  FILING_ARTIFACT_BUILDER_TYPE,
  FILING_ARTIFACT_BUILDER_VERSION,
  FILING_ARTIFACT_PIPELINE_VERSION,
  FILING_ARTIFACT_SCHEMA_VERSION,
  FILING_SECTION_SEPARATOR,
} from "../contract.js";
import {
  assembleFilingContent,
  calculateFilingHash,
} from "../content-assembler.js";
import type { FilingArtifactBuilderInput } from "../types.js";

describe("filing artifact builder", () => {
  it("assembles normalized sections deterministically", () => {
    const first = assembleFilingContent({
      management_discussion: "Management paragraph one.\n\nManagement paragraph two.",
      risk_factors: "Risk paragraph one.\n\nRisk paragraph two.",
    });
    const second = assembleFilingContent({
      management_discussion: "Management paragraph one.\n\nManagement paragraph two.",
      risk_factors: "Risk paragraph one.\n\nRisk paragraph two.",
    });

    assert.equal(first, second);
  });

  it("generates a stable filing hash from assembled content", () => {
    const content = assembleFilingContent(baseInput());

    assert.equal(calculateFilingHash(content), stableHash(content));
    assert.equal(calculateFilingHash(content), calculateFilingHash(content));
    assert.notEqual(calculateFilingHash(content), baseInput().raw_html_hash);
  });

  it("rejects a missing Management Discussion section", async () => {
    const builder = new FilingArtifactBuilder();

    await assert.rejects(
      () => builder.validateInput({
        ...baseInput(),
        management_discussion: " ",
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message === "management_discussion must be a non-empty string.",
    );
  });

  it("rejects a missing Risk Factors section", async () => {
    const builder = new FilingArtifactBuilder();

    await assert.rejects(
      () => builder.validateInput({
        ...baseInput(),
        risk_factors: "",
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message === "risk_factors must be a non-empty string.",
    );
  });

  it("builds and persists a valid 10-Q Filing artifact", async () => {
    const input = baseInput();
    const artifact = await execute(input);

    assert.equal(artifact.identity.artifact_type, "filing");
    assert.equal(artifact.identity.company_id, input.company_id);
    assert.equal(artifact.identity.period_id, input.period_id);
    assert.equal(artifact.metadata.schema_version, FILING_ARTIFACT_SCHEMA_VERSION);
    assert.equal(
      artifact.metadata.pipeline_version,
      FILING_ARTIFACT_PIPELINE_VERSION,
    );
    assert.equal(artifact.metadata.input_hash, stableHash(input));
    assert.deepEqual(artifact.lineage.upstream_dependencies, []);
    assert.deepEqual(artifact.content, {
      filing_id: input.filing_id,
      filing_type: input.filing_type,
      filing_content: assembleFilingContent(input),
      filing_hash: calculateFilingHash(assembleFilingContent(input)),
      filing_period: input.filing_period,
    });
  });

  it("replays to identical builder content for identical inputs", async () => {
    const input = baseInput();
    const first = await execute(input);
    const second = await execute(structuredClone(input));

    assert.deepEqual(first.content, second.content);
    assert.equal(first.metadata.input_hash, second.metadata.input_hash);
  });

  it("always orders Management Discussion before Risk Factors", () => {
    const content = assembleFilingContent({
      management_discussion: "MANAGEMENT",
      risk_factors: "RISKS",
    });

    assert.equal(content, `MANAGEMENT${FILING_SECTION_SEPARATOR}RISKS`);
    assert.ok(content.indexOf("MANAGEMENT") < content.indexOf("RISKS"));
  });

  it("preserves internal paragraph boundaries", () => {
    const content = assembleFilingContent({
      management_discussion:
        " First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n",
      risk_factors: "\nFirst risk.\n\nSecond risk. ",
    });

    assert.equal(
      content,
      " First paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n"
        + FILING_SECTION_SEPARATOR
        + "\nFirst risk.\n\nSecond risk. ",
    );
  });
});

async function execute(input: FilingArtifactBuilderInput) {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: FILING_ARTIFACT_BUILDER_TYPE,
    artifact_type: "filing",
    version: FILING_ARTIFACT_BUILDER_VERSION,
    schema_version: FILING_ARTIFACT_SCHEMA_VERSION,
    pipeline_version: FILING_ARTIFACT_PIPELINE_VERSION,
  }, () => new FilingArtifactBuilder());

  return new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  ).executeBuilder<FilingArtifactBuilderInput, FilingArtifactContent>({
    builderType: FILING_ARTIFACT_BUILDER_TYPE,
    companyId: input.company_id,
    periodId: input.period_id,
    executionId: `${input.company_id}:${input.period_id}:filing`,
    input,
    inputHash: stableHash(input),
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function baseInput(): FilingArtifactBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_period: "2026-Q2",
    accession_number: "0001193125-26-191507",
    management_discussion:
      "Management paragraph one.\n\nManagement paragraph two.",
    risk_factors: "Risk paragraph one.\n\nRisk paragraph two.",
    raw_html_hash: "raw-html-hash",
  };
}
