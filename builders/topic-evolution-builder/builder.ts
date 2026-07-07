import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { calculateTopicEvolutionConfidence } from "./confidence.js";
import { TOPIC_EVOLUTION_BUILDER_TYPE } from "./contract.js";
import { buildTopicEvolutions } from "./evolution.js";
import type {
  TopicEvolutionArtifactContent,
  TopicEvolutionBuilderInput,
} from "./types.js";
import {
  buildTopicObservations,
  resolveTopicEvolutionDependencies,
  validateTopicEvolutionArtifactContent,
  validateTopicEvolutionBuilderInput,
} from "./validator.js";

export class TopicEvolutionBuilder implements Builder<
  TopicEvolutionBuilderInput,
  TopicEvolutionArtifactContent
> {
  builderType(): string {
    return TOPIC_EVOLUTION_BUILDER_TYPE;
  }

  async validateInput(input: TopicEvolutionBuilderInput): Promise<void> {
    validateTopicEvolutionBuilderInput(input);
  }

  async execute(
    context: BuilderContext<TopicEvolutionBuilderInput>,
  ): Promise<BuilderResult<TopicEvolutionArtifactContent>> {
    const dependencies = resolveTopicEvolutionDependencies(
      context.dependencies,
      context.input,
    );
    if (context.input.historical_periods.length === 0) {
      const content: TopicEvolutionArtifactContent = {
        company_id: context.input.company_id,
        period_id: context.input.period_id,
        filing_id: context.input.filing_id,
        assignment_version:
          dependencies.current_topic_assignments.metadata.schema_version,
        registry_versions: [
          dependencies.current_topic_assignments.content.registry_version,
        ],
        history: {
          history_state: "FIRST_FILING",
          reason: "FIRST_FILING",
          requires_previous_period: true,
          comparison_performed: false,
        },
        topics: [],
        confidence: {
          overall: 0,
        },
      };

      validateTopicEvolutionArtifactContent(
        content,
        context.input,
        dependencies,
      );

      return {
        content,
        confidence: content.confidence.overall,
      };
    }

    const topicEvolutions = buildTopicEvolutions(
      dependencies.historical_topic_assignments.map(({ content }) =>
        content.period_id),
      dependencies.current_topic_assignments.content.period_id,
      dependencies.historical_topic_assignments.map((artifact) =>
        buildTopicObservations(artifact)),
      buildTopicObservations(dependencies.current_topic_assignments),
    );
    const content: TopicEvolutionArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      filing_id: context.input.filing_id,
      assignment_version:
        dependencies.current_topic_assignments.metadata.schema_version,
      registry_versions: registryVersions(dependencies),
      history: {
        history_state: "HISTORY_AVAILABLE",
        reason: null,
        requires_previous_period: true,
        comparison_performed: true,
      },
      topics: topicEvolutions,
      confidence: calculateTopicEvolutionConfidence(topicEvolutions),
    };

    validateTopicEvolutionArtifactContent(
      content,
      context.input,
      dependencies,
    );

    return {
      content,
      confidence: content.confidence.overall,
    };
  }
}

function registryVersions(dependencies: {
  current_topic_assignments: {
    content: {
      registry_version: number;
    };
  };
  historical_topic_assignments: Array<{
    content: {
      registry_version: number;
    };
  }>;
}): number[] {
  return [
    ...new Set([
      dependencies.current_topic_assignments.content.registry_version,
      ...dependencies.historical_topic_assignments.map(({ content }) =>
        content.registry_version),
    ]),
  ].sort((left, right) => left - right);
}
