import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  EvidenceIdentityContent,
} from "../../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import type {
  ThemesExecutionReadinessContent,
} from "../../../contracts/execution/themes-execution-readiness-content.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type {
  BuilderContext,
} from "../../../packages/builder-framework/src/builder-context.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import {
  buildEvidenceIdentityEntries,
} from "../../evidence-identity-builder/evidence-builder.js";
import {
  evaluateThemesExecutionReadiness,
} from "../../themes-quality-builder/readiness-evaluator.js";
import { ThemeGroundingBuilder } from "../builder.js";
import {
  THEME_GROUNDING_BUILDER_TYPE,
  THEME_GROUNDING_VERSION,
} from "../contract.js";
import {
  createReadinessResultId,
} from "../grounding-assembler.js";
import type { ThemeGroundingBuilderInput } from "../types.js";

describe("theme grounding builder", () => {
  it("constructs a deterministic grounding package from readiness output", async () => {
    const readiness = readinessContent();
    const result = await execute(readiness);

    assert.equal(result.content.readiness_result_id, createReadinessResultId(readiness));
    assert.equal(result.content.filing_id, readiness.filing_id);
    assert.equal(result.content.filing_hash, readiness.filing_hash);
    assert.equal(result.content.grounding_version, THEME_GROUNDING_VERSION);
    assert.deepEqual(result.content.grounding_scope, {
      evidence_entry_count: readiness.validated_evidence.length,
      section_names: readiness.validated_section_hierarchy
        .map(({ section_name }) => section_name),
    });
    assert.deepEqual(
      result.content.ordered_evidence,
      readiness.validated_evidence.map((entry) => ({
        evidence_ref: entry.evidence_ref,
        evidence_hash: entry.evidence_hash,
        section_name: entry.section_name,
        paragraph_index: entry.paragraph_index,
        paragraph_text: entry.paragraph_text,
      })),
    );
    assert.deepEqual(
      result.content.section_hierarchy,
      readiness.validated_section_hierarchy,
    );
    assert.deepEqual(result.content.grounding_metadata, {
      source_readiness_result_id: createReadinessResultId(readiness),
      source_evidence_identity_artifact_id:
        readiness.evidence_identity_artifact_id,
      generated_from_readiness_status: "ready",
    });
  });

  it("preserves validated evidence order and content without mutation", async () => {
    const readiness = readinessContent();
    const before = structuredClone(readiness);
    const result = await execute(readiness);

    assert.deepEqual(readiness, before);
    assert.deepEqual(
      result.content.ordered_evidence.map(({ evidence_ref }) => evidence_ref),
      readiness.validated_evidence.map(({ evidence_ref }) => evidence_ref),
    );
    assert.notEqual(
      result.content.ordered_evidence,
      readiness.validated_evidence,
    );
  });

  it("returns only a transient BuilderResult", async () => {
    const result = await execute(readinessContent());

    assert.equal("execution_record" in result, false);
    assert.equal("identity" in result.content, false);
    assert.equal("metadata" in result.content, false);
    assert.equal("lineage" in result.content, false);
  });

  it("is replayable for identical readiness input", async () => {
    const readiness = readinessContent();
    const first = await execute(readiness);
    const second = await execute(structuredClone(readiness));

    assert.deepEqual(first, second);
  });

  it("rejects not_ready readiness output", async () => {
    const readiness: ThemesExecutionReadinessContent = {
      ...readinessContent(),
      readiness_status: "not_ready",
      validated_evidence: [],
      validated_section_hierarchy: [],
      findings: [{
        finding_id: "themes-quality-v1:0001",
        severity: "blocking",
        code: "empty_evidence_catalog",
        message: "Evidence Identity contains no evidence entries.",
      }],
    };

    await assert.rejects(
      () => execute(readiness),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("requires a ready"),
    );
  });

  it("rejects readiness input without validated evidence", async () => {
    const readiness: ThemesExecutionReadinessContent = {
      ...readinessContent(),
      validated_evidence: [],
      validated_section_hierarchy: [],
    };

    await assert.rejects(
      () => execute(readiness),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("requires validated evidence"),
    );
  });

  it("rejects section hierarchy that does not reconcile with validated evidence", async () => {
    const readiness: ThemesExecutionReadinessContent = {
      ...readinessContent(),
      validated_section_hierarchy: [{
        section_name: "management_discussion",
        evidence_refs: [readinessContent().validated_evidence[0]!.evidence_ref],
      }],
    };

    await assert.rejects(
      () => execute(readiness),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("section hierarchy does not reconcile"),
    );
  });

  it("does not consume Evidence Identity, Filing Artifact, or downstream inputs", async () => {
    const input = context(readinessContent()).input;

    assert.deepEqual(Object.keys(input), ["themes_execution_readiness"]);
  });
});

async function execute(readiness: ThemesExecutionReadinessContent) {
  return new ThemeGroundingBuilder().execute(context(readiness));
}

function context(
  readiness: ThemesExecutionReadinessContent,
): BuilderContext<ThemeGroundingBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:theme-grounding",
    input: {
      themes_execution_readiness: readiness,
    },
    dependencies: {},
    recordPromptReference() {},
    recordModelReference() {},
  };
}

function readinessContent(): ThemesExecutionReadinessContent {
  return evaluateThemesExecutionReadiness({
    evidenceIdentityArtifactId: "evidence-identity-msft-2026-q2",
    evidenceIdentity: evidenceIdentityContent(),
  });
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

assert.equal(new ThemeGroundingBuilder().builderType(), THEME_GROUNDING_BUILDER_TYPE);
