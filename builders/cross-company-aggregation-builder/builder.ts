import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { BuilderValidationError } from "../../packages/builder-framework/src/builder-errors.js";
import {
  buildAggregationResultContent,
  buildTopicSignalExecutionReferences,
} from "./aggregator.js";
import { CROSS_COMPANY_AGGREGATION_BUILDER_TYPE } from "./contract.js";
import type {
  CrossCompanyAggregationBuilderInput,
  CrossCompanyAggregationBuilderOutput,
} from "./types.js";
import {
  validateAggregationResultArtifactContent,
  validateCrossCompanyAggregationBuilderInput,
} from "./validator.js";

export class CrossCompanyAggregationBuilder implements Builder<
  CrossCompanyAggregationBuilderInput,
  CrossCompanyAggregationBuilderOutput
> {
  builderType(): string {
    return CROSS_COMPANY_AGGREGATION_BUILDER_TYPE;
  }

  async validateInput(
    input: CrossCompanyAggregationBuilderInput,
  ): Promise<void> {
    validateCrossCompanyAggregationBuilderInput(input);
  }

  async execute(
    context: BuilderContext<CrossCompanyAggregationBuilderInput>,
  ): Promise<BuilderResult<CrossCompanyAggregationBuilderOutput>> {
    if (Object.keys(context.dependencies).length > 0) {
      throw new BuilderValidationError(
        "Cross-Company Aggregation must not consume Builder Framework dependencies.",
      );
    }

    const content = buildAggregationResultContent({
      topicSignals: context.input.topic_signals,
      aggregationConfigurationVersion:
        context.input.aggregation_configuration_version,
    });

    validateAggregationResultArtifactContent(content, context.input);

    return {
      content,
      confidence: 1,
      execution_references: buildTopicSignalExecutionReferences(
        context.input.topic_signals,
      ),
    };
  }
}
