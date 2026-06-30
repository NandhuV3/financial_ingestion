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
  SemanticEmbeddingProvider,
  TopicAssignmentBuilderInput,
} from "../types.js";
import { validateTopicAssignmentArtifactContent } from "../validator.js";

describe("TopicAssignmentBuilder", () => {
  it("assigns exact and semantic matches with stable deterministic output", async () => {
    const builder = new TopicAssignmentBuilder(embeddingProvider({
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
    const builder = new TopicAssignmentBuilder(embeddingProvider({
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
    const builder = new TopicAssignmentBuilder(embeddingProvider({
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
    const builder = new TopicAssignmentBuilder(embeddingProvider({}));

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
    const builder = new TopicAssignmentBuilder(embeddingProvider({}));

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
    const builder = new TopicAssignmentBuilder(embeddingProvider({}));

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
    const builder = new TopicAssignmentBuilder(embeddingProvider({
      "Theme: Cloud": [1, 0],
      "Topic: Cloud": [1, 0],
    }));
    const result = await builder.execute(context({
      themes: themesArtifact([theme("theme-a", "Cloud", "Cloud.")]),
      registry: registryArtifact([topic("topic:cloud", "Cloud")], 12),
    }));

    assert.equal(result.content.registry_version, 12);
  });

  it("records the semantic embedding model reference", async () => {
    const modelReferences: unknown[] = [];
    const builder = new TopicAssignmentBuilder(embeddingProvider({
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
});

function context(params: {
  themes: Artifact<ThemesArtifactContent>;
  registry: Artifact<TopicRegistryArtifactContent>;
  extraDependencies?: Record<string, Artifact<unknown>>;
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

function embeddingProvider(
  byPrefix: Record<string, number[]>,
): SemanticEmbeddingProvider {
  return {
    async embed({ texts }) {
      return texts.map((text) => {
        const firstLine = text.split("\n")[0] ?? "";

        return byPrefix[firstLine] ?? [0, 0];
      });
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
