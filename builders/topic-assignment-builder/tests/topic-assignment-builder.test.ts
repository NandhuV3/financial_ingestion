import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicLifecycleState,
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../../../contracts/artifacts/topic-registry-artifact-content.js";
import {
  EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
  type EmbeddingExecutionRecord,
} from "../../../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingResolverReader,
  EmbeddingResolverRequest,
} from "../../../contracts/execution/embedding-resolver-contract.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type { BuilderContext } from "../../../packages/builder-framework/src/builder-context.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import type {
  Theme,
  ThemesArtifactContent,
} from "../../themes/contract.js";
import {
  buildTopicAssignments,
  createAssignmentId,
} from "../assignment.js";
import { TopicAssignmentBuilder } from "../builder.js";
import type {
  TopicAssignmentBuilderInput,
} from "../types.js";
import { validateTopicAssignmentArtifactContent } from "../validator.js";
import {
  embeddingExecutionRecordHash,
  embeddingExecutionRecordId,
} from "../../../src/embedding-generator/index.js";

describe("TopicAssignmentBuilder", () => {
  it("assigns exact and semantic matches with stable deterministic output", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Artificial Intelligence": [0, 1],
      "Theme: Cloud platform demand": [1, 0],
      "Topic: Artificial Intelligence": [0, 1],
      "Topic: Cloud": [1, 0],
    }));
    const first = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-b", "Cloud platform demand", "Azure cloud adoption increased."),
        theme("theme-a", "Artificial Intelligence", "AI infrastructure investment."),
      ]),
      registry: registryArtifact([
        topic("topic:cloud", "Cloud"),
        topic("topic:artificial-intelligence", "Artificial Intelligence"),
      ]),
    }));
    const second = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-a", "Artificial Intelligence", "AI infrastructure investment."),
        theme("theme-b", "Cloud platform demand", "Azure cloud adoption increased."),
      ]),
      registry: registryArtifact([
        topic("topic:artificial-intelligence", "Artificial Intelligence"),
        topic("topic:cloud", "Cloud"),
      ]),
    }));

    assert.deepEqual(first.content, second.content);
    assert.equal(first.content.company_id, "MSFT");
    assert.equal(first.content.period_id, "2026-Q2");
    assert.equal(first.content.filing_id, "msft-2026-q2-10q");
    assert.equal(first.content.registry_version, 7);
    assert.deepEqual(
      first.content.assignments.map(({
        theme_id,
        topic_id,
        theme_title,
        theme_summary,
        assignment_method,
      }) => ({
        theme_id,
        topic_id,
        theme_title,
        theme_summary,
        assignment_method,
      })),
      [
        {
          theme_id: "theme-a",
          topic_id: "topic:artificial-intelligence",
          theme_title: "Artificial Intelligence",
          theme_summary: "AI infrastructure investment.",
          assignment_method: "exact_match",
        },
        {
          theme_id: "theme-b",
          topic_id: "topic:cloud",
          theme_title: "Cloud platform demand",
          theme_summary: "Azure cloud adoption increased.",
          assignment_method: "semantic_match",
        },
      ],
    );
    assert.equal(
      first.content.assignments[0]?.assignment_id,
      createAssignmentId("theme-a", "topic:artificial-intelligence"),
    );
    assert.deepEqual(first.content.confidence, {
      overall: 1,
      exact_match_rate: 0.5,
      semantic_match_rate: 0.5,
      unassigned_rate: 0,
    });
  });

  it("assigns one Theme to multiple Topics with deterministic limits", () => {
    const result = buildTopicAssignments(
      [theme("theme-a", "Cloud Growth Strategy", "Cloud growth strategy.")],
      [
        topic("topic:cloud", "Cloud"),
        topic("topic:growth", "Growth"),
        topic("topic:strategy", "Strategy"),
        topic("topic:cloud-growth", "Cloud Growth"),
      ],
      [{ theme_id: "theme-a", embedding: [1, 0] }],
      [
        { topic_id: "topic:cloud", embedding: [1, 0] },
        { topic_id: "topic:growth", embedding: [1, 0] },
        { topic_id: "topic:strategy", embedding: [1, 0] },
        { topic_id: "topic:cloud-growth", embedding: [1, 0] },
      ],
    );

    assert.deepEqual(
      result.assignments.map(({ topic_id }) => topic_id),
      ["topic:cloud", "topic:cloud-growth", "topic:growth"],
    );
  });

  it("preserves unassigned Themes and review-range candidate Topics", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [0.8, 0.6],
      "Theme: Operations": [0, 1],
      "Topic: Cloud Services": [1, 0],
    }));
    const result = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-a", "Cloud", "Platform discussion."),
        theme("theme-b", "Operations", "General execution discussion."),
      ]),
      registry: registryArtifact([
        topic("topic:cloud-services", "Cloud Services"),
      ]),
    }));

    assert.equal(result.content.assignments.length, 0);
    assert.deepEqual(
      result.content.unassigned_themes.map(({
        theme_id,
        theme_title,
        theme_summary,
      }) => ({
        theme_id,
        theme_title,
        theme_summary,
      })),
      [
        {
          theme_id: "theme-a",
          theme_title: "Cloud",
          theme_summary: "Platform discussion.",
        },
        {
          theme_id: "theme-b",
          theme_title: "Operations",
          theme_summary: "General execution discussion.",
        },
      ],
    );
    assert.deepEqual(
      result.content.unassigned_themes[0]?.candidate_topics,
      [{
        topic_id: "topic:cloud-services",
        similarity_score: 0.8,
        rejection_reason: "below_automatic_assignment_threshold",
      }],
    );
    assert.deepEqual(
      result.content.unassigned_themes[1]?.candidate_topics,
      [{
        topic_id: "topic:cloud-services",
        similarity_score: 0,
        rejection_reason: "below_human_review_threshold",
      }],
    );
  });

  it("rejects inactive Topic assignments", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
    }));
    const result = await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([
        topic("topic:cloud", "Cloud", "deprecated"),
      ]),
    }));

    assert.equal(result.content.assignments.length, 0);
    assert.equal(result.content.unassigned_themes.length, 1);
  });

  it("rejects duplicate Topic Registry entries", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({}));

    await assert.rejects(
      () => builder.execute(context({
        themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
        registry: registryArtifact([
          topic("topic:cloud", "Cloud"),
          topic("topic:cloud", "Cloud Services"),
        ]),
      })),
      BuilderDependencyError,
    );
  });

  it("rejects duplicate Theme IDs", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({}));

    await assert.rejects(
      () => builder.execute(context({
        themes: themesArtifact([
          theme("theme-a", "Cloud", "Cloud."),
          theme("theme-a", "AI", "AI."),
        ]),
        registry: registryArtifact([topic("topic:cloud", "Cloud")]),
      })),
      BuilderDependencyError,
    );
  });

  it("validates artifact schema, stable IDs, active topics, and confidence", () => {
    const themes = themesArtifact([theme("theme-a", "Cloud", "Cloud.")]);
    const registry = registryArtifact([
      topic("topic:cloud", "Cloud"),
      topic("topic:old-cloud", "Old Cloud", "deprecated"),
    ]);
    const valid = artifactContent({
      assignment_id: createAssignmentId("theme-a", "topic:cloud"),
      theme_id: "theme-a",
      topic_id: "topic:cloud",
      theme_title: "Cloud",
      theme_summary: "Cloud.",
      assignment_method: "exact_match",
      similarity_score: 1,
      confidence: 1,
    });

    assert.doesNotThrow(() =>
      validateTopicAssignmentArtifactContent(valid, themes, registry));
    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...valid,
        assignments: [{ ...valid.assignments[0]!, assignment_id: "unstable" }],
      }, themes, registry),
      BuilderValidationError,
    );
    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...valid,
        assignments: [{
          ...valid.assignments[0]!,
          assignment_id: createAssignmentId("theme-a", "topic:old-cloud"),
          topic_id: "topic:old-cloud",
        }],
      }, themes, registry),
      BuilderValidationError,
    );
    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...valid,
        confidence: { ...valid.confidence, overall: 0.5 },
      }, themes, registry),
      BuilderValidationError,
    );
  });

  it("rejects duplicate Theme-to-Topic assignments", () => {
    const themes = themesArtifact([theme("theme-a", "Cloud", "Cloud.")]);
    const registry = registryArtifact([topic("topic:cloud", "Cloud")]);
    const assignment = {
      assignment_id: createAssignmentId("theme-a", "topic:cloud"),
      theme_id: "theme-a",
      topic_id: "topic:cloud",
      theme_title: "Cloud",
      theme_summary: "Cloud.",
      assignment_method: "exact_match" as const,
      similarity_score: 1,
      confidence: 1,
    };

    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...artifactContent(assignment),
        assignments: [assignment, assignment],
      }, themes, registry),
      BuilderValidationError,
    );
  });

  it("rejects forbidden dependencies", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({}));

    await assert.rejects(
      () => builder.execute(context({
        themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
        registry: registryArtifact([topic("topic:cloud", "Cloud")]),
        extraDependencies: {
          structured_intelligence: {} as Artifact<unknown>,
        },
      })),
      BuilderDependencyError,
    );
  });

  it("records the registry version from the Topic Registry", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }));
    const result = await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")], 12),
    }));

    assert.equal(result.content.registry_version, 12);
  });

  it("resolves embeddings through the Embedding Resolver in original execution", async () => {
    const requests: EmbeddingResolverRequest[] = [];
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }, requests));

    await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")]),
    }));

    assert.deepEqual(
      requests.map((request) => ({
        execution_mode: request.execution_mode,
        source_type: request.source_type,
        source_id: request.source_id,
        embedding_model_version: request.embedding_model_version,
      })),
      [
        {
          execution_mode: "ORIGINAL_EXECUTION",
          source_type: "topic_assignment_theme",
          source_id: "theme-a",
          embedding_model_version: "text-embedding-3-small",
        },
        {
          execution_mode: "ORIGINAL_EXECUTION",
          source_type: "topic_assignment_topic",
          source_id: "topic:cloud",
          embedding_model_version: "text-embedding-3-small",
        },
      ],
    );
    assert.ok(requests.every((request) => request.source_hash.length > 0));
  });

  it("passes replay mode to the Embedding Resolver without generation branching", async () => {
    const requests: EmbeddingResolverRequest[] = [];
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }, requests));

    const result = await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")]),
      input: {
        embedding_execution_mode: "REPLAY",
        replay_original_execution_context: {
          execution_id: "original-topic-assignment-execution",
          generated_at: "2026-06-18T00:00:00.000Z",
        },
      },
    }));

    assert.equal(result.content.assignments.length, 1);
    assert.deepEqual(
      requests.map(({ execution_mode }) => execution_mode),
      ["REPLAY", "REPLAY"],
    );
  });

  it("preserves original Topic Signal execution context during replay", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }));

    const result = await builder.executeWithTopicSignals(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")]),
      input: {
        embedding_execution_mode: "REPLAY",
        replay_original_execution_context: {
          execution_id: "MSFT:2026-Q2:topic-assignment-original",
          generated_at: "2026-06-18T00:00:00.000Z",
        },
      },
    }), {
      generatedAt: "2026-07-04T00:00:00.000Z",
    });

    assert.equal(
      result.topic_signals[0]?.execution_context.execution_id,
      "MSFT:2026-Q2:topic-assignment-original",
    );
    assert.equal(
      result.topic_signals[0]?.execution_metadata.generated_at,
      "2026-06-18T00:00:00.000Z",
    );
  });

  it("rejects replay without original execution context", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }));

    await assert.rejects(
      () => builder.execute(context({
        themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
        registry: registryArtifact([topic("topic:cloud", "Cloud")]),
        input: {
          embedding_execution_mode: "REPLAY",
        },
      })),
      BuilderValidationError,
    );
  });

  it("records the semantic embedding model reference", async () => {
    const modelReferences: unknown[] = [];
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }));

    await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")]),
      recordModelReference(reference) {
        modelReferences.push(reference);
      },
    }));

    assert.deepEqual(modelReferences, [{
      provider: "semantic-embedding",
      model_name: "text-embedding-3-small",
      model_version: "text-embedding-3-small",
      temperature: 0,
    }]);
  });

  it("emits deterministic Topic Signals for every assigned, review, and unassigned Theme", async () => {
    const builder = new TopicAssignmentBuilder(embeddingResolver({
      "Theme: Exact Cloud": [0, 1],
      "Theme: Multi Topic": [1, 0],
      "Theme: Review Topic": [0.8, 0.6],
      "Theme: Unassigned Topic": [0, 1],
      "Topic: Cloud": [1, 0],
      "Topic: Growth": [1, 0],
      "Topic: Strategy": [1, 0],
      "Topic: Platform": [1, 0],
      "Topic: Review Candidate": [1, 0],
    }));
    const inputContext = context({
      themes: themesArtifact([
        theme("theme-d", "Unassigned Topic", "No strong registry fit."),
        theme("theme-b", "Multi Topic", "Matches several reusable topics."),
        theme("theme-a", "Exact Cloud", "Direct cloud topic."),
        theme("theme-c", "Review Topic", "Close but below automatic assignment."),
      ]),
      registry: registryArtifact([
        topic("topic:strategy", "Strategy"),
        topic("topic:cloud", "Cloud", "active", ["Exact Cloud"]),
        topic("topic:growth", "Growth"),
        topic("topic:platform", "Platform"),
        topic("topic:review-candidate", "Review Candidate"),
      ]),
    });
    const first = await builder.executeWithTopicSignals(inputContext, {
      generatedAt: "2026-06-19T00:00:00.000Z",
    });
    const second = await builder.executeWithTopicSignals(inputContext, {
      generatedAt: "2026-06-19T00:00:00.000Z",
    });

    assert.deepEqual(first, second);
    assert.equal(first.topic_signals.length, 4);
    assert.equal(first.builder_result.content.assignments.length, 4);
    assert.equal(first.builder_result.content.unassigned_themes.length, 2);
    assert.equal(first.builder_result.execution_references?.length, 9);

    const signalsByTheme = new Map(
      first.topic_signals.map((signal) => [signal.theme.theme_id, signal]),
    );
    const exactSignal = signalsByTheme.get("theme-a");
    const multiSignal = signalsByTheme.get("theme-b");
    const reviewSignal = signalsByTheme.get("theme-c");
    const unassignedSignal = signalsByTheme.get("theme-d");

    assert.equal(exactSignal?.final_result.assignment_status, "assigned");
    assert.ok(exactSignal?.execution_references);
    assert.equal(exactSignal?.execution_references.length, 6);
    assert.deepEqual(
      exactSignal?.execution_references.map(({ record_type }) => record_type),
      [
        "embedding_execution_record",
        "embedding_execution_record",
        "embedding_execution_record",
        "embedding_execution_record",
        "embedding_execution_record",
        "embedding_execution_record",
      ],
    );
    assert.deepEqual(exactSignal?.final_result.final_assignments, [{
      topic_id: "topic:cloud",
      confidence: 1,
      assignment_method: "exact_match",
    }]);
    assert.deepEqual(exactSignal?.evaluation.candidates, [{
      topic_id: "topic:cloud",
      similarity_score: 1,
      assignment_method: "exact_match",
      decision: "accepted",
    }]);

    assert.equal(multiSignal?.final_result.assignment_status, "assigned");
    assert.deepEqual(
      multiSignal?.final_result.final_assignments.map(({ topic_id }) => topic_id),
      ["topic:cloud", "topic:growth", "topic:platform"],
    );
    assert.deepEqual(
      multiSignal?.evaluation.candidates.map(({ topic_id, decision }) => ({
        topic_id,
        decision,
      })),
      [
        { topic_id: "topic:cloud", decision: "accepted" },
        { topic_id: "topic:growth", decision: "accepted" },
        { topic_id: "topic:platform", decision: "accepted" },
      ],
    );

    assert.equal(reviewSignal?.final_result.assignment_status, "human_review");
    assert.deepEqual(reviewSignal?.final_result.final_assignments, []);
    assert.deepEqual(reviewSignal?.evaluation.candidates[0], {
      topic_id: "topic:cloud",
      similarity_score: 0.8,
      assignment_method: "semantic_match",
      decision: "rejected",
      rejection_reason: "below_automatic_assignment_threshold",
    });

    assert.equal(unassignedSignal?.final_result.assignment_status, "unassigned");
    assert.deepEqual(unassignedSignal?.final_result.final_assignments, []);
    assert.equal(unassignedSignal?.evaluation.candidates[0]?.decision, "rejected");
    assert.equal(
      unassignedSignal?.evaluation.candidates[0]?.rejection_reason,
      "below_human_review_threshold",
    );
    assert.equal(
      unassignedSignal?.execution_metadata.embedding_model,
      "text-embedding-3-small",
    );
    assert.equal(
      unassignedSignal?.execution_metadata.generated_at,
      "2026-06-19T00:00:00.000Z",
    );
    assert.equal(unassignedSignal?.registry_context.registry_version, 7);
  });
});

function context(params: {
  themes: Artifact<ThemesArtifactContent>;
  registry: Artifact<TopicRegistryArtifactContent>;
  extraDependencies?: Record<string, Artifact<unknown>>;
  input?: Partial<TopicAssignmentBuilderInput>;
  recordModelReference?: BuilderContext<TopicAssignmentBuilderInput>["recordModelReference"];
}): BuilderContext<TopicAssignmentBuilderInput> {
  return {
    companyId: "MSFT",
    periodId: "2026-Q2",
    executionId: "topic-assignment-test",
    input: {
      company_id: "MSFT",
      period_id: "2026-Q2",
      filing_id: "msft-2026-q2-10q",
      ...params.input,
    },
    dependencies: {
      themes: params.themes,
      topic_registry: params.registry,
      ...params.extraDependencies,
    },
    recordPromptReference() {},
    recordModelReference: params.recordModelReference ?? (() => {}),
  };
}

function themesArtifact(themes: Theme[]): Artifact<ThemesArtifactContent> {
  const content: ThemesArtifactContent = {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    themes,
    prompt_id: "theme-generation",
    prompt_version: "v7",
    reasoning_version: "themes-reasoning-v1",
    render_hash: "render-hash",
    model_name: "themes-model",
    model_version: "themes-model",
  };

  return artifact({
    artifactId: "themes-artifact",
    artifactType: "themes",
    companyId: "MSFT",
    periodId: "2026-Q2",
    content,
  });
}

function registryArtifact(
  topics: TopicRegistryEntry[],
  registryVersion = 7,
): Artifact<TopicRegistryArtifactContent> {
  return artifact({
    artifactId: "topic-registry-v1",
    artifactType: "topic_registry",
    companyId: null,
    periodId: null,
    content: {
      registry_version: registryVersion,
      topics,
    },
  });
}

function artifact<T>(params: {
  artifactId: string;
  artifactType: "themes" | "topic_registry";
  companyId: string | null;
  periodId: string | null;
  content: T;
}): Artifact<T> {
  return {
    identity: {
      artifact_id: params.artifactId,
      artifact_type: params.artifactType,
      company_id: params.companyId,
      period_id: params.periodId,
      version: 1,
    },
    metadata: {
      version: 1,
      schema_version: `${params.artifactType}-v1`,
      pipeline_version: `${params.artifactType}-pipeline-v1`,
      generated_at: "2026-06-19T00:00:00.000Z",
      artifact_hash: calculateArtifactHash(params.content),
      input_hash: "input-hash",
      generation_duration_ms: 0,
      status: ArtifactStatus.ACTIVE,
    },
    lineage: {
      upstream_dependencies: [],
      generation_context: {
        builder_type: params.artifactType,
      },
    },
    content: params.content,
  };
}

function theme(
  themeId: string,
  title: string,
  summary: string,
): Theme {
  return {
    theme_id: themeId,
    title,
    summary,
    category: "technology",
    evidence: [{ evidence_ref: "evidence:evidence-ref" }],
    evidence_count: 1,
    extraction_confidence: 1,
    prompt_id: "theme-generation",
    prompt_version: "v7",
    reasoning_version: "themes-reasoning-v1",
  };
}

function topic(
  topicId: string,
  canonicalName: string,
  lifecycleState: TopicLifecycleState = "active",
  aliases: string[] = [],
): TopicRegistryEntry {
  return {
    topic_id: topicId,
    canonical_name: canonicalName,
    definition: `${canonicalName} definition.`,
    aliases,
    lifecycle_state: lifecycleState,
    created_registry_version: 1,
    updated_registry_version: 7,
    child_topic_ids: [],
    examples: [`${canonicalName} example`],
    created_at: "2026-06-19T00:00:00.000Z",
    updated_at: "2026-06-19T00:00:00.000Z",
  };
}

function embeddingResolver(
  byPrefix: Record<string, number[]>,
  requests: EmbeddingResolverRequest[] = [],
): EmbeddingResolverReader {
  return {
    async resolve(request) {
      const firstLine = request.source_text.split("\n")[0] ?? "";

      requests.push(structuredClone(request));

      return embeddingRecord(request, byPrefix[firstLine] ?? [0, 0]);
    },
  };
}

function embeddingRecord(
  request: EmbeddingResolverRequest,
  vector: number[],
): EmbeddingExecutionRecord {
  const identityInput = {
    source_type: request.source_type,
    source_id: request.source_id,
    source_hash: request.source_hash,
    model_version: request.embedding_model_version,
    vector,
  };

  return {
    schema_version: EMBEDDING_EXECUTION_RECORD_SCHEMA_VERSION,
    record_type: "embedding",
    record_id: embeddingExecutionRecordId(identityInput),
    record_hash: embeddingExecutionRecordHash(identityInput),
    producer: "embedding-resolver-test",
    execution_id: "embedding-resolution-test",
    source: {
      source_type: request.source_type,
      source_id: request.source_id,
      source_hash: request.source_hash,
    },
    embedding: {
      model: request.embedding_model,
      model_version: request.embedding_model_version,
      dimensions: vector.length,
      vector,
    },
  };
}

function artifactContent(
  assignment: TopicAssignmentArtifactContent["assignments"][number],
): TopicAssignmentArtifactContent {
  return {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    registry_version: 7,
    assignments: [assignment],
    unassigned_themes: [],
    confidence: {
      overall: 1,
      exact_match_rate: 1,
      semantic_match_rate: 0,
      unassigned_rate: 0,
    },
  };
}
