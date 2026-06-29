import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type {
  ThemeInputBoundaryContent,
} from "../../../contracts/execution/theme-input-boundary-content.js";
import { ArtifactService, calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import { BuilderExecutionError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../../packages/llm-framework/src/llm-client.js";
import type { ThemesPromptRenderContext } from "../../../src/prompt-registry/themes-prompt.js";
import type { RenderedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import { MemoryArtifactRepository } from "../../upstream-pipeline/memory-artifact-repository.js";
import { ThemesBuilder } from "../builder.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_BUILDER_VERSION,
  THEMES_PIPELINE_VERSION,
  THEMES_REASONING_VERSION,
  THEMES_SCHEMA_VERSION,
  type ThemesArtifactContent,
} from "../contract.js";
import type { ThemesBuilderInput } from "../types.js";

describe("themes builder", () => {
  it("consumes Theme Input Boundary content and emits a governed Themes artifact", async () => {
    const llm = new StaticLLMClient(validLLMOutput());
    const promptResolver = new StaticPromptRenderer();
    const artifact = await execute({ llmClient: llm, promptResolver });

    assert.equal(promptResolver.calls.length, 1);
    assert.equal(promptResolver.calls[0]?.promptId, "theme-generation");
    assert.deepEqual(
      promptResolver.calls[0]?.context.evidence.map(({ paragraph_index }) =>
        paragraph_index),
      [1, 2, 3],
    );
    assert.equal(
      promptResolver.calls[0]?.context.evidence[1]?.paragraph_text,
      "Management discussed AI infrastructure expansion.",
    );

    assert.equal(llm.requests[0]?.temperature, 0);
    assert.equal(llm.requests[0]?.messages[0]?.content, "system prompt");
    assert.equal(llm.requests[0]?.messages[1]?.content, "rendered user prompt");

    assert.equal(artifact.content.company_id, "MSFT");
    assert.equal(artifact.content.period_id, "2026-Q2");
    assert.equal(artifact.content.filing_id, "msft-2026-q2-10q");
    assert.equal(artifact.content.prompt_id, "theme-generation");
    assert.equal(artifact.content.prompt_version, "v7");
    assert.equal(artifact.content.reasoning_version, THEMES_REASONING_VERSION);
    assert.equal(artifact.content.render_hash, "render-hash");
    assert.equal(artifact.content.model_name, "themes-model-v1");
    assert.equal(artifact.content.model_version, "themes-model-v1");
    assert.deepEqual(artifact.content.themes[0]?.evidence, [{
      evidence_ref: "evidence:ai",
    }]);
    assert.equal(
      artifact.content.themes[0]?.extraction_confidence,
      1,
    );
    assert.equal(
      artifact.content.themes[0]?.prompt_version,
      "v7",
    );
    assert.deepEqual(artifact.lineage.upstream_dependencies, []);
    assert.deepEqual(artifact.lineage.prompt_reference, {
      prompt_id: "theme-generation",
      prompt_version: "v7",
      activation_id: "activation-1",
    });
    assert.deepEqual(artifact.lineage.model_reference, {
      provider: "platform-llm",
      model_name: "themes-model-v1",
      model_version: "themes-model-v1",
      temperature: 0,
    });
  });

  it("rejects direct upstream artifact dependencies", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(validLLMOutput()),
        dependencies: {
          evidence_catalog: {} as never,
        },
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("Unsupported dependencies: evidence_catalog"),
    );
  });

  it("rejects malformed JSON", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient("{not-json"),
      }),
      BuilderValidationError,
    );
  });

  it("rejects unsupported output fields", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [{
            title: "AI Adoption",
            summary: "Management discussed AI adoption.",
            category: "technology",
            paragraph_indexes: [2],
            topic_id: "topic:ai",
          }],
        })),
      }),
      BuilderValidationError,
    );
  });

  it("rejects paragraph indexes outside visible input", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [{
            title: "AI Adoption",
            summary: "Management discussed AI adoption.",
            category: "technology",
            paragraph_indexes: [999],
          }],
        })),
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("not present in the supplied Theme Input Boundary evidence"),
    );
  });

  it("rejects duplicate paragraph indexes", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [{
            title: "AI Adoption",
            summary: "Management discussed AI adoption.",
            category: "technology",
            paragraph_indexes: [2, 2],
          }],
        })),
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("must contain unique values"),
    );
  });

  it("rejects duplicate Themes instead of silently repairing output", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [
            {
              title: "AI Adoption",
              summary: "Management discussed AI adoption.",
              category: "technology",
              paragraph_indexes: [2],
            },
            {
              title: "AI Adoption",
              summary: "Management discussed AI adoption.",
              category: "technology",
              paragraph_indexes: [2],
            },
          ],
        })),
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("duplicates another Theme narrative"),
    );
  });

  it("rejects invalid categories", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [{
            title: "AI Adoption",
            summary: "Management discussed AI adoption.",
            category: "artificial_intelligence",
            paragraph_indexes: [2],
          }],
        })),
      }),
      BuilderValidationError,
    );
  });

  it("rejects forbidden downstream reasoning language", async () => {
    await assert.rejects(
      () => execute({
        llmClient: new StaticLLMClient(JSON.stringify({
          themes: [{
            title: "AI Investment Strengthens The Investment Thesis",
            summary: "Management discussed AI adoption.",
            category: "technology",
            paragraph_indexes: [2],
          }],
        })),
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("forbidden downstream reasoning language"),
    );
  });

  it("is deterministic for identical Theme Input Boundary and model output", async () => {
    const first = await execute({
      llmClient: new StaticLLMClient(validLLMOutput()),
    });
    const second = await execute({
      llmClient: new StaticLLMClient(validLLMOutput()),
    });

    assert.deepEqual(first.content, second.content);
    assert.equal(first.metadata.artifact_hash, second.metadata.artifact_hash);
  });

  it("wraps LLM invocation failures in typed execution errors", async () => {
    await assert.rejects(
      () => execute({ llmClient: new FailingLLMClient() }),
      BuilderExecutionError,
    );
  });
});

async function execute(input: {
  llmClient: LLMClient;
  promptResolver?: StaticPromptRenderer;
  themeInputBoundary?: ThemeInputBoundaryContent;
  dependencies?: Record<string, never>;
}): Promise<Artifact<ThemesArtifactContent>> {
  const registry = new BuilderRegistry();
  const themeInputBoundary = input.themeInputBoundary ?? themeInputBoundaryContent();

  registry.registerBuilder({
    builder_type: THEMES_BUILDER_TYPE,
    artifact_type: "themes",
    version: THEMES_BUILDER_VERSION,
    schema_version: THEMES_SCHEMA_VERSION,
    pipeline_version: THEMES_PIPELINE_VERSION,
  }, () => new ThemesBuilder({
    promptResolver: input.promptResolver ?? new StaticPromptRenderer(),
    llmClient: input.llmClient,
    modelVersion: "themes-model-v1",
  }));

  return await new BuilderExecutor(
    registry,
    new ArtifactService(new MemoryArtifactRepository()),
  ).executeBuilder<ThemesBuilderInput, ThemesArtifactContent>({
    builderType: THEMES_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "MSFT:2026-Q2:themes",
    input: {
      theme_input_boundary: themeInputBoundary,
    },
    inputHash: calculateArtifactHash(themeInputBoundary),
    dependencies: input.dependencies,
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function validLLMOutput(): string {
  return JSON.stringify({
    themes: [
      {
        title: "AI Infrastructure Expansion",
        summary: "Management discussed AI infrastructure expansion.",
        category: "technology",
        paragraph_indexes: [2],
      },
      {
        title: "Competition Intensity",
        summary: "Competition remained intense.",
        category: "competition",
        paragraph_indexes: [3],
      },
    ],
  });
}

function themeInputBoundaryContent(): ThemeInputBoundaryContent {
  return {
    grounding_result_id: "theme-grounding-result:msft-2026-q2-10q",
    filing_id: "msft-2026-q2-10q",
    filing_hash: "filing-hash",
    input_version: "theme-input-boundary-v1",
    visible_evidence: [
      {
        evidence_ref: "evidence:overview",
        section_name: "management_discussion",
        paragraph_index: 1,
        paragraph_text: "Management discussed cloud demand.",
      },
      {
        evidence_ref: "evidence:ai",
        section_name: "management_discussion",
        paragraph_index: 2,
        paragraph_text: "Management discussed AI infrastructure expansion.",
      },
      {
        evidence_ref: "evidence:competition",
        section_name: "risk_factors",
        paragraph_index: 1,
        paragraph_text: "Competition remained intense.",
      },
    ],
    visible_section_hierarchy: [
      {
        section_name: "management_discussion",
        evidence_refs: ["evidence:overview", "evidence:ai"],
      },
      {
        section_name: "risk_factors",
        evidence_refs: ["evidence:competition"],
      },
    ],
    permitted_metadata: {
      source_grounding_result_id: "theme-grounding-result:msft-2026-q2-10q",
      visible_evidence_count: 3,
      visible_section_names: ["management_discussion", "risk_factors"],
    },
  };
}

class StaticPromptRenderer {
  readonly calls: Array<{
    promptId: string;
    context: ThemesPromptRenderContext;
    version?: string;
  }> = [];

  render<TContext>(
    promptId: string,
    context: TContext,
    version?: string,
  ): RenderedPrompt {
    this.calls.push({
      promptId,
      context: context as ThemesPromptRenderContext,
      version,
    });

    return {
      prompt_id: promptId,
      prompt_version: "v7",
      activation_id: "activation-1",
      system_prompt: "system prompt",
      user_prompt: "rendered user prompt",
      render_hash: "render-hash",
      source: "filesystem",
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
      token_usage: 100,
    };
  }
}

class FailingLLMClient implements LLMClient {
  async callLLM(): Promise<LLMResponse> {
    throw new Error("LLM unavailable");
  }
}
