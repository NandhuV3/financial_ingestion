import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { ArtifactType } from "../../../contracts/artifacts/artifact-type.js";
import type { ArtifactRepository } from "../../../packages/artifact-framework/src/artifact-repository.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { ArtifactLookup } from "../../../packages/artifact-framework/src/artifact-types.js";
import type {
  LLMClient,
  LLMRequest,
  LLMResponse,
} from "../../../packages/llm-framework/src/llm-client.js";
import type { ResolvedPrompt } from "../../../src/prompt-registry/prompt.types.js";
import type { FilingArtifactContent } from "../../structured-intelligence/types.js";
import type { CompanyKnowledgeArtifactContent } from "../../company-knowledge-builder/types.js";
import type { BusinessSignalsArtifactContent } from "../../business-signals-builder/types.js";
import type { TopicRegistryArtifactContent } from "../../topic-assignment-builder/types.js";
import type { TopicAssignmentArtifactContent } from "../../topic-assignment-builder/types.js";
import { buildFilingEvidenceCatalog } from "../../themes/evidence.js";
import {
  STRUCTURED_INTELLIGENCE_PROMPT_ID,
} from "../../structured-intelligence/prompt.js";
import { THEMES_PROMPT_ID } from "../../themes/prompt.js";
import { createArtifactDumpObserver } from "../artifact-dump.js";
import { registerUpstreamBuilders } from "../register-builders.js";
import { runUpstreamPipeline } from "../run-upstream-pipeline.js";

describe("upstream pipeline", () => {
  it("executes and dumps filing through approved Company Knowledge and Business Signals", async (context) => {
    const repository = new InMemoryArtifactRepository();
    const llmClient = new UpstreamLLMClient();
    const outputDirectory = await mkdtemp(join(tmpdir(), "upstream-pipeline-"));
    context.after(async () => rm(outputDirectory, { recursive: true, force: true }));
    const artifactDumps = createArtifactDumpObserver(outputDirectory);
    const runtime = registerUpstreamBuilders({
      repository,
      promptResolver: new UpstreamPromptResolver(),
      llmClient,
      semanticEmbeddingProvider: llmClient,
      themesModelVersion: "themes-demo-model-v1",
      structuredIntelligenceModelVersion: "structured-demo-model-v1",
    });
    const filing = filingArtifact();
    const topicRegistry = topicRegistryArtifact();
    await repository.create(filing);
    await repository.create(topicRegistry);

    const result = await runUpstreamPipeline({
      runtime,
      filingArtifact: filing,
      topicRegistryArtifact: topicRegistry,
      companyId: "MSFT",
      periodId: "2026-Q2",
      generatedAt: "2026-06-19T00:00:00.000Z",
      onArtifact: artifactDumps.observer,
    });

    assert.equal(result.content.company_id, "MSFT");
    assert.equal(result.content.period_id, "2026-Q2");
    assert.equal(result.content.depth_indicator.overall, "base");
    assert.equal(result.content.signals.length > 0, true);
    assert.equal(
      result.content.signals.every((signal) =>
        signal.source_artifact_refs.some((source) =>
          source.artifact_type === "company_knowledge")),
      true,
    );

    for (const artifactType of [
      "themes",
      "topic_assignment",
      "structured_intelligence",
      "company_knowledge_candidate",
      "governance_decision",
      "company_knowledge",
      "business_signals",
    ] as const) {
      assert.notEqual(
        await repository.getCurrent({
          artifact_type: artifactType,
          company_id: "MSFT",
          period_id: "2026-Q2",
        }),
        null,
        `${artifactType} was not persisted`,
      );
    }

    const approvedKnowledge =
      await repository.getCurrent<CompanyKnowledgeArtifactContent>({
      artifact_type: "company_knowledge",
      company_id: "MSFT",
      period_id: "2026-Q2",
    });
    const businessSignals =
      await repository.getCurrent<BusinessSignalsArtifactContent>({
      artifact_type: "business_signals",
      company_id: "MSFT",
      period_id: "2026-Q2",
    });
    const topicAssignment =
      await repository.getCurrent<TopicAssignmentArtifactContent>({
        artifact_type: "topic_assignment",
        company_id: "MSFT",
        period_id: "2026-Q2",
      });

    assert.equal(approvedKnowledge?.content.company_knowledge_version, 1);
    assert.equal(
      businessSignals?.lineage.upstream_dependencies[0]?.artifact_id,
      approvedKnowledge?.identity.artifact_id,
    );
    assert.equal(
      topicAssignment?.lineage.model_reference?.model_version,
      "text-embedding-3-small",
    );
    assert.deepEqual(
      topicAssignment?.lineage.upstream_dependencies
        .map(({ artifact_type }) => artifact_type)
        .sort(),
      ["themes", "topic_registry"],
    );
    assert.equal(
      topicAssignment?.lineage.upstream_dependencies.every(
        ({ artifact_hash, input_hash }) =>
          artifact_hash.length > 0 && input_hash.length > 0,
      ),
      true,
    );
    assert.equal(llmClient.requests.length, 2);
    assert.equal(
      llmClient.requests.every((request) => request.temperature === 0),
      true,
    );

    const expectedDumps = [
      ["01-themes.json", "themes"],
      ["02-topic-assignment.json", "topic_assignment"],
      ["03-structured-intelligence.json", "structured_intelligence"],
      ["04-company-knowledge-candidate.json", "company_knowledge_candidate"],
      ["05-governance-decision.json", "governance_decision"],
      ["06-company-knowledge.json", "company_knowledge"],
      ["07-business-signals.json", "business_signals"],
    ] as const;

    for (const [filename, artifactType] of expectedDumps) {
      const dumped = JSON.parse(
        await readFile(join(outputDirectory, filename), "utf8"),
      ) as Artifact<unknown>;
      assert.equal(dumped.identity.artifact_type, artifactType);
      assert.equal(dumped.identity.company_id, "MSFT");
      assert.equal(dumped.identity.period_id, "2026-Q2");
    }
  });
});

function topicRegistryArtifact(): Artifact<TopicRegistryArtifactContent> {
  const content: TopicRegistryArtifactContent = {
    registry_version: "1.0.0",
    registry_status: "active",
    similarity_model_version: "text-embedding-3-small",
    topics: [
      {
        topic_id: "cloud",
        topic_name: "Cloud",
        status: "active",
        theme_variants: ["Cloud Growth"],
        embedding: [1, 0],
      },
    ],
  };

  return {
    identity: {
      artifact_id: "topic-registry-v1",
      artifact_type: "topic_registry",
      company_id: null,
      period_id: null,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: "topic-registry-artifact-v1",
      pipeline_version: "topic-registry-loader-v1",
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(content),
      input_hash: "topic-registry-input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: "topic-registry-loader",
      },
    },
    content,
  };
}

class UpstreamPromptResolver {
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
}

class UpstreamLLMClient implements LLMClient {
  readonly requests: LLMRequest[] = [];

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    this.requests.push(request);
    const systemPrompt = request.messages.find(({ role }) =>
      role === "system")?.content;

    if (systemPrompt === THEMES_PROMPT_ID) {
      const excerptHash = buildFilingEvidenceCatalog({
        company_id: "MSFT",
        period_id: "2026-Q2",
        filing_id: "msft-2026-q2-10q",
        filing_type: "10-Q",
        filing_content: demoFilingContent(),
        filing_hash: "filing-hash-1",
      })[0]?.excerpt_hash;
      assert.ok(excerptHash);

      return {
        output_text: JSON.stringify({
          themes: [
            {
              title: "Cloud platform demand",
              description: "Management discussed Azure demand and enterprise adoption.",
              category: "technology",
              importance: "high",
              evidence: [
                {
                  section: "MD&A",
                  excerpt_hash: excerptHash,
                },
              ],
              frequency: 2,
            },
          ],
        }),
      };
    }

    if (systemPrompt === STRUCTURED_INTELLIGENCE_PROMPT_ID) {
      return {
        output_text: JSON.stringify({
          status: "complete",
          understanding: structuredUnderstanding(),
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

function structuredUnderstanding() {
  const evidence = buildFilingEvidenceCatalog({
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content: demoFilingContent(),
    filing_hash: "filing-hash-1",
  }).flatMap(({ excerpt_hash }) => [excerpt_hash]);

  return {
    business_model: {
      summary: "Microsoft provides cloud infrastructure and productivity software.",
      value_creation: "Enterprise customers use integrated software and Azure services.",
      revenue_structure: "Recurring subscriptions and cloud consumption.",
      evidence_refs: evidence,
    },
    products: [
      {
        product_name: "Azure",
        description: "Cloud infrastructure and platform services.",
        importance: "high",
        evidence_refs: evidence,
      },
    ],
    customers: [
      {
        customer_segment: "Enterprise customers",
        description: "Organizations using Microsoft cloud and productivity products.",
        evidence_refs: evidence,
      },
    ],
    revenue_model: {
      summary: "Subscriptions, licenses, and cloud usage generate revenue.",
      recurring_components: ["subscriptions"],
      transactional_components: ["licenses"],
      evidence_refs: evidence,
    },
    revenue_drivers: [
      {
        driver: "Azure consumption",
        explanation: "Enterprise cloud workload growth supports usage revenue.",
        evidence_refs: evidence,
      },
    ],
    competitive_positioning: [
      {
        position: "Integrated enterprise platform",
        supporting_reasoning: "Cloud and productivity products share a broad enterprise footprint.",
        evidence_refs: evidence,
      },
    ],
    strategic_priorities: [
      {
        priority: "Cloud capacity",
        rationale: "Infrastructure investment supports Azure demand.",
        evidence_refs: evidence,
      },
    ],
    management_focus: [
      {
        focus_area: "Enterprise cloud adoption",
        explanation: "Management is expanding cloud usage across customer workloads.",
        evidence_refs: evidence,
      },
    ],
    risks: [
      {
        risk: "Infrastructure capacity",
        explanation: "Cloud growth depends on available data center capacity.",
        evidence_refs: evidence,
      },
    ],
    dependencies: [
      {
        dependency: "Data center capacity",
        explanation: "Azure services require continued infrastructure availability.",
        evidence_refs: evidence,
      },
    ],
  };
}

function filingArtifact(): Artifact<FilingArtifactContent> {
  const content: FilingArtifactContent = {
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    filing_content: demoFilingContent(),
    filing_hash: "filing-hash-1",
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

function demoFilingContent(): string {
  return [
    "Microsoft discussed Azure demand and enterprise customer adoption.",
    "The integrated enterprise platform depends on data center capacity.",
  ].join(" ");
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
