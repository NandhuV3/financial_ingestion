import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { calculateTopicEvolutionConfidence } from "./confidence.js";
import {
  TOPIC_EVOLUTION_BUILDER_TYPE,
  TOPIC_EVOLUTION_MINIMUM_PERIODS,
} from "./contract.js";
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
    const periodCount = context.input.historical_periods.length + 1;

    if (periodCount < TOPIC_EVOLUTION_MINIMUM_PERIODS) {
      const content: TopicEvolutionArtifactContent = {
        artifact_type: "topic_evolution",
        company: context.input.company_id,
        period: context.input.period_id,
        status: "insufficient_history",
        topic_evolutions: [],
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

    const prior =
      dependencies.historical_topic_assignments[
        dependencies.historical_topic_assignments.length - 1
      ]!;
    const topicEvolutions = buildTopicEvolutions(
      prior.content.period,
      dependencies.current_topic_assignments.content.period,
      buildTopicObservations(prior),
      buildTopicObservations(dependencies.current_topic_assignments),
    );
    const content: TopicEvolutionArtifactContent = {
      artifact_type: "topic_evolution",
      company: context.input.company_id,
      period: context.input.period_id,
      status: "complete",
      topic_evolutions: topicEvolutions,
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
