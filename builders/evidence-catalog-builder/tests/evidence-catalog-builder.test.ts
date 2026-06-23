import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import type {
  EvidenceCatalogArtifactContent,
} from "../../../contracts/artifacts/evidence-catalog-artifact-content.js";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import {
  ArtifactService,
  calculateArtifactHash,
} from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { stableHash } from "../../investor-intelligence-builder/hashes.js";
import { EvidenceCatalogBuilder } from "../builder.js";
import {
  buildEvidenceCatalogEntries,
  createEvidenceHash,
  normalizeEvidenceParagraph,
} from "../catalog-builder.js";
import {
  EVIDENCE_CATALOG_BUILDER_TYPE,
  EVIDENCE_CATALOG_BUILDER_VERSION,
  EVIDENCE_CATALOG_PIPELINE_VERSION,
  EVIDENCE_CATALOG_SCHEMA_VERSION,
} from "../contract.js";
import type { EvidenceCatalogBuilderInput } from "../types.js";
import { validateEvidenceCatalogContent } from "../validator.js";

describe("evidence catalog builder", () => {
  it("generates deterministic paragraph identities and ordering", () => {
    const entries = buildEvidenceCatalogEntries(filingContent());

    assert.deepEqual(
      entries.map(({ section_name, paragraph_index }) => ({
        section_name,
        paragraph_index,
      })),
      [
        { section_name: "management_discussion", paragraph_index: 1 },
        { section_name: "management_discussion", paragraph_index: 2 },
        { section_name: "management_discussion", paragraph_index: 3 },
        { section_name: "risk_factors", paragraph_index: 1 },
        { section_name: "risk_factors", paragraph_index: 2 },
        { section_name: "risk_factors", paragraph_index: 3 },
      ],
    );
    assert.equal(
      entries.every(({ evidence_ref }) => evidence_ref.startsWith("evidence:")),
      true,
    );
  });

  it("keeps identity stable for formatting-only paragraph changes", () => {
    assert.equal(
      normalizeEvidenceParagraph("Revenue    increased."),
      normalizeEvidenceParagraph("Revenue increased."),
    );

    const first = buildEvidenceCatalogEntries(filingContent());
    const second = buildEvidenceCatalogEntries({
      ...filingContent(),
      filing_content: filingContent().filing_content.replace(
        "Revenue increased.",
        "Revenue    increased.",
      ),
    });

    assert.deepEqual(first, second);
  });

  it("hashes the exact normalized paragraph bytes", () => {
    const paragraph = "Revenue    increased.";
    const expected = createHash("sha256")
      .update("Revenue increased.", "utf8")
      .digest("hex");

    assert.equal(createEvidenceHash(paragraph), expected);
  });

  it("preserves duplicate paragraphs with shared hashes and distinct refs", () => {
    const filing = filingContent();
    filing.filing_content = filing.filing_content.replace(
      "Azure demand increased.",
      "Revenue increased.",
    );
    const duplicates = buildEvidenceCatalogEntries(filing)
      .filter(({ paragraph_text }) => paragraph_text === "Revenue increased.");

    assert.equal(duplicates.length, 2);
    assert.equal(duplicates[0]?.evidence_hash, duplicates[1]?.evidence_hash);
    assert.notEqual(duplicates[0]?.evidence_ref, duplicates[1]?.evidence_ref);
  });

  it("builds replayable catalog artifacts", async () => {
    const first = await execute();
    const second = await execute();

    assert.deepEqual(first.content, second.content);
    assert.equal(first.metadata.input_hash, second.metadata.input_hash);
    assert.equal(first.content.entries.length, 6);
  });

  it("rejects duplicate evidence references", () => {
    const content = catalogContent();
    content.entries[1] = {
      ...content.entries[1]!,
      evidence_ref: content.entries[0]!.evidence_ref,
    };

    assert.throws(
      () => validate(content),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("Duplicate evidence_ref"),
    );
  });

  it("rejects ordering instability", () => {
    const content = catalogContent();
    content.entries = [
      content.entries[3]!,
      ...content.entries.slice(0, 3),
      ...content.entries.slice(4),
    ];

    assert.throws(
      () => validate(content),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("ordering is invalid"),
    );
  });

  it("rejects hash and reference reconciliation failures", () => {
    const hashTampered = catalogContent();
    hashTampered.entries[0]!.evidence_hash = "tampered";
    assert.throws(() => validate(hashTampered), BuilderValidationError);

    const refTampered = catalogContent();
    refTampered.entries[0]!.evidence_ref = "evidence:tampered";
    assert.throws(() => validate(refTampered), BuilderValidationError);
  });

  it("rejects a Filing dependency identity mismatch", async () => {
    await assert.rejects(
      () => execute({
        ...filingArtifact(),
        identity: {
          ...filingArtifact().identity,
          period_id: "2026-Q1",
        },
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("does not reconcile"),
    );
  });
});

async function execute(filing = filingArtifact()) {
  const registry = new BuilderRegistry();
  const input = builderInput();

  registry.registerBuilder({
    builder_type: EVIDENCE_CATALOG_BUILDER_TYPE,
    artifact_type: "evidence_catalog",
    version: EVIDENCE_CATALOG_BUILDER_VERSION,
    schema_version: EVIDENCE_CATALOG_SCHEMA_VERSION,
    pipeline_version: EVIDENCE_CATALOG_PIPELINE_VERSION,
  }, () => new EvidenceCatalogBuilder());

  return new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  ).executeBuilder<
    EvidenceCatalogBuilderInput,
    EvidenceCatalogArtifactContent
  >({
    builderType: EVIDENCE_CATALOG_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:evidence-catalog",
    input,
    inputHash: stableHash(input),
    dependencies: { filing },
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function builderInput(): EvidenceCatalogBuilderInput {
  return {
    filing_artifact: filingContent(),
  };
}

function filingContent(): FilingArtifactContent {
  const filing_content = [
    "ITEM 2. MANAGEMENT'S DISCUSSION AND ANALYSIS",
    "Revenue increased.",
    "Azure demand increased.",
    "ITEM 1A. RISK FACTORS",
    "Competition remained intense.",
    "Capacity constraints continued.",
  ].join("\n\n");

  return {
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content,
    filing_hash: stableHash(filing_content),
    filing_period: "2026-Q2",
  };
}

function filingArtifact(): Artifact<FilingArtifactContent> {
  const content = filingContent();

  return {
    identity: {
      artifact_id: "filing-msft-2026-q2",
      artifact_type: "filing",
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "filing-v1",
      pipeline_version: "filing-pipeline-v1",
      generated_at: "2026-06-22T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "filing-input",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "filing-artifact-builder",
      },
    },
    content,
  };
}

function catalogContent(): EvidenceCatalogArtifactContent {
  const filing = filingContent();

  return {
    artifact_type: "evidence_catalog",
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: filing.filing_id,
    filing_hash: filing.filing_hash,
    entries: buildEvidenceCatalogEntries(filing),
  };
}

function validate(content: EvidenceCatalogArtifactContent): void {
  validateEvidenceCatalogContent({
    builderInput: builderInput(),
    content,
    companyId: "MSFT",
    periodId: "2026-Q2",
  });
}
