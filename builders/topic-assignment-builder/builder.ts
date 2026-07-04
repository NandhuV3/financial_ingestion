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
import type {
  EmbeddingExecutionRecord,
} from "../../contracts/execution/embedding-execution-record.js";
import type {
  EmbeddingResolverReader,
  EmbeddingResolutionMode,
} from "../../contracts/execution/embedding-resolver-contract.js";
import {
  EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
  type ExecutionRecordReference,
} from "../../contracts/framework/execution-record-reference.js";
import { buildTopicAssignmentExecution } from "./assignment.js";
import { calculateTopicAssignmentConfidence } from "./confidence.js";
import { TOPIC_ASSIGNMENT_BUILDER_TYPE } from "./contract.js";
import { TOPIC_ASSIGNMENT_EMBEDDING_MODEL } from "./contract.js";
import type {
  TopicAssignmentBuilderInput,
  TopicRegistryEntry,
} from "./types.js";
import { stableHash } from "../../src/shared/hashing/stable-hash.js";
import {
  requireThemesDependency,
  requireTopicRegistryDependency,
  validateTopicAssignmentDependencies,
  validateTopicAssignmentArtifactContent,
  validateTopicAssignmentBuilderInput,
} from "./validator.js";

const TOPIC_ASSIGNMENT_THEME_EMBEDDING_SOURCE_TYPE =
  "topic_assignment_theme";
const TOPIC_ASSIGNMENT_TOPIC_EMBEDDING_SOURCE_TYPE =
  "topic_assignment_topic";

export class TopicAssignmentBuilder implements Builder<
  TopicAssignmentBuilderInput,
  TopicAssignmentArtifactContent
> {
  constructor(
    private readonly embeddingResolver: EmbeddingResolverReader,
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
    const embeddingExecutionMode =
      context.input.embedding_execution_mode ?? "ORIGINAL_EXECUTION";
    const topicSignalExecutionContext =
      topicSignalExecutionContextFor(context, options.generatedAt);
    const themeEmbeddingRecords: EmbeddingExecutionRecord[] = [];

    for (const theme of orderedThemes) {
      themeEmbeddingRecords.push(await this.resolveEmbeddingRecord({
        executionMode: embeddingExecutionMode,
        sourceType: TOPIC_ASSIGNMENT_THEME_EMBEDDING_SOURCE_TYPE,
        sourceId: theme.theme_id,
        sourceText: buildThemeEmbeddingInput(theme),
      }));
    }

    const topicEmbeddingRecords: EmbeddingExecutionRecord[] = [];

    for (const topic of orderedTopics) {
      topicEmbeddingRecords.push(await this.resolveEmbeddingRecord({
        executionMode: embeddingExecutionMode,
        sourceType: TOPIC_ASSIGNMENT_TOPIC_EMBEDDING_SOURCE_TYPE,
        sourceId: topic.topic_id,
        sourceText: buildTopicEmbeddingInput(topic),
      }));
    }

    context.recordModelReference({
      provider: "semantic-embedding",
      model_name: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      temperature: 0,
    });

    const { assignments, unassignedThemes, themeEvaluations } =
      buildTopicAssignmentExecution(
        orderedThemes,
        orderedTopics,
        orderedThemes.map((theme, index) => ({
          theme_id: theme.theme_id,
          embedding: themeEmbeddingRecords[index]?.embedding.vector ?? [],
          embedding_record_id: themeEmbeddingRecords[index]?.record_id ?? "",
        })),
        orderedTopics.map((topic, index) => ({
          topic_id: topic.topic_id,
          embedding: topicEmbeddingRecords[index]?.embedding.vector ?? [],
          embedding_record_id: topicEmbeddingRecords[index]?.record_id ?? "",
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
        execution_references: embeddingExecutionReferences([
          ...themeEmbeddingRecords,
          ...topicEmbeddingRecords,
        ]),
      },
      topic_signals: themeEvaluations.map((evaluation) => ({
        execution_context: {
          company_id: context.input.company_id,
          period_id: context.input.period_id,
          filing_id: context.input.filing_id,
          execution_id: topicSignalExecutionContext.execution_id,
        },
        execution_references: embeddingExecutionReferencesForTheme(
          evaluation.theme_id,
          themeEmbeddingRecords,
          orderedThemes,
          topicEmbeddingRecords,
        ),
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
          generated_at: topicSignalExecutionContext.generated_at,
        },
      })),
    };
  }

  private async resolveEmbeddingRecord(input: {
    executionMode: EmbeddingResolutionMode;
    sourceType: string;
    sourceId: string;
    sourceText: string;
  }): Promise<EmbeddingExecutionRecord> {
    const record = await this.embeddingResolver.resolve({
      execution_mode: input.executionMode,
      source_type: input.sourceType,
      source_id: input.sourceId,
      source_hash: stableHash(input.sourceText),
      embedding_model: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      embedding_model_version: TOPIC_ASSIGNMENT_EMBEDDING_MODEL,
      source_text: input.sourceText,
    });

    if (
      !Array.isArray(record.embedding.vector)
        || record.embedding.vector.length === 0
        || record.embedding.vector.some((value) => !Number.isFinite(value))
    ) {
      throw new BuilderValidationError(
        "Embedding Resolver returned invalid Topic Assignment embedding vector.",
      );
    }

    return record;
  }
}

function topicSignalExecutionContextFor(
  context: BuilderContext<TopicAssignmentBuilderInput>,
  generatedAt: string,
): {
  execution_id: string;
  generated_at: string;
} {
  if (context.input.embedding_execution_mode === "REPLAY") {
    const originalContext = context.input.replay_original_execution_context;

    if (originalContext === undefined) {
      throw new BuilderValidationError(
        "Topic Assignment replay requires original execution context.",
      );
    }

    return {
      execution_id: originalContext.execution_id,
      generated_at: originalContext.generated_at,
    };
  }

  return {
    execution_id: context.executionId,
    generated_at: generatedAt,
  };
}

function embeddingExecutionReferencesForTheme(
  themeId: string,
  themeEmbeddingRecords: EmbeddingExecutionRecord[],
  orderedThemes: Array<{ theme_id: string }>,
  topicEmbeddingRecords: EmbeddingExecutionRecord[],
): ExecutionRecordReference[] {
  const themeIndex = orderedThemes.findIndex((theme) =>
    theme.theme_id === themeId);
  const themeRecord = themeEmbeddingRecords[themeIndex];

  if (themeRecord === undefined) {
    throw new BuilderValidationError(
      `Missing embedding execution record for theme ${themeId}.`,
    );
  }

  return [
    embeddingExecutionReference(themeRecord),
    ...topicEmbeddingRecords.map(embeddingExecutionReference),
  ];
}

function embeddingExecutionReferences(
  records: EmbeddingExecutionRecord[],
): ExecutionRecordReference[] {
  return records.map(embeddingExecutionReference);
}

function embeddingExecutionReference(
  record: EmbeddingExecutionRecord,
): ExecutionRecordReference {
  return {
    schema_version: EXECUTION_RECORD_REFERENCE_SCHEMA_VERSION,
    record_type: "embedding_execution_record",
    record_id: record.record_id,
    record_hash: record.record_hash,
    producer: record.producer,
    execution_id: record.execution_id,
  };
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
