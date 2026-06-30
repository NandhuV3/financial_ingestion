import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type {
  EvidenceIdentityContent,
} from "../../../contracts/artifacts/evidence-identity-artifact-content.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../../packages/llm-framework/src/llm-client.js";
import type {
  RenderedPrompt,
  ResolvedPrompt,
} from "../../../src/prompt-registry/prompt.types.js";
import type {
  ThemesPromptRenderContext,
} from "../../../src/prompt-registry/themes-prompt.js";
import type {
  FilingArtifactBuilderInput,
} from "../../filing-artifact-builder/types.js";
import type { ThemesArtifactContent } from "../../themes/contract.js";
import { THEMES_PROMPT_ID } from "../../themes/prompt.js";
import {
  createArtifactDumpObserver,
  resetArtifactDumps,
} from "../artifact-dump.js";
import { registerUpstreamBuilders } from "../register-builders.js";
import { runUpstreamPipeline } from "../run-upstream-pipeline.js";

describe("upstream pipeline", () => {
  it("removes stale Sprint 001 demo artifacts before a new execution", async (context) => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "upstream-dumps-"));
    context.after(async () => rm(outputDirectory, { recursive: true, force: true }));
    const artifactDumps = createArtifactDumpObserver(outputDirectory);
    const staleFiling = filingArtifact();

    await artifactDumps.observer("filing", staleFiling);
    await artifactDumps.observer("evidence_identity", staleFiling);
    await artifactDumps.observer("themes", staleFiling);
    await resetArtifactDumps(outputDirectory);

    for (const filename of [
      "00-filing.json",
      "01-evidence-identity.json",
      "02-themes.json",
    ]) {
      await assert.rejects(
        () => readFile(join(outputDirectory, filename), "utf8"),
        { code: "ENOENT" },
      );
    }
  });

  it("executes Sprint 001 through Themes and stops before downstream builders", async (context) => {
    const repository = new InMemoryArtifactRepository();
    const llmClient = new UpstreamLLMClient();
    const promptResolver = new UpstreamPromptResolver();
    const outputDirectory = await mkdtemp(join(tmpdir(), "upstream-pipeline-"));
    context.after(async () => rm(outputDirectory, { recursive: true, force: true }));
    const artifactDumps = createArtifactDumpObserver(outputDirectory);
    const artifactStages: string[] = [];
    const transientStages: string[] = [];
    const runtime = registerUpstreamBuilders({
      repository,
      promptResolver,
      llmClient,
      semanticEmbeddingProvider: llmClient,
      themesModelVersion: "themes-demo-model-v1",
      structuredIntelligenceModelVersion: "structured-demo-model-v1",
    });

    const themes = await runUpstreamPipeline({
      runtime,
      normalizedFiling: normalizedFilingInput(),
      generatedAt: "2026-06-19T00:00:00.000Z",
      onArtifact: async (stage, artifact) => {
        artifactStages.push(stage);
        await artifactDumps.observer(stage, artifact);
      },
      onTransientOutput(stage) {
        transientStages.push(stage);
      },
    });

    assert.deepEqual(artifactStages, [
      "filing",
      "evidence_identity",
      "themes",
    ]);
    assert.deepEqual(transientStages, [
      "themes_quality",
      "theme_grounding",
      "theme_input_boundary",
    ]);

    const filing = await repository.getCurrent<FilingArtifactContent>({
      artifact_type: "filing",
      company_id: "MSFT",
      period_id: "2026-Q2",
    });
    const evidenceIdentity =
      await repository.getCurrent<EvidenceIdentityContent>({
        artifact_type: "evidence_identity",
        company_id: "MSFT",
        period_id: "2026-Q2",
      });
    const persistedThemes = await repository.getCurrent<ThemesArtifactContent>({
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
    });

    assert.equal(themes.identity.artifact_type, "themes");
    assert.equal(themes.content.company_id, "MSFT");
    assert.equal(themes.content.period_id, "2026-Q2");
    assert.equal(themes.content.filing_id, "msft-2026-q2-10q");
    assert.equal(themes.content.themes.length, 1);
    const expectedEvidenceRef = evidenceIdentity?.content.entries[1]?.evidence_ref;
    assert.ok(expectedEvidenceRef);
    assert.deepEqual(themes.content.themes[0]?.evidence, [{
      evidence_ref: expectedEvidenceRef,
    }]);
    assert.deepEqual(themes.lineage.upstream_dependencies, [
      {
        artifact_id: evidenceIdentity?.identity.artifact_id,
        artifact_type: "evidence_identity",
        version: evidenceIdentity?.identity.version,
        artifact_hash: evidenceIdentity?.metadata.artifact_hash,
        input_hash: evidenceIdentity?.metadata.input_hash,
      },
    ]);
    assert.equal(themes.lineage.prompt_reference?.prompt_id, THEMES_PROMPT_ID);
    assert.equal(themes.lineage.prompt_reference?.activation_id, null);
    assert.equal(themes.lineage.model_reference?.model_version, "themes-demo-model-v1");

    assert.notEqual(filing, null);
    assert.notEqual(evidenceIdentity, null);
    assert.notEqual(persistedThemes, null);
    assert.equal((evidenceIdentity?.content.entries.length ?? 0) > 1, true);

    for (const artifactType of [
      "evidence_catalog",
      "topic_assignment",
      "topic_evolution",
      "structured_intelligence",
      "company_knowledge_candidate",
      "governance_decision",
      "company_knowledge",
      "business_signals",
    ] as const) {
      assert.equal(
        await repository.getCurrent({
          artifact_type: artifactType,
          company_id: "MSFT",
          period_id: "2026-Q2",
        }),
        null,
        `${artifactType} should not be persisted by Sprint 001 orchestration`,
      );
    }

    assert.equal(llmClient.requests.length, 1);
    assert.equal(llmClient.requests[0]?.temperature, 0);
    assert.equal(llmClient.requests[0]?.messages[0]?.content, THEMES_PROMPT_ID);
    assert.equal(promptResolver.renderCalls.length, 1);
    assert.equal(promptResolver.renderCalls[0]?.promptId, THEMES_PROMPT_ID);
    assert.equal(promptResolver.renderCalls[0]?.context.evidence.length, 5);

    const expectedDumps = [
      ["00-filing.json", "filing"],
      ["01-evidence-identity.json", "evidence_identity"],
      ["02-themes.json", "themes"],
    ] as const;

    for (const [filename, artifactType] of expectedDumps) {
      const dumped = JSON.parse(
        await readFile(join(outputDirectory, filename), "utf8"),
      ) as Artifact<unknown>;
      assert.equal(dumped.identity.artifact_type, artifactType);
      assert.equal(dumped.identity.company_id, "MSFT");
      assert.equal(dumped.identity.period_id, "2026-Q2");
    }

    for (const filename of [
      "03-topic-assignment.json",
      "04-topic-evolution.json",
      "05-structured-intelligence.json",
      "06-company-knowledge-candidate.json",
      "07-governance-decision.json",
      "08-company-knowledge.json",
      "09-business-signals.json",
    ]) {
      await assert.rejects(
        () => readFile(join(outputDirectory, filename), "utf8"),
        { code: "ENOENT" },
      );
    }
  });
});

function normalizedFilingInput(): FilingArtifactBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_period: "2026-Q2",
    accession_number: "0000789019-26-000001",
    management_discussion: [
      "ITEM 2. MANAGEMENT'S DISCUSSION AND ANALYSIS",
      "Microsoft discussed Azure demand and enterprise customer adoption.",
      "The integrated enterprise platform depends on data center capacity.",
    ].join("\n\n"),
    risk_factors: [
      "ITEM 1A. RISK FACTORS",
      "Competition and infrastructure constraints may affect cloud execution.",
    ].join("\n\n"),
    raw_html_hash: "raw-html-hash",
  };
}

function filingArtifact(): Artifact<FilingArtifactContent> {
  const content: FilingArtifactContent = {
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content: "stale filing content",
    filing_hash: "stale-filing-hash",
    filing_period: "2026-Q2",
  };

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
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "filing-input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "filing-ingestion",
      },
    },
    content,
  };
}

class UpstreamPromptResolver {
  readonly renderCalls: Array<{
    promptId: string;
    context: ThemesPromptRenderContext;
    version?: string;
  }> = [];

  resolve(promptId: string): ResolvedPrompt {
    return {
      promptId,
      version: `${promptId}-v1`,
      content: promptId,
      hash: calculateArtifactHash(promptId),
      source: "filesystem",
      activationId: null,
    };
  }

  render<TContext>(
    promptId: string,
    context: TContext,
    version?: string,
  ): RenderedPrompt {
    const themeContext = context as ThemesPromptRenderContext;
    this.renderCalls.push({ promptId, context: themeContext, version });

    return {
      prompt_id: promptId,
      prompt_version: `${promptId}-v1`,
      activation_id: null,
      system_prompt: promptId,
      user_prompt: JSON.stringify(themeContext),
      render_hash: calculateArtifactHash(themeContext),
      source: "filesystem",
    };
  }
}

class UpstreamLLMClient implements LLMClient {
  readonly requests: LLMRequest[] = [];

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    this.requests.push(request);
    const systemPrompt = request.messages.find(({ role }) =>
      role === "system")?.content;

    if (systemPrompt === THEMES_PROMPT_ID) {
      return {
        output_text: JSON.stringify({
          themes: [
            {
              title: "Cloud platform demand",
              summary: "Management discussed Azure demand and enterprise adoption.",
              category: "technology",
              paragraph_indexes: [2],
            },
          ],
        }),
      };
    }

    throw new Error(`Unexpected prompt: ${systemPrompt ?? "missing"}`);
  }

  async embed(input: {
    model: string;
    texts: string[];
  }): Promise<number[][]> {
    assert.equal(input.model, "text-embedding-3-small");

    return input.texts.map(() => [1, 0]);
  }
}

class InMemoryArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    this.artifacts.set(artifact.identity.artifact_id, clone(artifact));
    this.current.set(key(artifact.identity), artifact.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact === undefined ? null : clone(artifact) as Artifact<T>;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(key(lookup));

    return artifactId === undefined ? null : this.getById<T>(artifactId);
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .map((artifact) => clone(artifact) as Artifact<T>);
  }
}

function key(lookup: {
  artifact_type: ArtifactType;
  company_id: string | null;
  period_id: string | null;
}): string {
  return [
    lookup.artifact_type,
    lookup.company_id ?? "",
    lookup.period_id ?? "",
  ].join(":");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
