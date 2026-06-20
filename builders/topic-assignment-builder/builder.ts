import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import { buildTopicAssignments } from "./assignment.js";
import { calculateTopicAssignmentConfidence } from "./confidence.js";
import { TOPIC_ASSIGNMENT_BUILDER_TYPE } from "./contract.js";
import { TOPIC_ASSIGNMENT_EMBEDDING_MODEL } from "./contract.js";
import type {
  SemanticEmbeddingProvider,
  TopicAssignmentArtifactContent,
  TopicAssignmentBuilderInput,
} from "./types.js";
import {
  requireThemesDependency,
  requireTopicRegistryDependency,
  validateTopicAssignmentArtifactContent,
  validateTopicAssignmentBuilderInput,
} from "./validator.js";

export class TopicAssignmentBuilder implements Builder<
  TopicAssignmentBuilderInput,
  TopicAssignmentArtifactContent
> {
  constructor(
    private readonly embeddingProvider: SemanticEmbeddingProvider,
  ) {}

  builderType(): string {
    return TOPIC_ASSIGNMENT_BUILDER_TYPE;
  }

  async validateInput(input: TopicAssignmentBuilderInput): Promise<void> {
    validateTopicAssignmentBuilderInput(input);
  }

  async execute(
    context: BuilderContext<TopicAssignmentBuilderInput>,
  ): Promise<BuilderResult<TopicAssignmentArtifactContent>> {
    const themesArtifact = requireThemesDependency(
      context.dependencies.themes,
      context.input,
    );
    const registryArtifact = requireTopicRegistryDependency(
      context.dependencies.topic_registry,
    );
    const activeTopics = registryArtifact.content.topics.filter(
      ({ status }) => status === "active",
    );
    const orderedThemes = [...themesArtifact.content.themes].sort(
      (left, right) => left.theme_id.localeCompare(right.theme_id),
    );
    const themeEmbeddings = await this.embeddingProvider.embed({
      model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      texts: orderedThemes.map(buildThemeEmbeddingInput),
    });

    if (
      themeEmbeddings.length !== orderedThemes.length
      || themeEmbeddings.some((embedding) =>
        !Array.isArray(embedding)
        || embedding.length === 0
        || embedding.some((value) => !Number.isFinite(value)))
    ) {
      throw new BuilderValidationError(
        "Semantic embedding provider returned invalid theme embeddings.",
      );
    }

    context.recordModelReference({
      provider: "semantic-embedding",
      model_name: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      model_version: registryArtifact.content.similarity_model_version,
      temperature: 0,
    });

    const { assignments, unassignedThemes } = buildTopicAssignments(
      orderedThemes,
      activeTopics,
      orderedThemes.map((theme, index) => ({
        theme_id: theme.theme_id,
        embedding: themeEmbeddings[index] ?? [],
      })),
    );
    const confidence = calculateTopicAssignmentConfidence(
      assignments,
      themesArtifact.content.themes.length,
      unassignedThemes.length,
    );
    const content: TopicAssignmentArtifactContent = {
      artifact_type: "topic_assignment",
      company: context.input.company_id,
      filing_id: context.input.filing_id,
      period: context.input.period_id,
      assignments,
      unassigned_themes: unassignedThemes,
      confidence,
    };

    validateTopicAssignmentArtifactContent(
      content,
      themesArtifact,
      registryArtifact,
    );

    return {
      content,
      confidence: confidence.overall,
    };
  }
}

function buildThemeEmbeddingInput(
  theme: {
    title: string;
    category: string;
    description: string;
  },
): string {
  return [
    `Theme: ${theme.title}`,
    `Category: ${theme.category}`,
    `Summary: ${theme.description}`,
  ].join("\n");
}
