import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderExecutionError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import type { LLMClient, LLMRequest, LLMResponse } from "../../../packages/llm-framework/src/llm-client.js";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_BUILDER_VERSION,
  THEMES_PIPELINE_VERSION,
  THEMES_SCHEMA_VERSION,
  type ThemesArtifactContent,
} from "../contract.js";
import { ThemesBuilder } from "../builder.js";
import { buildFilingEvidenceCatalog } from "../evidence.js";
import { buildThemesUserPrompt } from "../prompt.js";
import type { ThemesBuilderInput } from "../types.js";

describe("themes builder", () => {
  it("generates and persists a Themes artifact through the Builder Framework", async () => {
    const repository = new TestArtifactRepository();
    const registry = new BuilderRegistry();
    const llm = new StaticLLMClient(validLLMOutput());
    const filing = filingArtifact();

    registry.registerBuilder({
      builder_type: THEMES_BUILDER_TYPE,
      artifact_type: "themes",
      version: THEMES_BUILDER_VERSION,
      schema_version: THEMES_SCHEMA_VERSION,
      pipeline_version: THEMES_PIPELINE_VERSION,
    }, () => new ThemesBuilder({
      promptResolver: new StaticPromptResolver(),
      llmClient: llm,
      modelVersion: "themes-model-v1",
    }));

    const executor = new BuilderExecutor(registry, new ArtifactService(repository));
    const artifact = await executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
      builderType: THEMES_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "filing-input-hash",
      dependencies: {
        filing,
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(artifact.identity.artifact_type, "themes");
    assert.equal(artifact.identity.company_id, "MSFT");
    assert.equal(artifact.identity.period_id, "2026-Q2");
    assert.equal(artifact.metadata.schema_version, THEMES_SCHEMA_VERSION);
    assert.equal(artifact.metadata.pipeline_version, THEMES_PIPELINE_VERSION);
    assert.equal(artifact.content.themes.length, 2);
    assert.equal(artifact.content.themes[0]?.title, "AI Adoption");
    assert.equal(artifact.content.themes[0]?.theme_id.length, 64);
    assert.deepEqual(artifact.content.themes[0]?.source_evidence, [
      {
        section: "filing_content",
        excerpt_hash: evidenceHash(),
        paragraph_reference: "excerpt-0001",
      },
    ]);
    assert.equal(artifact.content.confidence.overall, 1);
    assert.equal(artifact.content.evaluation_hooks.prompt_version, "theme-generation-v1");
    assert.equal(artifact.lineage.prompt_reference?.prompt_id, "theme-generation-system");
    assert.equal(artifact.lineage.prompt_reference?.prompt_version, "theme-generation-v1");
    assert.equal(artifact.lineage.model_reference?.temperature, 0);
    assert.deepEqual(artifact.lineage.upstream_dependencies, [
      {
        artifact_id: filing.identity.artifact_id,
        artifact_type: "filing",
        version: 1,
        artifact_hash: filing.metadata.artifact_hash,
        input_hash: filing.metadata.input_hash,
      },
    ]);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), artifact);
    assert.equal(llm.requests[0]?.temperature, 0);
    assert.equal(llm.requests[0]?.model, "themes-model-v1");
  });

  it("fails validation for an empty filing before LLM invocation", async () => {
    const builder = new ThemesBuilder({
      promptResolver: new StaticPromptResolver(),
      llmClient: new StaticLLMClient(validLLMOutput()),
    });

    await assert.rejects(
      () => builder.validateInput({
        ...input(),
        filing_content: "",
      }),
      BuilderValidationError,
    );
  });

  it("rejects malformed LLM JSON with a typed validation error", async () => {
    const executor = executorWithBuilder(new StaticLLMClient("{bad json"));

    await assert.rejects(
      () => executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
        builderType: THEMES_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "filing-input-hash",
        dependencies: {
          filing: filingArtifact(),
        },
      }),
      BuilderValidationError,
    );
  });

  it("rejects unsupported themes without evidence", async () => {
    const executor = executorWithBuilder(new StaticLLMClient(JSON.stringify({
      themes: [
        {
          title: "AI Adoption",
          description: "Management discussed AI adoption.",
          category: "technology",
          importance: "high",
          evidence: [],
        },
      ],
    })));

    await assert.rejects(
      () => executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
        builderType: THEMES_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "filing-input-hash",
      }),
      BuilderValidationError,
    );
  });

  it("rejects fabricated evidence hashes returned by the LLM", async () => {
    const executor = executorWithBuilder(new StaticLLMClient(JSON.stringify({
      themes: [
        {
          title: "AI Adoption",
          description: "Management discussed AI adoption.",
          category: "technology",
          importance: "high",
          evidence: [{
            section: "MD&A",
            excerpt_hash: "abc123",
          }],
        },
      ],
    })));

    await assert.rejects(
      () => executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
        builderType: THEMES_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "filing-input-hash",
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("is not present in the filing evidence catalog"),
    );
  });

  it("generates stable evidence hashes from normalized filing excerpts", () => {
    const first = buildFilingEvidenceCatalog(input());
    const second = buildFilingEvidenceCatalog({
      ...input(),
      filing_content: "  Management   discussed AI adoption and cloud expansion.  ",
    });

    assert.deepEqual(first, second);
    assert.match(first[0]?.excerpt_hash ?? "", /^[a-f0-9]{64}$/);
    assert.equal(first[0]?.paragraph_reference, "excerpt-0001");
    assert.equal(first[0]?.section, "filing_content");
  });

  it("instructs the LLM to select evidence from the supplied catalog", () => {
    const catalog = buildFilingEvidenceCatalog(input());
    const prompt = buildThemesUserPrompt(input(), catalog);

    assert.match(prompt, new RegExp(catalog[0]?.excerpt_hash ?? ""));
    assert.match(prompt, /Use only excerpt_hash values supplied in the evidence catalog/);
    assert.match(prompt, /Never create, shorten, transform, or guess an excerpt_hash/);
  });

  it("removes exact normalized duplicate themes without semantic deduplication", async () => {
    const executor = executorWithBuilder(new StaticLLMClient(JSON.stringify({
      themes: [
        {
          title: "AI Adoption",
          description: "Management discussed AI adoption.",
          category: "technology",
          importance: "high",
          evidence: [{ section: "invented", excerpt_hash: evidenceHash() }],
        },
        {
          title: " AI adoption! ",
          description: "Management discussed AI adoption",
          category: "technology",
          importance: "high",
          evidence: [{ section: "different", excerpt_hash: evidenceHash() }],
        },
      ],
    })));

    const artifact = await executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
      builderType: THEMES_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "filing-input-hash",
    });

    assert.equal(artifact.content.themes.length, 1);
    assert.equal(artifact.content.evaluation_hooks.duplicate_count, 1);
    assert.equal(artifact.content.confidence.extraction_consistency, 0);
  });

  it("wraps LLM invocation failures in typed execution errors", async () => {
    const executor = executorWithBuilder(new FailingLLMClient());

    await assert.rejects(
      () => executor.executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
        builderType: THEMES_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "filing-input-hash",
      }),
      BuilderExecutionError,
    );
  });
});

function executorWithBuilder(llmClient: LLMClient): BuilderExecutor {
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

  return new BuilderExecutor(registry, new ArtifactService(new TestArtifactRepository()));
}

function input(): ThemesBuilderInput {
  return {
    company_id: "MSFT",
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content: "Management discussed AI adoption and cloud expansion.",
    filing_hash: "filing-hash",
    period_id: "2026-Q2",
  };
}

function validLLMOutput(): string {
  return JSON.stringify({
    themes: [
      {
        title: "AI Adoption",
        description: "Management discussed AI adoption.",
        category: "technology",
        importance: "high",
        evidence: [{ section: "MD&A", excerpt_hash: evidenceHash() }],
      },
      {
        title: "Cloud Expansion",
        description: "Management discussed cloud expansion.",
        category: "product",
        importance: "medium",
        evidence: [{ section: "MD&A", excerpt_hash: evidenceHash() }],
      },
    ],
  });
}

function evidenceHash(): string {
  const evidence = buildFilingEvidenceCatalog(input())[0];

  assert.ok(evidence);

  return evidence.excerpt_hash;
}

class StaticPromptResolver {
  resolve(): ResolvedPrompt {
    return {
      promptId: "theme-generation-system",
      version: "theme-generation-v1",
      content: "Extract observed themes only.",
      hash: "prompt-hash",
      source: "filesystem",
      activationId: "activation-1",
    };
  }
}

class StaticLLMClient implements LLMClient {
  readonly requests: LLMRequest[] = [];

  constructor(private readonly outputText: string) {}

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    this.requests.push(request);

    return {
      output_text: this.outputText,
      token_usage: 123,
    };
  }
}

class FailingLLMClient implements LLMClient {
  async callLLM(): Promise<LLMResponse> {
    throw new Error("provider unavailable");
  }
}

class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    const stored = cloneArtifact(artifact);

    this.artifacts.set(artifact.identity.artifact_id, stored);
    this.current.set(lookupKey(artifact.identity), artifact.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact ? cloneArtifact(artifact) as Artifact<T> : null;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId ? this.getById<T>(artifactId) : null;
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .sort((left, right) => left.identity.version - right.identity.version)
      .map((artifact) => cloneArtifact(artifact) as Artifact<T>);
  }
}

function filingArtifact(): Artifact<{ filing_id: string }> {
  return {
    identity: {
      artifact_id: "filing-artifact-1",
      artifact_type: "filing",
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "filing-v1",
      pipeline_version: "filing-ingestion-v1",
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: "filing-artifact-hash",
      input_hash: "filing-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "filing-ingestion",
      },
    },
    content: {
      filing_id: "msft-2026-q2-10q",
    },
  };
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifact: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
}
