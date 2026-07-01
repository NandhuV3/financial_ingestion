import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import type {
  TopicAssignmentArtifactContent,
} from "../../contracts/artifacts/topic-assignment-artifact-content.js";
import type {
  TopicSignalExecutionRecord,
} from "../../contracts/execution/topic-signal-execution-record.js";
import { buildTopicAssignmentExecution } from "./assignment.js";
import { calculateTopicAssignmentConfidence } from "./confidence.js";
import { TOPIC_ASSIGNMENT_BUILDER_TYPE } from "./contract.js";
import { TOPIC_ASSIGNMENT_EMBEDDING_MODEL } from "./contract.js";
import type {
  SemanticEmbeddingProvider,
  TopicAssignmentBuilderInput,
  TopicRegistryEntry,
} from "./types.js";
import {
  requireThemesDependency,
  requireTopicRegistryDependency,
  validateTopicAssignmentDependencies,
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
    return (await this.executeWithTopicSignals(context, {
      generatedAt: new Date().toISOString(),
    })).builder_result;
  }

  async executeWithTopicSignals(
    context: BuilderContext<TopicAssignmentBuilderInput>,
    options: { generatedAt: string },
  ): Promise<{
    builder_result: BuilderResult<TopicAssignmentArtifactContent>;
    topic_signals: TopicSignalExecutionRecord[];
  }> {
    validateTopicAssignmentDependencies(context.dependencies);

    const themesArtifact = requireThemesDependency(
      context.dependencies.themes,
      context.input,
    );
    const registryArtifact = requireTopicRegistryDependency(
      context.dependencies.topic_registry,
    );
    const activeTopics = registryArtifact.content.topics.filter(
      ({ lifecycle_state }) => lifecycle_state === "active",
    );
    const orderedThemes = [...themesArtifact.content.themes].sort(
      (left, right) => left.theme_id.localeCompare(right.theme_id),
    );
    const orderedTopics = [...activeTopics].sort((left, right) =>
      left.topic_id.localeCompare(right.topic_id));
    const embeddingTexts = [
      ...orderedThemes.map(buildThemeEmbeddingInput),
      ...orderedTopics.map(buildTopicEmbeddingInput),
    ];
    const embeddings = await this.embeddingProvider.embed({
      model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      texts: embeddingTexts,
    });

    if (
      embeddings.length !== embeddingTexts.length
      || embeddings.some((embedding) =>
        !Array.isArray(embedding)
        || embedding.length === 0
        || embedding.some((value) => !Number.isFinite(value)))
    ) {
      throw new BuilderValidationError(
        "Semantic embedding provider returned invalid Topic Assignment embeddings.",
      );
    }

    context.recordModelReference({
      provider: "semantic-embedding",
      model_name: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      temperature: 0,
    });

    const themeEmbeddings = embeddings.slice(0, orderedThemes.length);
    const topicEmbeddings = embeddings.slice(orderedThemes.length);
    const { assignments, unassignedThemes, themeEvaluations } =
      buildTopicAssignmentExecution(
        orderedThemes,
        orderedTopics,
        orderedThemes.map((theme, index) => ({
          theme_id: theme.theme_id,
          embedding: themeEmbeddings[index] ?? [],
        })),
        orderedTopics.map((topic, index) => ({
          topic_id: topic.topic_id,
          embedding: topicEmbeddings[index] ?? [],
        })),
      );
    const confidence = calculateTopicAssignmentConfidence(
      assignments,
      themesArtifact.content.themes.length,
      unassignedThemes.length,
    );
    const content: TopicAssignmentArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      filing_id: context.input.filing_id,
      registry_version: registryArtifact.content.registry_version,
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
      builder_result: {
        content,
        confidence: confidence.overall,
      },
      topic_signals: themeEvaluations.map((evaluation) => ({
        execution_context: {
          company_id: context.input.company_id,
          period_id: context.input.period_id,
          filing_id: context.input.filing_id,
          execution_id: context.executionId,
        },
        theme: {
          theme_id: evaluation.theme_id,
          theme_title: evaluation.theme_title,
        },
        evaluation: {
          candidates: evaluation.candidates,
        },
        final_result: {
          assignment_status: evaluation.assignment_status,
          final_assignments: evaluation.final_assignments,
        },
        registry_context: {
          registry_version: registryArtifact.content.registry_version,
        },
        execution_metadata: {
          embedding_model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
          generated_at: options.generatedAt,
        },
      })),
    };
  }
}

function buildThemeEmbeddingInput(
  theme: {
    title: string;
    category: string;
    summary: string;
  },
): string {
  return [
    `Theme: ${theme.title}`,
    `Category: ${theme.category}`,
    `Summary: ${theme.summary}`,
  ].join("\n");
}

function buildTopicEmbeddingInput(topic: TopicRegistryEntry): string {
  return [
    `Topic: ${topic.canonical_name}`,
    `Definition: ${topic.definition}`,
    `Aliases: ${topic.aliases.join(", ")}`,
    `Examples: ${topic.examples.join(", ")}`,
  ].join("\n");
}
