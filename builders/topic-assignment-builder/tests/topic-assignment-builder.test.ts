import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Artifact } from "../../../contracts/artifacts/artifact.js";
import { ArtifactStatus } from "../../../contracts/artifacts/artifact-status.js";
import type { BuilderContext } from "../../../packages/builder-framework/src/builder-context.js";
import {
  BuilderDependencyError,
  BuilderValidationError,
} from "../../../packages/builder-framework/src/builder-errors.js";
import { calculateArtifactHash } from "../../../packages/artifact-framework/src/artifact-service.js";
import type {
  Theme,
  ThemesArtifactContent,
} from "../../themes/contract.js";
import { TopicAssignmentBuilder } from "../builder.js";
import {
  buildTopicAssignments,
  createAssignmentId,
} from "../assignment.js";
import type {
  SemanticEmbeddingProvider,
  TopicAssignmentArtifactContent,
  TopicAssignmentBuilderInput,
  TopicRegistryArtifactContent,
  TopicRegistryEntry,
} from "../types.js";
import { validateTopicAssignmentArtifactContent } from "../validator.js";

describe("TopicAssignmentBuilder", () => {
  it("assigns exact and semantic matches with stable deterministic output", async () => {
    const builder = new TopicAssignmentBuilder(
      embeddingProvider({
        "Artificial Intelligence": [0, 1],
        "Cloud platform demand": [1, 0],
      }),
    );
    const first = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-b", "Cloud platform demand", "Azure cloud adoption increased."),
        theme("theme-a", "Artificial Intelligence", "AI infrastructure investment."),
      ]),
      registry: registryArtifact([
        topic("cloud", "Cloud", [1, 0]),
        topic("artificial_intelligence", "Artificial Intelligence", [0, 1]),
      ]),
    }));
    const second = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-a", "Artificial Intelligence", "AI infrastructure investment."),
        theme("theme-b", "Cloud platform demand", "Azure cloud adoption increased."),
      ]),
      registry: registryArtifact([
        topic("artificial_intelligence", "Artificial Intelligence", [0, 1]),
        topic("cloud", "Cloud", [1, 0]),
      ]),
    }));

    assert.deepEqual(first.content, second.content);
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
          topic_id: "artificial_intelligence",
          theme_title: "Artificial Intelligence",
          theme_summary: "AI infrastructure investment.",
          assignment_method: "exact_match",
        },
        {
          theme_id: "theme-b",
          topic_id: "cloud",
          theme_title: "Cloud platform demand",
          theme_summary: "Azure cloud adoption increased.",
          assignment_method: "semantic_match",
        },
      ],
    );
    assert.equal(
      first.content.assignments[0]?.assignment_id,
      createAssignmentId("theme-a", "artificial_intelligence"),
    );
    assert.deepEqual(first.content.confidence, {
      overall: 1,
      exact_match_rate: 0.5,
      semantic_match_rate: 0.5,
      unassigned_rate: 0,
    });
  });

  it("enforces the three-assignment limit and active-topic-only behavior", () => {
    const themes = [
      theme("theme-a", "Cloud Growth Strategy", "Cloud growth strategy."),
    ];
    const topics = [
      topic("cloud", "Cloud", [1, 0]),
      topic("growth", "Growth", [1, 0]),
      topic("strategy", "Strategy", [1, 0]),
      topic("cloud_growth", "Cloud Growth", [1, 0]),
      topic("inactive", "Cloud", [1, 0], "deprecated"),
    ];
    const result = buildTopicAssignments(
      themes,
      topics.filter(({ status }) => status === "active"),
      [{ theme_id: "theme-a", embedding: [1, 0] }],
    );

    assert.equal(result.assignments.length, 3);
    assert.equal(
      result.assignments.some(({ topic_id }) => topic_id === "inactive"),
      false,
    );
  });

  it("represents review-range and unmatched themes as unassigned", async () => {
    const builder = new TopicAssignmentBuilder(
      embeddingProvider({
        Cloud: [0.8, 0.6],
        Operations: [0, 1],
      }),
    );
    const result = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-a", "Cloud", "Platform discussion."),
        theme("theme-b", "Operations", "General execution discussion."),
      ]),
      registry: registryArtifact([
        topic("cloud_services", "Cloud Services", [1, 0]),
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
    assert.equal(
      result.content.unassigned_themes[0]?.highest_similarity_score,
      0.8,
    );
    assert.deepEqual(
      result.content.unassigned_themes[0]?.candidate_topics,
      [{ topic_id: "cloud_services", similarity_score: 0.8 }],
    );
    assert.deepEqual(
      result.content.unassigned_themes[1]?.candidate_topics,
      [],
    );
  });

  it("rejects dependency company, period, filing, type, and registry status mismatches", async () => {
    const builder = new TopicAssignmentBuilder(
      embeddingProvider({ Cloud: [1, 0] }),
    );
    const validThemes = themesArtifact([theme("theme-a", "Cloud", "Cloud.")]);
    const validRegistry = registryArtifact([topic("cloud", "Cloud", [1, 0])]);

    await assert.rejects(
      builder.execute(context({
        themes: {
          ...validThemes,
          identity: {
            ...validThemes.identity,
            company_id: "OTHER",
          },
        },
        registry: validRegistry,
      })),
      BuilderDependencyError,
    );
    await assert.rejects(
      builder.execute(context({
        themes: {
          ...validThemes,
          content: {
            ...validThemes.content,
            filing_id: "other-filing",
          },
        },
        registry: validRegistry,
      })),
      BuilderDependencyError,
    );
    await assert.rejects(
      builder.execute(context({
        themes: validThemes,
        registry: {
          ...validRegistry,
          metadata: {
            ...validRegistry.metadata,
            status: ArtifactStatus.SUPERSEDED,
          },
        },
      })),
      BuilderDependencyError,
    );
  });

  it("rejects legacy or inconsistent canonical Theme dependencies", async () => {
    const builder = new TopicAssignmentBuilder(
      embeddingProvider({ Cloud: [1, 0] }),
    );
    const validThemes = themesArtifact([theme("theme-a", "Cloud", "Cloud.")]);
    const validRegistry = registryArtifact([topic("cloud", "Cloud", [1, 0])]);

    await assert.rejects(
      builder.execute(context({
        themes: {
          ...validThemes,
          content: {
            ...validThemes.content,
            themes: [{
              ...validThemes.content.themes[0]!,
              summary: "",
            }],
          },
        },
        registry: validRegistry,
      })),
      BuilderValidationError,
    );
    await assert.rejects(
      builder.execute(context({
        themes: {
          ...validThemes,
          content: {
            ...validThemes.content,
            themes: [{
              ...validThemes.content.themes[0]!,
              evidence_count: 2,
            }],
          },
        },
        registry: validRegistry,
      })),
      BuilderDependencyError,
    );
  });

  it("rejects invalid stable IDs, inactive topic references, and confidence drift", () => {
    const themes = themesArtifact([theme("theme-a", "Cloud", "Cloud.")]);
    const registry = registryArtifact([
      topic("cloud", "Cloud", [1, 0]),
      topic("old-cloud", "Old Cloud", [0, 1], "deprecated"),
    ]);
    const valid = artifactContent({
      assignment_id: createAssignmentId("theme-a", "cloud"),
      theme_id: "theme-a",
      topic_id: "cloud",
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
          assignment_id: createAssignmentId("theme-a", "old-cloud"),
          topic_id: "old-cloud",
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

  it("rejects propagated theme context that diverges from Themes", () => {
    const themes = themesArtifact([theme("theme-a", "Cloud", "Cloud demand.")]);
    const registry = registryArtifact([topic("cloud", "Cloud", [1, 0])]);
    const valid = artifactContent({
      assignment_id: createAssignmentId("theme-a", "cloud"),
      theme_id: "theme-a",
      topic_id: "cloud",
      theme_title: "Cloud",
      theme_summary: "Cloud demand.",
      assignment_method: "exact_match",
      similarity_score: 1,
      confidence: 1,
    });

    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...valid,
        assignments: [{
          ...valid.assignments[0]!,
          theme_summary: "Rewritten summary.",
        }],
      }, themes, registry),
      BuilderValidationError,
    );

    assert.throws(
      () => validateTopicAssignmentArtifactContent({
        ...valid,
        assignments: [],
        unassigned_themes: [{
          theme_id: "theme-a",
          theme_title: "Rewritten title",
          theme_summary: "Cloud demand.",
          highest_similarity_score: 0.5,
          candidate_topics: [],
        }],
        confidence: {
          overall: 0,
          exact_match_rate: 0,
          semantic_match_rate: 0,
          unassigned_rate: 1,
        },
      }, themes, registry),
      BuilderValidationError,
    );
  });

  it("uses canonical Theme summaries and Topic Registry aliases", async () => {
    const capturedTexts: string[][] = [];
    const builder = new TopicAssignmentBuilder({
      async embed({ texts }) {
        capturedTexts.push(texts);
        return [[0, 1]];
      },
    });
    const result = await builder.execute(context({
      themes: themesArtifact([
        theme("theme-a", "AI infrastructure", "Capacity expanded for AI."),
      ]),
      registry: registryArtifact([
        topic(
          "artificial_intelligence",
          "Artificial Intelligence",
          [1, 0],
          "active",
          ["AI infrastructure"],
        ),
      ]),
    }));

    assert.deepEqual(capturedTexts, [[
      "Theme: AI infrastructure\nCategory: technology\nSummary: Capacity expanded for AI.",
    ]]);
    assert.equal(result.content.assignments[0]?.assignment_method, "exact_match");
    assert.equal(
      result.content.assignments[0]?.theme_summary,
      "Capacity expanded for AI.",
    );
  });
});

function context(params: {
  themes: Artifact<ThemesArtifactContent>;
  registry: Artifact<TopicRegistryArtifactContent>;
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
    },
    recordPromptReference() {},
    recordModelReference() {},
  };
}

function themesArtifact(themes: Theme[]): Artifact<ThemesArtifactContent> {
  const content: ThemesArtifactContent = {
    company_id: "MSFT",
    period_id: "2026-Q2",
    filing_id: "msft-2026-q2-10q",
    filing_type: "10-Q",
    themes,
    confidence: {
      overall: 1,
      evidence_coverage: 1,
      extraction_consistency: 1,
      filing_coverage: 1,
    },
    evaluation_hooks: {
      prompt_version: "themes-v1",
      model_version: "model-v1",
      theme_count: themes.length,
      average_confidence: 1,
      confidence_distribution: { low: 0, medium: 0, high: themes.length },
      evidence_density: 1,
      duplicate_count: 0,
    },
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
): Artifact<TopicRegistryArtifactContent> {
  return artifact({
    artifactId: "topic-registry-v1",
    artifactType: "topic_registry",
    companyId: null,
    periodId: null,
    content: {
      registry_version: "1.0.0",
      registry_status: "active",
      similarity_model_version: "text-embedding-3-small",
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
    evidence: [{
      section: "MD&A",
      excerpt_hash: "evidence-hash",
    }],
    evidence_count: 1,
    confidence: 1,
  };
}

function topic(
  topicId: string,
  topicName: string,
  embedding: number[],
  status: TopicRegistryEntry["status"] = "active",
  aliases: string[] = [],
): TopicRegistryEntry {
  return {
    topic_id: topicId,
    topic_name: topicName,
    definition: `${topicName} definition.`,
    aliases,
    status,
    embedding,
  };
}

function embeddingProvider(
  byTitle: Record<string, number[]>,
): SemanticEmbeddingProvider {
  return {
    async embed({ texts }) {
      return texts.map((text) => {
        const title = text
          .split("\n")
          .find((line) => line.startsWith("Theme: "))
          ?.slice("Theme: ".length);

        return title === undefined ? [] : byTitle[title] ?? [];
      });
    },
  };
}

function artifactContent(
  assignment: TopicAssignmentArtifactContent["assignments"][number],
): TopicAssignmentArtifactContent {
  return {
    artifact_type: "topic_assignment",
    company: "MSFT",
    filing_id: "msft-2026-q2-10q",
    period: "2026-Q2",
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
