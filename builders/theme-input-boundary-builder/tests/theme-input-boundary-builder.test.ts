import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  EvidenceIdentityContent,
} from "../../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import type {
  ThemeGroundingContent,
} from "../../../contracts/execution/theme-grounding-content.js";
import { BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type {
  BuilderContext,
} from "../../../packages/builder-framework/src/builder-context.js";
import { stableHash } from "../../../src/shared/hashing/stable-hash.js";
import {
  buildEvidenceIdentityEntries,
} from "../../evidence-identity-builder/evidence-builder.js";
import {
  assembleThemeGroundingContent,
  createReadinessResultId,
} from "../../theme-grounding-builder/grounding-assembler.js";
import {
  evaluateThemesExecutionReadiness,
} from "../../themes-quality-builder/readiness-evaluator.js";
import { ThemeInputBoundaryBuilder } from "../builder.js";
import {
  THEME_INPUT_BOUNDARY_BUILDER_TYPE,
  THEME_INPUT_BOUNDARY_VERSION,
} from "../contract.js";
import {
  createGroundingResultId,
} from "../input-assembler.js";
import type { ThemeInputBoundaryBuilderInput } from "../types.js";

describe("theme input boundary builder", () => {
  it("constructs the canonical Theme Input package from grounding", async () => {
    const grounding = groundingContent();
    const result = await execute(grounding);

    assert.equal(result.content.grounding_result_id, createGroundingResultId(grounding));
    assert.equal(result.content.filing_id, grounding.filing_id);
    assert.equal(result.content.filing_hash, grounding.filing_hash);
    assert.equal(result.content.input_version, THEME_INPUT_BOUNDARY_VERSION);
    assert.deepEqual(
      result.content.visible_evidence,
      grounding.ordered_evidence.map((entry) => ({
        evidence_ref: entry.evidence_ref,
        section_name: entry.section_name,
        paragraph_index: entry.paragraph_index,
        paragraph_text: entry.paragraph_text,
      })),
    );
    assert.deepEqual(
      result.content.visible_section_hierarchy,
      grounding.section_hierarchy,
    );
    assert.deepEqual(result.content.permitted_metadata, {
      source_grounding_result_id: createGroundingResultId(grounding),
      visible_evidence_count: grounding.ordered_evidence.length,
      visible_section_names: grounding.section_hierarchy
        .map(({ section_name }) => section_name),
    });
  });

  it("filters hidden grounding fields from visible evidence", async () => {
    const result = await execute(groundingContent());

    assert.equal(result.content.visible_evidence.length > 0, true);
    for (const entry of result.content.visible_evidence) {
      assert.equal("evidence_hash" in entry, false);
    }
    assert.equal("grounding_metadata" in result.content, false);
    assert.equal("grounding_scope" in result.content, false);
    assert.equal("ordered_evidence" in result.content, false);
  });

  it("preserves visible evidence ordering and does not mutate grounding", async () => {
    const grounding = groundingContent();
    const before = structuredClone(grounding);
    const result = await execute(grounding);

    assert.deepEqual(grounding, before);
    assert.deepEqual(
      result.content.visible_evidence.map(({ evidence_ref }) => evidence_ref),
      grounding.ordered_evidence.map(({ evidence_ref }) => evidence_ref),
    );
    assert.notEqual(result.content.visible_evidence, grounding.ordered_evidence);
  });

  it("returns only a transient BuilderResult", async () => {
    const result = await execute(groundingContent());

    assert.equal("execution_record" in result, false);
    assert.equal("identity" in result.content, false);
    assert.equal("metadata" in result.content, false);
    assert.equal("lineage" in result.content, false);
  });

  it("is replayable for identical Theme Grounding input", async () => {
    const grounding = groundingContent();
    const first = await execute(grounding);
    const second = await execute(structuredClone(grounding));

    assert.deepEqual(first, second);
  });

  it("rejects grounding without evidence", async () => {
    const grounding: ThemeGroundingContent = {
      ...groundingContent(),
      grounding_scope: {
        evidence_entry_count: 0,
        section_names: [],
      },
      ordered_evidence: [],
      section_hierarchy: [],
    };

    await assert.rejects(
      () => execute(grounding),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("requires grounding evidence"),
    );
  });

  it("rejects grounding scope mismatches", async () => {
    const grounding: ThemeGroundingContent = {
      ...groundingContent(),
      grounding_scope: {
        ...groundingContent().grounding_scope,
        evidence_entry_count: 999,
      },
    };

    await assert.rejects(
      () => execute(grounding),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("evidence_entry_count does not reconcile"),
    );
  });

  it("rejects section hierarchy that references hidden evidence", async () => {
    const grounding: ThemeGroundingContent = {
      ...groundingContent(),
      section_hierarchy: [{
        section_name: "management_discussion",
        evidence_refs: ["evidence:hidden"],
      }],
    };

    await assert.rejects(
      () => execute(grounding),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("unsupported evidence_ref"),
    );
  });

  it("consumes only Theme Grounding input", () => {
    const input = context(groundingContent()).input;

    assert.deepEqual(Object.keys(input), ["theme_grounding"]);
  });
});

async function execute(grounding: ThemeGroundingContent) {
  return new ThemeInputBoundaryBuilder().execute(context(grounding));
}

function context(
  grounding: ThemeGroundingContent,
): BuilderContext<ThemeInputBoundaryBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:theme-input-boundary",
    input: {
      theme_grounding: grounding,
    },
    dependencies: {},
    recordPromptReference() {},
    recordModelReference() {},
  };
}

function groundingContent(): ThemeGroundingContent {
  return assembleThemeGroundingContent(
    evaluateThemesExecutionReadiness({
      evidenceIdentityArtifactId: "evidence-identity-msft-2026-q2",
      evidenceIdentity: evidenceIdentityContent(),
    }),
  );
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

assert.equal(
  new ThemeInputBoundaryBuilder().builderType(),
  THEME_INPUT_BOUNDARY_BUILDER_TYPE,
);
assert.equal(
  groundingContent().readiness_result_id,
  createReadinessResultId(evaluateThemesExecutionReadiness({
    evidenceIdentityArtifactId: "evidence-identity-msft-2026-q2",
    evidenceIdentity: evidenceIdentityContent(),
  })),
);
