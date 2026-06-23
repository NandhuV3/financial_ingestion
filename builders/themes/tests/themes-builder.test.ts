import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type {
  EvidenceCatalogArtifactContent,
} from "../../../contracts/artifacts/evidence-catalog-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import { ArtifactService, calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutionError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../../packages/llm-framework/src/llm-client.js";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import { buildEvidenceCatalogEntries } from "../../evidence-catalog-builder/catalog-builder.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { ThemesBuilder } from "../builder.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_BUILDER_VERSION,
  THEMES_PIPELINE_VERSION,
  THEMES_SCHEMA_VERSION,
  type ThemesArtifactContent,
} from "../contract.js";
import { buildThemesUserPrompt } from "../prompt.js";
import type { ThemesBuilderInput } from "../types.js";

describe("themes builder", () => {
  it("consumes canonical evidence from the Evidence Catalog", async () => {
    const llm = new StaticLLMClient(validLLMOutput());
    const artifact = await execute(llm);
    const expected = evidenceCatalogArtifact().content.entries[1]!;

    assert.deepEqual(artifact.content.themes[0]?.evidence, [{
      evidence_ref: expected.evidence_ref,
      evidence_hash: expected.evidence_hash,
      section_name: expected.section_name,
      paragraph_index: expected.paragraph_index,
    }]);
    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map(({ artifact_type }) =>
        artifact_type),
      ["evidence_catalog"],
    );
    assert.equal(llm.requests[0]?.temperature, 0);
    assert.deepEqual(artifact.content.evaluation_hooks.theme_quality, {
      theme_count: 2,
      evidence_utilization: 0.4,
      unique_evidence_refs: 2,
      evidence_concentration: 0.5,
      duplicate_count: 0,
      overlap_count: 0,
      category_distribution: {
        strategy: 0,
        product: 0,
        customer: 0,
        competition: 1,
        operations: 0,
        financial: 0,
        capital_allocation: 0,
        management: 0,
        trust: 0,
        regulatory: 0,
        technology: 1,
        other: 0,
      },
      section_coverage: 1,
      section_distribution: {
        management_discussion: 1,
        risk_factors: 1,
      },
      theme_density: 0.4,
    });
  });

  it("requires the Evidence Catalog dependency", async () => {
    await assert.rejects(
      () => execute(
        new StaticLLMClient(validLLMOutput()),
        { evidenceCatalog: undefined },
      ),
      BuilderValidationError,
    );
  });

  it("rejects paragraph indexes absent from the prompt evidence", async () => {
    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        themes: [{
          title: "AI Adoption",
          summary: "Management discussed AI adoption.",
          category: "technology",
          paragraph_indexes: [999],
        }],
      }))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes(
          "not present in the supplied filing paragraphs",
        ),
    );
  });

  it("rejects duplicate paragraph indexes", async () => {
    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        themes: [{
          title: "AI Adoption",
          summary: "Management discussed AI adoption.",
          category: "technology",
          paragraph_indexes: [2, 2],
        }],
      }))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("must contain unique values"),
    );
  });

  it("rejects legacy evidence identity output", async () => {
    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        themes: [{
          title: "AI Adoption",
          summary: "Management discussed AI adoption.",
          category: "technology",
          evidence: [{ evidence_ref: "evidence:legacy" }],
        }],
      }))),
      BuilderValidationError,
    );
  });

  it("instructs the LLM to select prompt-local paragraph indexes", () => {
    const catalog = evidenceCatalogArtifact().content;
    const prompt = buildThemesUserPrompt(
      input().filing_type,
      promptEvidence(catalog),
    );

    assert.match(prompt, /"paragraph_index": 1/);
    assert.match(prompt, /Use only paragraph_index values present/);
    assert.match(prompt, /paragraph_indexes must contain positive integers/);
    assert.match(prompt, /paragraph_indexes must be unique/);
    assert.doesNotMatch(prompt, /evidence_ref/);
    assert.doesNotMatch(prompt, /evidence_hash/);
    assert.doesNotMatch(prompt, /filing_id/);
    assert.doesNotMatch(prompt, /chunk ids?/i);
    assert.doesNotMatch(prompt, /filing chunks?/i);
  });

  it("builds the prompt exclusively from Evidence Catalog content", () => {
    const catalog = evidenceCatalogArtifact().content;
    const filing = filingContent();
    const prompt = buildThemesUserPrompt(
      input().filing_type,
      promptEvidence(catalog),
    );

    assert.match(prompt, /Filing paragraphs:/);
    assert.match(prompt, new RegExp(catalog.entries[1]!.paragraph_text));
    assert.doesNotMatch(prompt, /Filing content:/);
    assert.doesNotMatch(prompt, new RegExp(filing.filing_content));
  });

  it("defines Themes as useful aggregated business narratives", () => {
    const prompt = buildThemesUserPrompt(
      input().filing_type,
      promptEvidence(evidenceCatalogArtifact().content),
    );

    assert.match(prompt, /filing-supported business narrative/);
    assert.match(prompt, /what does the company actually sell/i);
    assert.match(prompt, /where does future business performance come from/i);
    assert.match(prompt, /Do not answer them directly/);
    assert.match(prompt, /Multiple Evidence Catalog entries may support the same Theme/);
    assert.match(prompt, /many relevant evidence entries supporting one coherent narrative/);
    assert.match(prompt, /Use neutral, descriptive language/);
    assert.match(prompt, /future potential/);
    assert.match(prompt, /Keep positive and negative segment developments separate/);
    assert.match(prompt, /different segment narratives/);
    assert.match(prompt, /Ownership Alignment/);
    assert.match(prompt, /What does the company actually sell/);
    assert.match(prompt, /Theme Types/);
    assert.match(prompt, /Company Understanding Theme/);
    assert.match(prompt, /Period Development Theme/);
    assert.match(prompt, /Narrative Independence/);
    assert.match(prompt, /Theme Quality Filter/);
    assert.match(prompt, /Is this a business narrative/);
  });

  it("suppresses boilerplate and generic topic extraction", () => {
    const prompt = buildThemesUserPrompt(
      input().filing_type,
      promptEvidence(evidenceCatalogArtifact().content),
    );

    assert.match(prompt, /Do not emit section headings/);
    assert.match(prompt, /Do not emit forward-looking-statements disclosures/);
    assert.match(prompt, /Do not emit MD&A introductions/);
    assert.match(prompt, /Do not emit generic legal disclaimers/);
    assert.match(prompt, /Management Discussion Overview/);
    assert.match(prompt, /Competition Risk/);
  });

  it("executes without filing content in the builder input", async () => {
    const llm = new StaticLLMClient(validLLMOutput());

    await execute(llm);

    assert.deepEqual(input(), { filing_type: "10-Q" });
    assert.doesNotMatch(
      llm.requests[0]?.messages[1]?.content ?? "",
      /Filing content:/,
    );
  });

  it("rejects a direct Filing Artifact dependency", async () => {
    await assert.rejects(
      () => execute(
        new StaticLLMClient(validLLMOutput()),
        { filing: filingArtifact() },
      ),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes(
          "must not consume a direct Filing Artifact dependency",
        ),
    );
  });

  it("rejects invalid dependency identity", async () => {
    const catalog = evidenceCatalogArtifact();
    catalog.identity.company_id = "AAPL";

    await assert.rejects(
      () => execute(
        new StaticLLMClient(validLLMOutput()),
        { evidenceCatalog: catalog },
      ),
      BuilderValidationError,
    );
  });

  it("is deterministic for identical catalog and model output", async () => {
    const first = await execute(new StaticLLMClient(validLLMOutput()));
    const second = await execute(new StaticLLMClient(validLLMOutput()));

    assert.deepEqual(first.content, second.content);
    assert.equal(first.metadata.artifact_hash, second.metadata.artifact_hash);
  });

  it("wraps LLM invocation failures in typed execution errors", async () => {
    await assert.rejects(
      () => execute(new FailingLLMClient()),
      BuilderExecutionError,
    );
  });
});

async function execute(
  llmClient: LLMClient,
  overrides: {
    filing?: Artifact<FilingArtifactContent>;
    evidenceCatalog?: Artifact<EvidenceCatalogArtifactContent> | undefined;
  } = {},
): Promise<Artifact<ThemesArtifactContent>> {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: THEMES_BUILDER_TYPE,
    artifact_type: "themes",
    version: THEMES_BUILDER_VERSION,
    schema_version: THEMES_SCHEMA_VERSION,
    pipeline_version: THEMES_PIPELINE_VERSION,
  }, () => new ThemesBuilder({
    promptResolver: new StaticPromptResolver(),
    llmClient,
    modelVersion: "themes-model-v1",
  }));

  const evidenceCatalog = Object.hasOwn(overrides, "evidenceCatalog")
    ? overrides.evidenceCatalog
    : evidenceCatalogArtifact();

  return new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  ).executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
    builderType: THEMES_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:themes",
    input: input(),
    inputHash: "themes-input-hash",
    dependencies: {
      ...(overrides.filing ? { filing: overrides.filing } : {}),
      ...(evidenceCatalog ? { evidence_catalog: evidenceCatalog } : {}),
    },
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function input(): ThemesBuilderInput {
  return {
    filing_type: "10-Q",
  };
}

function validLLMOutput(): string {
  return JSON.stringify({
    themes: [
      {
        title: "AI Adoption",
        summary: "Management discussed AI adoption.",
        category: "technology",
        paragraph_indexes: [2],
      },
      {
        title: "Competition",
        summary: "Competition remained intense.",
        category: "competition",
        paragraph_indexes: [5],
      },
    ],
  });
}

function filingContent(): FilingArtifactContent {
  const filing_content = [
    "ITEM 2. MANAGEMENT'S DISCUSSION AND ANALYSIS",
    "Management discussed AI adoption.",
    "Cloud expansion continued.",
    "ITEM 1A. RISK FACTORS",
    "Competition remained intense.",
  ].join("\n\n");

  return {
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content,
    filing_hash: calculateArtifactHash(filing_content),
    filing_period: "2026-Q2",
  };
}

function filingArtifact(): Artifact<FilingArtifactContent> {
  return artifact(
    "filing-artifact-1",
    "filing",
    filingContent(),
  );
}

function evidenceCatalogArtifact(): Artifact<EvidenceCatalogArtifactContent> {
  const filing = filingContent();

  return artifact(
    "evidence-catalog-artifact-1",
    "evidence_catalog",
    {
      artifact_type: "evidence_catalog",
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: filing.filing_id,
      filing_hash: filing.filing_hash,
      entries: buildEvidenceCatalogEntries(filing),
    },
  );
}

function artifact<T>(
  artifactId: string,
  artifactType: "filing" | "evidence_catalog",
  content: T,
): Artifact<T> {
  return {
    identity: {
      artifact_id: artifactId,
      artifact_type: artifactType,
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${artifactType}-v1`,
      pipeline_version: `${artifactType}-pipeline-v1`,
      generated_at: "2026-06-22T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: `${artifactType}-input-hash`,
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: { builder_type: artifactType },
    },
    content,
  };
}

class StaticPromptResolver {
  resolve(): ResolvedPrompt {
    return {
      promptId: "theme-generation-system",
      version: "theme-generation-v5",
      content: "Extract observed themes only.",
      hash: "prompt-hash",
      source: "filesystem",
      activationId: "activation-1",
    };
  }
}

function promptEvidence(
  catalog: EvidenceCatalogArtifactContent,
): Array<{
  paragraph_index: number;
  section_name: string;
  paragraph_text: string;
}> {
  return catalog.entries.map((entry, index) => ({
    paragraph_index: index + 1,
    section_name: entry.section_name,
    paragraph_text: entry.paragraph_text,
  }));
}

class StaticLLMClient implements LLMClient {
  readonly requests: LLMRequest[] = [];

  constructor(private readonly outputText: string) {}

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    this.requests.push(request);

    return {
      output_text: this.outputText,
      token_usage: 100,
    };
  }
}

class FailingLLMClient implements LLMClient {
  async callLLM(): Promise<LLMResponse> {
    throw new Error("LLM unavailable");
  }
}
