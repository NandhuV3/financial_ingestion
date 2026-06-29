import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  EvidenceIdentityContent,
} from "../../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import {
  ArtifactService,
  calculateArtifactHash,
} from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { EvidenceIdentityBuilder } from "../builder.js";
import {
  EVIDENCE_IDENTITY_BUILDER_TYPE,
  EVIDENCE_IDENTITY_BUILDER_VERSION,
  EVIDENCE_IDENTITY_PIPELINE_VERSION,
  EVIDENCE_IDENTITY_SCHEMA_VERSION,
} from "../contract.js";
import {
  buildEvidenceIdentityEntries,
  createEvidenceHash,
  createEvidenceReference,
  normalizeEvidenceParagraph,
} from "../evidence-builder.js";
import type { EvidenceIdentityBuilderInput } from "../types.js";
import { validateEvidenceIdentityContent } from "../validator.js";

describe("evidence identity builder", () => {
  it("generates deterministic paragraph identities and ordering", () => {
    const entries = buildEvidenceIdentityEntries(filingContent());

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

    const first = buildEvidenceIdentityEntries(filingContent());
    const second = buildEvidenceIdentityEntries({
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

  it("uses only filing, section, position, and content hash for references", () => {
    const evidenceHash = createEvidenceHash("Revenue increased.");

    assert.equal(
      createEvidenceReference({
        filingId: "msft-2026-q2-10q",
        sectionName: "management_discussion",
        paragraphIndex: 1,
        evidenceHash,
      }),
      `evidence:${stableHash({
        filing_id: "msft-2026-q2-10q",
        section_name: "management_discussion",
        paragraph_index: 1,
        evidence_hash: evidenceHash,
      })}`,
    );
  });

  it("preserves duplicate paragraphs with shared hashes and distinct refs", () => {
    const filing = filingContent();
    filing.filing_content = filing.filing_content.replace(
      "Azure demand increased.",
      "Revenue increased.",
    );
    const duplicates = buildEvidenceIdentityEntries(filing)
      .filter(({ paragraph_text }) => paragraph_text === "Revenue increased.");

    assert.equal(duplicates.length, 2);
    assert.equal(duplicates[0]?.evidence_hash, duplicates[1]?.evidence_hash);
    assert.notEqual(duplicates[0]?.evidence_ref, duplicates[1]?.evidence_ref);
  });

  it("builds and persists an Evidence Identity artifact", async () => {
    const artifact = await execute();

    assert.equal(artifact.identity.artifact_type, "evidence_identity");
    assert.equal(artifact.metadata.schema_version, EVIDENCE_IDENTITY_SCHEMA_VERSION);
    assert.equal(
      artifact.metadata.pipeline_version,
      EVIDENCE_IDENTITY_PIPELINE_VERSION,
    );
    assert.equal(artifact.content.filing_id, filingContent().filing_id);
    assert.equal(artifact.content.filing_hash, filingContent().filing_hash);
    assert.equal(artifact.content.entries.length, 6);
    assert.equal("company_id" in artifact.content, false);
    assert.equal("period_id" in artifact.content, false);
    assert.equal("artifact_type" in artifact.content, false);
  });

  it("builds replayable Evidence Identity content", async () => {
    const first = await execute();
    const second = await execute();

    assert.deepEqual(first.content, second.content);
    assert.equal(first.metadata.input_hash, second.metadata.input_hash);
  });

  it("rejects duplicate evidence references", () => {
    const content = evidenceIdentityContent();
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
    const content = evidenceIdentityContent();
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
    const hashTampered = evidenceIdentityContent();
    hashTampered.entries[0]!.evidence_hash = "tampered";
    assert.throws(() => validate(hashTampered), BuilderValidationError);

    const refTampered = evidenceIdentityContent();
    refTampered.entries[0]!.evidence_ref = "evidence:tampered";
    assert.throws(() => validate(refTampered), BuilderValidationError);
  });

  it("rejects a missing Filing Artifact dependency", async () => {
    await assert.rejects(
      () => execute(undefined, false),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("requires the Filing Artifact dependency"),
    );
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

async function execute(
  filing: Artifact<FilingArtifactContent> | undefined = filingArtifact(),
  includeDependency = true,
) {
  const registry = new BuilderRegistry();
  const input = builderInput();

  registry.registerBuilder({
    builder_type: EVIDENCE_IDENTITY_BUILDER_TYPE,
    artifact_type: "evidence_identity",
    version: EVIDENCE_IDENTITY_BUILDER_VERSION,
    schema_version: EVIDENCE_IDENTITY_SCHEMA_VERSION,
    pipeline_version: EVIDENCE_IDENTITY_PIPELINE_VERSION,
  }, () => new EvidenceIdentityBuilder());

  return new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  ).executeBuilder<
    EvidenceIdentityBuilderInput,
    EvidenceIdentityContent
  >({
    builderType: EVIDENCE_IDENTITY_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:evidence-identity",
    input,
    inputHash: stableHash(input),
    dependencies: includeDependency && filing ? { filing } : {},
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function builderInput(): EvidenceIdentityBuilderInput {
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

function evidenceIdentityContent(): EvidenceIdentityContent {
  const filing = filingContent();

  return {
    filing_id: filing.filing_id,
    filing_hash: filing.filing_hash,
    entries: buildEvidenceIdentityEntries(filing),
  };
}

function validate(content: EvidenceIdentityContent): void {
  validateEvidenceIdentityContent({
    builderInput: builderInput(),
    content,
  });
}
