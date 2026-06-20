import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { ArtifactService } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import { BuilderDependencyError, BuilderValidationError } from "../../../packages/builder-framework/src/builder-errors.js";
import { BuilderExecutor } from "../../../packages/builder-framework/src/builder-executor.js";
import { BuilderRegistry } from "../../../packages/builder-framework/src/builder-registry.js";
import type { LLMClient, LLMRequest, LLMResponse } from "../../../packages/llm-framework/src/llm-client.js";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import type { ThemesArtifactContent } from "../../themes/contract.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_BUILDER_VERSION,
  STRUCTURED_INTELLIGENCE_PIPELINE_VERSION,
  STRUCTURED_INTELLIGENCE_SCHEMA_VERSION,
  type StructuredIntelligenceArtifactContent,
} from "../contract.js";
import { StructuredIntelligenceBuilder } from "../builder.js";
import {
  buildStructuredIntelligenceUserPrompt,
  STRUCTURED_INTELLIGENCE_PROMPT_ID,
} from "../prompt.js";
import type { FilingArtifactContent, StructuredIntelligenceBuilderInput } from "../types.js";
import {
  validateStructuredIntelligenceReconciliation,
} from "../validator.js";

describe("structured intelligence builder", () => {
  it("generates and persists Structured Intelligence from Filing and Themes artifacts", async () => {
    const repository = new TestArtifactRepository();
    const registry = registerStructuredBuilder(new StaticLLMClient(validOutput()));
    const executor = new BuilderExecutor(registry, new ArtifactService(repository));
    const filing = filingArtifact();
    const themes = themesArtifact();

    const artifact = await executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing,
        themes,
      },
      generatedAt: "2026-06-15T00:00:00.000Z",
    });

    assert.equal(artifact.identity.artifact_type, "structured_intelligence");
    assert.equal(artifact.content.company_id, "MSFT");
    assert.equal(artifact.content.status, "complete");
    assert.equal(artifact.content.understanding.business_model.summary, "Microsoft discusses cloud and AI services.");
    assert.equal(artifact.content.confidence.overall > 0, true);
    assert.equal(artifact.content.evaluation_hooks.prompt_version, "structured-intelligence-builder-v1");
    assert.equal(artifact.lineage.prompt_reference?.prompt_id, STRUCTURED_INTELLIGENCE_PROMPT_ID);
    assert.equal(artifact.lineage.model_reference?.temperature, 0);
    assert.deepEqual(artifact.lineage.upstream_dependencies.map((dependency) => dependency.artifact_type), [
      "filing",
      "themes",
    ]);
    assert.deepEqual(await repository.getCurrent({
      artifact_type: "structured_intelligence",
      company_id: "MSFT",
      period_id: "2026-Q2",
    }), artifact);
  });

  it("fails when the Filing artifact dependency is missing", async () => {
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(validOutput())),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          themes: themesArtifact(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("fails when the Themes artifact dependency is missing", async () => {
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(validOutput())),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing: filingArtifact(),
        },
      }),
      BuilderDependencyError,
    );
  });

  it("rejects dependency company and period identity mismatches", async () => {
    const filing = filingArtifact();
    filing.identity.company_id = "AAPL";
    const themes = themesArtifact();
    themes.identity.period_id = "2026-Q1";
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(validOutput())),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "identity-mismatch",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing,
          themes,
        },
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("dependency identity does not match"),
    );
  });

  it("fails validation when required sections are missing", async () => {
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify({
        status: "complete",
        understanding: {
          ...understanding(),
          business_model: undefined,
        },
      }))),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing: filingArtifact(),
          themes: themesArtifact(),
        },
      }),
      BuilderValidationError,
    );
  });

  it("rejects an empty business model evidence_refs array", async () => {
    const output = {
      status: "complete",
      understanding: {
        ...understanding(),
        business_model: {
          ...understanding().business_model,
          evidence_refs: [],
        },
      },
    };
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify(output))),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing: filingArtifact(),
          themes: themesArtifact(),
        },
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message === "business_model.evidence_refs must contain at least one evidence reference.",
    );
  });

  it("rejects an empty repeated claim evidence_refs array", async () => {
    const output = {
      status: "complete",
      understanding: {
        ...understanding(),
        products: [
          {
            product_name: "Azure",
            description: "Cloud services.",
            importance: "high",
            evidence_refs: [],
          },
        ],
      },
    };
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify(output))),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "execution-1",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing: filingArtifact(),
          themes: themesArtifact(),
        },
      }),
      BuilderValidationError,
    );
  });

  it("accepts valid evidence_refs on every emitted claim", async () => {
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(validOutput())),
      new ArtifactService(new TestArtifactRepository()),
    );

    const artifact = await executor.executeBuilder<
      StructuredIntelligenceBuilderInput,
      StructuredIntelligenceArtifactContent
    >({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "valid-evidence-execution",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing: filingArtifact(),
        themes: themesArtifact(),
      },
    });

    assert.deepEqual(
      artifact.content.understanding.business_model.evidence_refs,
      ["theme-1"],
    );
    assert.equal(
      allEvidenceRefs(artifact.content)
        .every((references) => references.length > 0),
      true,
    );
  });

  it("rejects evidence references absent from the supplied Themes artifact", async () => {
    const output = {
      status: "complete",
      understanding: {
        ...understanding(),
        business_model: {
          ...understanding().business_model,
          evidence_refs: ["unknown-evidence-reference"],
        },
      },
    };
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify(output))),
      new ArtifactService(new TestArtifactRepository()),
    );

    await assert.rejects(
      () => executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
        builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
        companyId: "MSFT",
        periodId: "2026-Q2",
        executionId: "unknown-evidence",
        input: input(),
        inputHash: "structured-input-hash",
        dependencies: {
          filing: filingArtifact(),
          themes: themesArtifact(),
        },
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("not present in the supplied Themes artifact"),
    );
  });

  it("calculates theme utilization from referenced themes rather than raw reference count", async () => {
    const output = {
      status: "complete",
      understanding: withAllEvidenceReferences(understanding(), "theme-1"),
    };
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify(output))),
      new ArtifactService(new TestArtifactRepository()),
    );

    const artifact = await executor.executeBuilder<
      StructuredIntelligenceBuilderInput,
      StructuredIntelligenceArtifactContent
    >({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "theme-utilization",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing: filingArtifact(),
        themes: themesArtifact(),
      },
    });

    assert.equal(artifact.content.confidence.theme_utilization, 0.5);
    assert.equal(artifact.content.evaluation_hooks.theme_utilization, 0.5);
  });

  it("rejects confidence that does not reconcile with builder calculation", async () => {
    const repository = new TestArtifactRepository();
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(validOutput())),
      new ArtifactService(repository),
    );
    const themes = themesArtifact();
    const artifact = await executor.executeBuilder<
      StructuredIntelligenceBuilderInput,
      StructuredIntelligenceArtifactContent
    >({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "confidence-reconciliation",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing: filingArtifact(),
        themes,
      },
    });
    const tampered = structuredClone(artifact.content);
    tampered.confidence.overall = 0;

    assert.throws(
      () => validateStructuredIntelligenceReconciliation({
        content: tampered,
        themes: themes.content.themes,
        genericLanguageCount: 0,
        unsupportedEntityWarnings: [],
        promptVersion: "structured-intelligence-builder-v1",
        modelVersion: "structured-model-v1",
      }),
      (error: unknown) =>
        error instanceof BuilderValidationError
        && error.message.includes("confidence does not reconcile"),
    );
  });

  it("instructs the model to use non-empty supplied theme evidence references", () => {
    const prompt = buildStructuredIntelligenceUserPrompt({
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: "msft-2026-q2-10q",
      filing_type: "10-Q",
      filing_content: "Microsoft discusses Azure.",
      themes: themesArtifact().content.themes,
    });

    assert.equal(prompt.includes('"evidence_refs": []'), false);
    assert.match(prompt, /at least one evidence_refs entry/);
    assert.match(prompt, /theme_id values or source_evidence\.excerpt_hash values/);
    assert.match(prompt, /Never emit an empty evidence_refs array/);
  });

  it("records unsupported entity findings as evaluation warnings instead of failing", async () => {
    const output = {
      status: "partial",
      understanding: {
        ...understanding(),
        products: [
          {
            product_name: "Unsupported Product",
            description: "Unsupported product description.",
            importance: "medium",
            evidence_refs: ["theme-1"],
          },
        ],
      },
    };
    const executor = new BuilderExecutor(
      registerStructuredBuilder(new StaticLLMClient(JSON.stringify(output))),
      new ArtifactService(new TestArtifactRepository()),
    );

    const artifact = await executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing: filingArtifact(),
        themes: themesArtifact(),
      },
    });

    assert.equal(artifact.content.status, "partial");
    assert.equal(artifact.content.evaluation_hooks.unsupported_entity_warnings.length > 0, true);
  });

  it("uses temperature zero for LLM calls", async () => {
    const llm = new StaticLLMClient(validOutput());
    const executor = new BuilderExecutor(
      registerStructuredBuilder(llm),
      new ArtifactService(new TestArtifactRepository()),
    );

    await executor.executeBuilder<StructuredIntelligenceBuilderInput, StructuredIntelligenceArtifactContent>({
      builderType: STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
      companyId: "MSFT",
      periodId: "2026-Q2",
      executionId: "execution-1",
      input: input(),
      inputHash: "structured-input-hash",
      dependencies: {
        filing: filingArtifact(),
        themes: themesArtifact(),
      },
    });

    assert.equal(llm.requests[0]?.temperature, 0);
  });
});

function registerStructuredBuilder(llmClient: LLMClient): BuilderRegistry {
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

  return registry;
}

function input(): StructuredIntelligenceBuilderInput {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
  };
}

function validOutput(): string {
  return JSON.stringify({
    status: "complete",
    understanding: understanding(),
  });
}

function understanding(): StructuredIntelligenceArtifactContent["understanding"] {
  return {
    business_model: {
      summary: "Microsoft discusses cloud and AI services.",
      value_creation: "Microsoft creates value through cloud platforms and productivity software.",
      revenue_structure: "Recurring cloud and software subscriptions.",
      evidence_refs: ["theme-1"],
    },
    products: [
      {
        product_name: "Azure",
        description: "Cloud infrastructure services discussed in the filing.",
        importance: "high",
        evidence_refs: ["theme-1"],
      },
    ],
    customers: [
      {
        customer_segment: "enterprise customers",
        description: "Enterprise customers use Microsoft cloud and productivity services.",
        evidence_refs: ["theme-1"],
      },
    ],
    revenue_model: {
      summary: "Revenue is discussed through recurring cloud and software subscriptions.",
      recurring_components: ["cloud subscriptions"],
      transactional_components: [],
      evidence_refs: ["theme-1"],
    },
    revenue_drivers: [
      {
        driver: "cloud demand",
        explanation: "Cloud demand is discussed as a driver.",
        evidence_refs: ["theme-1"],
      },
    ],
    competitive_positioning: [
      {
        position: "cloud platform",
        supporting_reasoning: "The filing discusses cloud platform services.",
        evidence_refs: ["theme-1"],
      },
    ],
    strategic_priorities: [
      {
        priority: "AI adoption",
        rationale: "The filing discusses AI adoption.",
        evidence_refs: ["theme-2"],
      },
    ],
    management_focus: [
      {
        focus_area: "cloud and AI execution",
        explanation: "Management discusses cloud and AI execution.",
        evidence_refs: ["theme-1"],
      },
    ],
    risks: [
      {
        risk: "technology execution",
        explanation: "The filing discusses technology execution risks.",
        evidence_refs: ["theme-2"],
      },
    ],
    dependencies: [
      {
        dependency: "cloud infrastructure",
        explanation: "Cloud infrastructure is discussed as operationally important.",
        evidence_refs: ["theme-1"],
      },
    ],
  };
}

function allEvidenceRefs(
  content: StructuredIntelligenceArtifactContent,
): string[][] {
  const understanding = content.understanding;

  return [
    understanding.business_model.evidence_refs,
    understanding.revenue_model.evidence_refs,
    ...understanding.products.map(({ evidence_refs }) => evidence_refs),
    ...understanding.customers.map(({ evidence_refs }) => evidence_refs),
    ...understanding.revenue_drivers.map(({ evidence_refs }) => evidence_refs),
    ...understanding.competitive_positioning.map(({ evidence_refs }) => evidence_refs),
    ...understanding.strategic_priorities.map(({ evidence_refs }) => evidence_refs),
    ...understanding.management_focus.map(({ evidence_refs }) => evidence_refs),
    ...understanding.risks.map(({ evidence_refs }) => evidence_refs),
    ...understanding.dependencies.map(({ evidence_refs }) => evidence_refs),
  ];
}

function withAllEvidenceReferences(
  value: StructuredIntelligenceArtifactContent["understanding"],
  reference: string,
): StructuredIntelligenceArtifactContent["understanding"] {
  return {
    business_model: {
      ...value.business_model,
      evidence_refs: [reference],
    },
    revenue_model: {
      ...value.revenue_model,
      evidence_refs: [reference],
    },
    products: value.products.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    customers: value.customers.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    revenue_drivers: value.revenue_drivers.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    competitive_positioning: value.competitive_positioning.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    strategic_priorities: value.strategic_priorities.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    management_focus: value.management_focus.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    risks: value.risks.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
    dependencies: value.dependencies.map((item) => ({
      ...item,
      evidence_refs: [reference],
    })),
  };
}

class StaticPromptResolver {
  resolve(): ResolvedPrompt {
    return {
      promptId: "structured-intelligence-builder-system",
      version: "structured-intelligence-builder-v1",
      content: "Generate filing-scoped structured intelligence.",
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
      filing_type: "10-Q",
      filing_content: "Microsoft discusses Azure cloud, AI adoption, enterprise customers, technology execution risks, and cloud infrastructure.",
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
      pipeline_version: "themes-builder-v1",
      generated_at: "2026-06-15T00:00:00.000Z",
      artifact_hash: "themes-artifact-hash",
      input_hash: "themes-input-hash",
      generation_duration_ms: 1,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "themes",
      },
    },
    content: {
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: "msft-2026-q2-10q",
      filing_type: "10-Q",
      themes: [
        {
          theme_id: "theme-1",
          title: "Azure Cloud Demand",
          description: "Management discussed Azure cloud services and enterprise customers.",
          category: "technology",
          importance: "high",
          source_evidence: [{ section: "MD&A", excerpt_hash: "theme-1" }],
          frequency: 2,
          confidence: 0.9,
        },
        {
          theme_id: "theme-2",
          title: "AI Adoption",
          description: "Management discussed AI adoption and technology execution risks.",
          category: "technology",
          importance: "medium",
          source_evidence: [{ section: "MD&A", excerpt_hash: "theme-2" }],
          frequency: 1,
          confidence: 0.8,
        },
      ],
      confidence: {
        overall: 1,
        evidence_coverage: 1,
        extraction_consistency: 1,
        filing_coverage: 1,
      },
      evaluation_hooks: {
        prompt_version: "theme-generation-v1",
        model_version: "themes-model-v1",
        theme_count: 2,
        average_confidence: 0.85,
        confidence_distribution: {
          low: 0,
          medium: 0,
          high: 2,
        },
        evidence_density: 1,
        duplicate_count: 0,
      },
    },
  };
}

function lookupKey(lookup: ArtifactLookup): string {
  return `${lookup.artifact_type}:${lookup.company_id ?? ""}:${lookup.period_id ?? ""}`;
}

function cloneArtifact<T>(artifact: Artifact<T>): Artifact<T> {
  return JSON.parse(JSON.stringify(artifact)) as Artifact<T>;
}
