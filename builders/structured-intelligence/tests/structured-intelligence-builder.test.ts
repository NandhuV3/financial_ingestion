import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import type { FilingArtifactContent } from "../../../contracts/artifacts/filing-artifact-content.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import {
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../../packages/llm-framework/src/llm-client.js";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import { FilesystemPromptProvider } from "../../../src/prompt-registry/filesystem-prompt-provider.js";
import type { ThemesArtifactContent } from "../../themes/contract.js";
import { StructuredIntelligenceBuilder } from "../builder.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_BUILDER_VERSION,
  STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  STRUCTURED_INTELLIGENCE_PROMPT_ID,
  STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
  type StructuredIntelligenceArtifactContent,
  type StructuredUnderstanding,
} from "../contract.js";
import { buildStructuredPromptContext } from "../context-builder.js";
import type {
  StructuredIntelligenceBuilderInput,
} from "../types.js";
import {
  validateStructuredIntelligenceReconciliation,
} from "../validator.js";
import { buildStructuredValueReferences } from "../value-references.js";

describe("structured intelligence builder V1", () => {
  it("resolves prompt content from the filesystem Prompt Registry", () => {
    const prompt = new FilesystemPromptProvider().resolve(
      STRUCTURED_INTELLIGENCE_PROMPT_ID,
    );

    assert.notEqual(prompt, null);
    assert.equal(prompt?.promptId, STRUCTURED_INTELLIGENCE_PROMPT_ID);
    assert.equal(prompt?.version, STRUCTURED_INTELLIGENCE_PROMPT_VERSION);
    assert.match(prompt?.content ?? "", /Return JSON only/);
    assert.match(prompt?.content ?? "", /"product_name": "string"/);
    assert.match(prompt?.content ?? "", /"customer_segment": "string"/);
    assert.match(prompt?.content ?? "", /"driver": "string"/);
    assert.match(prompt?.content ?? "", /"position": "string"/);
    assert.match(prompt?.content ?? "", /"priority": "string"/);
    assert.match(prompt?.content ?? "", /"focus_area": "string"/);
    assert.match(prompt?.content ?? "", /"risk": "string"/);
    assert.match(prompt?.content ?? "", /"dependency": "string"/);
    assert.match(prompt?.content ?? "", /generic aliases such as name/);
    assert.match(prompt?.content ?? "", /could impact/);
    assert.match(prompt?.content ?? "", /significant/);
    assert.match(prompt?.content ?? "", /causal language/);
    assert.match(prompt?.content ?? "", /emit null for explanation/);
  });

  it("builds complete content through governed prompt execution", async () => {
    const llm = new StaticLLMClient(promptOutput(completeUnderstanding()));
    const artifact = await execute(llm);

    assert.equal(artifact.content.artifact_type, "structured_intelligence");
    assert.equal(artifact.content.status, "complete");
    assert.deepEqual(artifact.content.confidence, {
      overall: 1,
      evidence_coverage: 1,
      field_completeness: 1,
      theme_utilization: 1,
      hallucination_risk: "not_assessed",
    });
    assert.deepEqual(artifact.content.evaluation_hooks, {
      schema_compliance: 1,
      field_coverage: 1,
      evidence_coverage: 1,
      theme_utilization: 1,
      unsupported_claim_count: "not_assessed",
    });
    assert.equal(artifact.content.value_references.length, 10);
    assert.equal(
      artifact.content.value_references.every((reference) =>
        reference.value_ref.startsWith("structured-value:")),
      true,
    );
    assert.equal(
      artifact.lineage.prompt_reference?.prompt_id,
      STRUCTURED_INTELLIGENCE_PROMPT_ID,
    );
    assert.equal(artifact.lineage.model_reference?.temperature, 0);
    assert.deepEqual(
      artifact.lineage.upstream_dependencies.map(
        ({ artifact_type }) => artifact_type,
      ),
      ["filing", "themes"],
    );
    assert.equal(llm.requests[0]?.temperature, 0);
  });

  it("rejects malformed JSON and unknown prompt fields", async () => {
    await assert.rejects(
      () => execute(new StaticLLMClient("{")),
      BuilderValidationError,
    );
    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        understanding: completeUnderstanding(),
        confidence: 1,
      }))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("unknown field: confidence"),
    );
  });

  it("rejects legacy product name fields and accepts product_name", async () => {
    const legacy = completeUnderstanding() as unknown as {
      products: Array<Record<string, unknown>>;
    };
    legacy.products[0] = {
      name: "Azure",
      description: "Cloud infrastructure services.",
      importance: "high",
      confidence: 0.9,
      evidence_refs: ["evidence-1"],
    };

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(
        legacy as unknown as StructuredUnderstanding,
      ))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message
          === "understanding.products[0] contains unknown field: name.",
    );

    const artifact = await execute(
      new StaticLLMClient(promptOutput(completeUnderstanding())),
    );
    assert.equal(
      artifact.content.understanding.products[0]?.product_name,
      "Azure",
    );
  });

  it("rejects prompt-owned status and builder-owned metadata", async () => {
    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        status: "complete",
        understanding: completeUnderstanding(),
      }))),
      BuilderValidationError,
    );

    await assert.rejects(
      () => execute(new StaticLLMClient(JSON.stringify({
        understanding: {
          ...completeUnderstanding(),
          replayability_metadata: {},
        },
      }))),
      BuilderValidationError,
    );
  });

  it("requires per-claim extraction confidence", async () => {
    const understanding = completeUnderstanding();
    const businessModel = understanding.business_model as Record<string, unknown>;
    delete businessModel.confidence;

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(understanding))),
      BuilderValidationError,
    );
  });

  it("rejects missing, theme-id, and unknown evidence references", async () => {
    for (const evidenceRefs of [[], ["theme-1"], ["missing-hash"]]) {
      const understanding = completeUnderstanding();
      understanding.business_model = {
        ...understanding.business_model!,
        evidence_refs: evidenceRefs,
      };

      await assert.rejects(
        () => execute(
          new StaticLLMClient(promptOutput(understanding)),
        ),
        BuilderValidationError,
      );
    }
  });

  it("rejects unsupported consequence language", async () => {
    const understanding = completeUnderstanding();
    understanding.risks[0]!.explanation = "Could impact customer trust.";

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(understanding))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes(
          'understanding.risks[0].explanation contains forbidden phrase "could impact"',
        )
        && error.message.includes(
          'Emitted value: "Could impact customer trust."',
        ),
    );
  });

  it("rejects unsupported significance language", async () => {
    const understanding = completeUnderstanding();
    understanding.revenue_drivers[0]!.explanation =
      "A significant revenue driver.";

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(understanding))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes(
          'understanding.revenue_drivers[0].explanation contains forbidden phrase "significant"',
        ),
    );
  });

  it("rejects unsupported causal reasoning", async () => {
    const understanding = completeUnderstanding();
    understanding.competitive_positioning[0]!.supporting_reasoning =
      "Integrated services supports competitive advantage.";

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(understanding))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes(
          'understanding.competitive_positioning[0].supporting_reasoning contains forbidden phrase "supports"',
        ),
    );
  });

  it("accepts grounded factual descriptions", async () => {
    const understanding = completeUnderstanding();
    understanding.management_focus[0]!.explanation =
      "Management discussed AI infrastructure investment.";

    const artifact = await execute(
      new StaticLLMClient(promptOutput(understanding)),
    );

    assert.equal(
      artifact.content.understanding.management_focus[0]?.explanation,
      "Management discussed AI infrastructure investment.",
    );
  });

  it("accepts null risk explanations", async () => {
    const understanding = completeUnderstanding();
    understanding.risks[0]!.explanation = null;

    const artifact = await execute(
      new StaticLLMClient(promptOutput(understanding)),
    );

    assert.equal(
      artifact.content.understanding.risks[0]?.explanation,
      null,
    );
  });

  it("rejects duplicate normalized collection labels", async () => {
    const understanding = completeUnderstanding();
    understanding.products.push({
      ...understanding.products[0]!,
      product_name: "  \uFF21\uFF5A\uFF55\uFF52\uFF45  ",
    });

    await assert.rejects(
      () => execute(new StaticLLMClient(promptOutput(understanding))),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("duplicate normalized label"),
    );
  });

  it("computes theme utilization from evidence-hash intersection only", async () => {
    const understanding = completeUnderstanding();
    setAllEvidence(understanding, ["evidence-1"]);
    const artifact = await execute(
      new StaticLLMClient(promptOutput(understanding)),
    );

    assert.equal(artifact.content.confidence.theme_utilization, 0.5);
  });

  it("computes partial and insufficient_filing status deterministically", async () => {
    const partial = emptyUnderstanding();
    partial.business_model = groundedBusinessModel(["evidence-1"]);
    const partialArtifact = await execute(
      new StaticLLMClient(promptOutput(partial)),
    );
    const insufficientArtifact = await execute(
      new StaticLLMClient(promptOutput(emptyUnderstanding())),
    );

    assert.equal(partialArtifact.content.status, "partial");
    assert.equal(partialArtifact.content.confidence.field_completeness, 0.1);
    assert.equal(insufficientArtifact.content.status, "insufficient_filing");
    assert.deepEqual(insufficientArtifact.content.value_references, []);
    assert.equal(insufficientArtifact.content.confidence.overall, 0);
    assert.equal(
      insufficientArtifact.content.confidence.hallucination_risk,
      "not_assessed",
    );
  });

  it("creates canonical deterministic value references", () => {
    const left = completeUnderstanding();
    const right = completeUnderstanding();
    left.revenue_model!.recurring_components = ["Cloud", "Software", "Cloud"];
    right.revenue_model!.recurring_components = ["Software", "Cloud"];
    left.revenue_model!.evidence_refs = ["evidence-2", "evidence-1"];
    right.revenue_model!.evidence_refs = ["evidence-1", "evidence-2"];

    const leftReferences = references(left);
    const rightReferences = references(right);
    const leftRevenue = leftReferences.find(
      ({ field_path }) => field_path === "understanding.revenue_model",
    );
    const rightRevenue = rightReferences.find(
      ({ field_path }) => field_path === "understanding.revenue_model",
    );

    assert.equal(leftRevenue?.value_hash, rightRevenue?.value_hash);
    assert.deepEqual(leftRevenue?.evidence_refs, ["evidence-1", "evidence-2"]);
    assert.deepEqual(
      leftReferences,
      [...leftReferences].sort((leftReference, rightReference) =>
        leftReference.field_path.localeCompare(rightReference.field_path)
        || leftReference.value_ref.localeCompare(rightReference.value_ref)),
    );
  });

  it("records deterministic replayability metadata", async () => {
    const first = await execute(
      new StaticLLMClient(promptOutput(completeUnderstanding())),
    );
    const second = await execute(
      new StaticLLMClient(promptOutput(completeUnderstanding())),
    );

    assert.deepEqual(
      first.content.replayability_metadata,
      second.content.replayability_metadata,
    );
    assert.equal(
      first.content.replayability_metadata.prompt_id,
      STRUCTURED_INTELLIGENCE_PROMPT_ID,
    );
    assert.equal(first.content.replayability_metadata.temperature, 0);
  });

  it("rejects confidence and replayability tampering", async () => {
    const artifact = await execute(
      new StaticLLMClient(promptOutput(completeUnderstanding())),
    );
    const content = structuredClone(artifact.content);
    const themes = themesArtifact().content;
    const filing = filingArtifact().content;
    const prompt = new StaticPromptResolver().resolve(
      STRUCTURED_INTELLIGENCE_PROMPT_ID,
    );
    const context = buildStructuredPromptContext({
      companyId: "MSFT",
      periodId: "2026-Q2",
      filing,
      themes,
    });

    content.confidence.overall = 0;
    assert.throws(
      () => validateStructuredIntelligenceReconciliation({
        content,
        filing,
        themes,
        context,
        prompt,
        modelVersion: "structured-model-v1",
      }),
      BuilderValidationError,
    );

    content.confidence = artifact.content.confidence;
    content.replayability_metadata.output_hash = "tampered";
    assert.throws(
      () => validateStructuredIntelligenceReconciliation({
        content,
        filing,
        themes,
        context,
        prompt,
        modelVersion: "structured-model-v1",
      }),
      BuilderValidationError,
    );
  });

  it("rejects dependency identity mismatches", async () => {
    const filing = filingArtifact();
    filing.identity.company_id = "AAPL";

    await assert.rejects(
      () => execute(
        new StaticLLMClient(promptOutput(completeUnderstanding())),
        { filing },
      ),
      BuilderValidationError,
    );
  });
});

async function execute(
  llmClient: LLMClient,
  overrides: {
    filing?: Artifact<FilingArtifactContent>;
    themes?: Artifact<ThemesArtifactContent>;
  } = {},
): Promise<Artifact<StructuredIntelligenceArtifactContent>> {
  const registry = new BuilderRegistry();

  registry.registerBuilder({
    builder_type: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
    artifact_type: "structured_intelligence",
    version: STRUCTURED_INTELLIGENCE_BUILDER_VERSION,
    schema_version: STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
    pipeline_version: STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  }, () => new StructuredIntelligenceBuilder({
    promptResolver: new StaticPromptResolver(),
    llmClient,
    modelVersion: "structured-model-v1",
  }));

  return new BuilderExecutor(
    registry,
    new ArtifactService(new TestArtifactRepository()),
  ).executeBuilder<
    StructuredIntelligenceBuilderInput,
    StructuredIntelligenceArtifactContent
  >({
    builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "structured-execution",
    input: {
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: "msft-2026-q2-10q",
    },
    inputHash: "structured-input-hash",
    dependencies: {
      filing: overrides.filing ?? filingArtifact(),
      themes: overrides.themes ?? themesArtifact(),
    },
    generatedAt: "2026-06-22T00:00:00.000Z",
  });
}

function promptOutput(understanding: StructuredUnderstanding): string {
  return JSON.stringify({ understanding });
}

function completeUnderstanding(): StructuredUnderstanding {
  return {
    business_model: groundedBusinessModel(["evidence-1"]),
    products: [{
      product_name: "Azure",
      description: "Cloud infrastructure services.",
      importance: "high",
      confidence: 0.9,
      evidence_refs: ["evidence-1"],
    }],
    customers: [{
      customer_segment: "Enterprise",
      description: "Enterprise cloud customers.",
      confidence: 0.8,
      evidence_refs: ["evidence-1"],
    }],
    revenue_model: {
      summary: "Recurring subscriptions and consumption.",
      recurring_components: ["Cloud"],
      transactional_components: [],
      confidence: 0.9,
      evidence_refs: ["evidence-1"],
    },
    revenue_drivers: [{
      driver: "Cloud demand",
      explanation: "Cloud consumption was identified as a revenue driver.",
      confidence: 0.8,
      evidence_refs: ["evidence-1"],
    }],
    competitive_positioning: [{
      position: "Integrated cloud platform",
      supporting_reasoning: "Integrated enterprise services.",
      confidence: 0.8,
      evidence_refs: ["evidence-1"],
    }],
    strategic_priorities: [{
      priority: "AI infrastructure",
      rationale: "Management discussed capacity investment and AI demand.",
      confidence: 0.8,
      evidence_refs: ["evidence-2"],
    }],
    management_focus: [{
      focus_area: "Capacity execution",
      explanation: "Management discussed infrastructure execution.",
      confidence: 0.8,
      evidence_refs: ["evidence-2"],
    }],
    risks: [{
      risk: "Capacity constraints",
      explanation: null,
      confidence: 0.8,
      evidence_refs: ["evidence-2"],
    }],
    dependencies: [{
      dependency: "Data-center capacity",
      explanation: "Cloud delivery depends on data-center capacity.",
      confidence: 0.8,
      evidence_refs: ["evidence-2"],
    }],
  };
}

function emptyUnderstanding(): StructuredUnderstanding {
  return {
    business_model: null,
    products: [],
    customers: [],
    revenue_model: null,
    revenue_drivers: [],
    competitive_positioning: [],
    strategic_priorities: [],
    management_focus: [],
    risks: [],
    dependencies: [],
  };
}

function groundedBusinessModel(
  evidenceRefs: string[],
): NonNullable<StructuredUnderstanding["business_model"]> {
  return {
    summary: "Cloud and productivity software.",
    value_creation: "Integrated software and cloud services.",
    confidence: 0.9,
    evidence_refs: evidenceRefs,
  };
}

function setAllEvidence(
  understanding: StructuredUnderstanding,
  evidenceRefs: string[],
): void {
  if (understanding.business_model !== null) {
    understanding.business_model.evidence_refs = evidenceRefs;
  }
  if (understanding.revenue_model !== null) {
    understanding.revenue_model.evidence_refs = evidenceRefs;
  }

  for (const item of [
    ...understanding.products,
    ...understanding.customers,
    ...understanding.revenue_drivers,
    ...understanding.competitive_positioning,
    ...understanding.strategic_priorities,
    ...understanding.management_focus,
    ...understanding.risks,
    ...understanding.dependencies,
  ]) {
    item.evidence_refs = evidenceRefs;
  }
}

function references(understanding: StructuredUnderstanding) {
  return buildStructuredValueReferences({
    companyId: "MSFT",
    periodId: "2026-Q2",
    filingId: "msft-2026-q2-10q",
    understanding,
  });
}

class StaticPromptResolver {
  resolve(promptId: string, version?: string): ResolvedPrompt {
    return {
      promptId,
      version: version ?? STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
      content: promptId,
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
      token_usage: 100,
    };
  }
}

function filingArtifact(): Artifact<FilingArtifactContent> {
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
      pipeline_version: "filing-v1",
      generated_at: "2026-06-22T00:00:00.000Z",
      artifact_hash: "filing-artifact-hash",
      input_hash: "filing-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: { builder_type: "filing" },
    },
    content: {
      filing_id: "msft-2026-q2-10q",
      filing_type: "10-Q",
      filing_content: "Cloud demand and AI infrastructure were discussed.",
      filing_hash: "filing-hash",
      filing_period: "2026-Q2",
    },
  };
}

function themesArtifact(): Artifact<ThemesArtifactContent> {
  return {
    identity: {
      artifact_id: "themes-artifact-1",
      artifact_type: "themes",
      company_id: "MSFT",
      period_id: "2026-Q2",
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "themes-v1",
      pipeline_version: "themes-v1",
      generated_at: "2026-06-22T00:00:00.000Z",
      artifact_hash: "themes-artifact-hash",
      input_hash: "themes-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: { builder_type: "themes" },
    },
    content: {
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: "msft-2026-q2-10q",
      filing_type: "10-Q",
      themes: [
        {
          theme_id: "theme-1",
          title: "Cloud demand",
          summary: "Cloud demand increased.",
          category: "technology",
          evidence: [{
            evidence_ref: "evidence-1",
            evidence_hash: "hash-1",
            section_name: "management_discussion",
            paragraph_index: 1,
          }],
          evidence_count: 1,
          confidence: 1,
        },
        {
          theme_id: "theme-2",
          title: "AI infrastructure",
          summary: "AI infrastructure investment continued.",
          category: "strategy",
          evidence: [{
            evidence_ref: "evidence-2",
            evidence_hash: "hash-2",
            section_name: "management_discussion",
            paragraph_index: 2,
          }],
          evidence_count: 1,
          confidence: 1,
        },
      ],
      confidence: {
        overall: 1,
        evidence_coverage: 1,
        extraction_consistency: 1,
        filing_coverage: 1,
      },
      evaluation_hooks: {
        prompt_version: "themes-v1",
        model_version: "themes-model-v1",
        theme_count: 2,
        average_confidence: 1,
        confidence_distribution: { low: 0, medium: 0, high: 2 },
        evidence_density: 1,
        duplicate_count: 0,
      },
    },
  };
}

class TestArtifactRepository implements ArtifactRepository {
  private readonly artifacts = new Map<string, Artifact<unknown>>();
  private readonly current = new Map<string, string>();

  async create<T>(artifact: Artifact<T>): Promise<void> {
    this.artifacts.set(artifact.identity.artifact_id, structuredClone(artifact));
    this.current.set(lookupKey(artifact.identity), artifact.identity.artifact_id);
  }

  async getById<T>(artifactId: string): Promise<Artifact<T> | null> {
    const artifact = this.artifacts.get(artifactId);

    return artifact === undefined
      ? null
      : structuredClone(artifact) as Artifact<T>;
  }

  async getCurrent<T>(lookup: ArtifactLookup): Promise<Artifact<T> | null> {
    const artifactId = this.current.get(lookupKey(lookup));

    return artifactId === undefined ? null : this.getById<T>(artifactId);
  }

  async getHistory<T>(lookup: ArtifactLookup): Promise<Artifact<T>[]> {
    return [...this.artifacts.values()]
      .filter((artifact) =>
        artifact.identity.artifact_type === lookup.artifact_type
        && artifact.identity.company_id === lookup.company_id
        && artifact.identity.period_id === lookup.period_id)
      .map((artifact) => structuredClone(artifact) as Artifact<T>);
  }
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}
