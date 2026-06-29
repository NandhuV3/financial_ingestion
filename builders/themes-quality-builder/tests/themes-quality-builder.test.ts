import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  EvidenceIdentityContent,
} from "../../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import {
  calculateArtifactHash,
} from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type {
  BuilderContext,
} from "../../../packages/builder-framework/src/builder-context.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import {
  buildEvidenceIdentityEntries,
  createEvidenceHash,
} from "../../evidence-identity-builder/evidence-builder.js";
import { ThemesQualityBuilder } from "../builder.js";
import { THEMES_QUALITY_BUILDER_TYPE } from "../contract.js";
import type { ThemesQualityBuilderInput } from "../types.js";

describe("themes quality builder", () => {
  it("produces ready transient readiness content and an execution record", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    const output = await execute(evidenceIdentity);

    assert.equal(output.builder_result.content.readiness_status, "ready");
    assert.equal(
      output.builder_result.content.evidence_identity_artifact_id,
      "evidence-identity-msft-2026-q2",
    );
    assert.deepEqual(
      output.builder_result.content.validated_evidence,
      evidenceIdentity.entries,
    );
    assert.notEqual(
      output.builder_result.content.validated_evidence,
      evidenceIdentity.entries,
    );
    assert.deepEqual(
      output.builder_result.content.validated_section_hierarchy,
      [
        {
          section_name: "management_discussion",
          evidence_refs: evidenceIdentity.entries
            .filter(({ section_name }) => section_name === "management_discussion")
            .map(({ evidence_ref }) => evidence_ref),
        },
        {
          section_name: "risk_factors",
          evidence_refs: evidenceIdentity.entries
            .filter(({ section_name }) => section_name === "risk_factors")
            .map(({ evidence_ref }) => evidence_ref),
        },
      ],
    );
    assert.deepEqual(output.builder_result.content.metrics, {
      evidence_entry_count: 6,
      section_count: 2,
      section_distribution: {
        management_discussion: 3,
        risk_factors: 3,
      },
      duplicate_reference_count: 0,
      orphan_reference_count: 0,
      invalid_hash_count: 0,
      ordering_issue_count: 0,
    });
    assert.equal("identity" in output.builder_result.content, false);
    assert.equal("metadata" in output.builder_result.content, false);
    assert.equal("lineage" in output.builder_result.content, false);
    assert.deepEqual(output.execution_record, {
      builder_type: THEMES_QUALITY_BUILDER_TYPE,
      execution_id: "MSFT:2026-Q2:themes-quality",
      company_id: "MSFT",
      period_id: "2026-Q2",
      evidence_identity_artifact_id: "evidence-identity-msft-2026-q2",
      status: "success",
      readiness_status: "ready",
      finding_count: 0,
      blocking_finding_count: 0,
      warning_finding_count: 0,
      metrics: output.builder_result.content.metrics,
      started_at: "2026-06-22T00:00:00.000Z",
      completed_at: "2026-06-22T00:00:00.000Z",
      duration_ms: 7,
    });
  });

  it("returns only the transient BuilderResult through execute", async () => {
    const result = await builder().execute(context(evidenceIdentityContent()));

    assert.equal(result.content.readiness_status, "ready");
    assert.equal("execution_record" in result, false);
  });

  it("is replayable for identical Evidence Identity input", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    const first = await execute(evidenceIdentity);
    const second = await execute(structuredClone(evidenceIdentity));

    assert.deepEqual(first.builder_result, second.builder_result);
  });

  it("does not mutate upstream Evidence Identity content", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    const before = structuredClone(evidenceIdentity);

    await execute(evidenceIdentity);

    assert.deepEqual(evidenceIdentity, before);
  });

  it("returns not_ready for duplicate evidence references", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    evidenceIdentity.entries[1] = {
      ...evidenceIdentity.entries[1]!,
      evidence_ref: evidenceIdentity.entries[0]!.evidence_ref,
    };

    const output = await execute(evidenceIdentity);

    assert.equal(output.builder_result.content.readiness_status, "not_ready");
    assert.equal(output.builder_result.content.validated_evidence.length, 0);
    assert.equal(
      output.builder_result.content.metrics.duplicate_reference_count,
      1,
    );
    assert.ok(output.builder_result.content.findings.some(
      ({ code }) => code === "duplicate_evidence_reference",
    ));
    assert.equal(output.execution_record.readiness_status, "not_ready");
    assert.equal(output.execution_record.blocking_finding_count > 0, true);
  });

  it("returns not_ready for invalid evidence hashes", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    evidenceIdentity.entries[0] = {
      ...evidenceIdentity.entries[0]!,
      evidence_hash: createEvidenceHash("tampered paragraph"),
    };

    const output = await execute(evidenceIdentity);

    assert.equal(output.builder_result.content.readiness_status, "not_ready");
    assert.equal(output.builder_result.content.metrics.invalid_hash_count, 1);
    assert.ok(output.builder_result.content.findings.some(
      ({ code }) => code === "invalid_evidence_hash",
    ));
  });

  it("returns not_ready when required section coverage is missing", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    evidenceIdentity.entries = evidenceIdentity.entries
      .filter(({ section_name }) => section_name === "management_discussion");

    const output = await execute(evidenceIdentity);

    assert.equal(output.builder_result.content.readiness_status, "not_ready");
    assert.deepEqual(output.builder_result.content.metrics.section_distribution, {
      management_discussion: 3,
      risk_factors: 0,
    });
    assert.ok(output.builder_result.content.findings.some(
      ({ code }) => code === "missing_section_coverage",
    ));
  });

  it("returns not_ready when deterministic ordering is invalid", async () => {
    const evidenceIdentity = evidenceIdentityContent();
    evidenceIdentity.entries = [
      evidenceIdentity.entries[3]!,
      ...evidenceIdentity.entries.slice(0, 3),
      ...evidenceIdentity.entries.slice(4),
    ];

    const output = await execute(evidenceIdentity);

    assert.equal(output.builder_result.content.readiness_status, "not_ready");
    assert.equal(
      output.builder_result.content.metrics.ordering_issue_count > 0,
      true,
    );
    assert.ok(output.builder_result.content.findings.some(
      ({ code }) => code === "invalid_evidence_ordering",
    ));
  });

  it("rejects a missing Evidence Identity dependency", async () => {
    await assert.rejects(
      () => builder().executeWithRecord(context(
        evidenceIdentityContent(),
        undefined,
        false,
      )),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("requires the Evidence Identity Artifact"),
    );
  });

  it("rejects an Evidence Identity dependency mismatch", async () => {
    const evidenceIdentity = evidenceIdentityContent();

    await assert.rejects(
      () => builder().executeWithRecord(context(
        evidenceIdentity,
        {
          ...evidenceIdentityArtifact(evidenceIdentity),
          identity: {
            ...evidenceIdentityArtifact(evidenceIdentity).identity,
            period_id: "2026-Q1",
          },
        },
      )),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("does not reconcile"),
    );
  });
});

async function execute(evidenceIdentity: EvidenceIdentityContent) {
  return builder().executeWithRecord(context(evidenceIdentity));
}

function builder(): ThemesQualityBuilder {
  return new ThemesQualityBuilder({
    logger: {
      info() {},
      error() {},
    },
    now: () => "2026-06-22T00:00:00.000Z",
    durationMs: () => 7,
  });
}

function context(
  evidenceIdentity: EvidenceIdentityContent,
  evidenceIdentityArtifactInput:
    | Artifact<EvidenceIdentityContent>
    | undefined = evidenceIdentityArtifact(evidenceIdentity),
  includeDependency = true,
): BuilderContext<ThemesQualityBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:themes-quality",
    input: {
      evidence_identity: evidenceIdentity,
    },
    dependencies: includeDependency && evidenceIdentityArtifactInput
      ? { evidence_identity: evidenceIdentityArtifactInput }
      : {},
    recordPromptReference() {},
    recordModelReference() {},
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

function evidenceIdentityArtifact(
  content: EvidenceIdentityContent,
): Artifact<EvidenceIdentityContent> {
  return {
    identity: {
      artifact_id: "evidence-identity-msft-2026-q2",
      artifact_type: "evidence_identity",
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "evidence-identity-v1",
      pipeline_version: "evidence-identity-pipeline-v1",
      generated_at: "2026-06-22T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "evidence-identity-input",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "evidence-identity-builder",
      },
    },
    content,
  };
}
