import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildTopicCandidateContent } from "./candidate-discovery.js";
import { CANDIDATE_DISCOVERY_BUILDER_TYPE } from "./contract.js";
import type {
  CandidateDiscoveryBuilderInput,
  CandidateDiscoveryBuilderOutput,
} from "./types.js";
import {
  resolveAggregationResultDependency,
  validateCandidateDiscoveryBuilderInput,
  validateCandidateDiscoveryTarget,
  validateTopicCandidateArtifactContent,
} from "./validator.js";

export class CandidateDiscoveryBuilder implements Builder<
  CandidateDiscoveryBuilderInput,
  CandidateDiscoveryBuilderOutput
> {
  builderType(): string {
    return CANDIDATE_DISCOVERY_BUILDER_TYPE;
  }

  async validateInput(
    input: CandidateDiscoveryBuilderInput,
  ): Promise<void> {
    validateCandidateDiscoveryBuilderInput(input);
  }

  async execute(
    context: BuilderContext<CandidateDiscoveryBuilderInput>,
  ): Promise<BuilderResult<CandidateDiscoveryBuilderOutput>> {
    const aggregationResult = resolveAggregationResultDependency(
      context.dependencies,
    );
    validateCandidateDiscoveryTarget(context.input, aggregationResult.content);

    const content = buildTopicCandidateContent(
      aggregationResult.content,
      context.input,
    );

    validateTopicCandidateArtifactContent(
      content,
      aggregationResult.content,
      context.input,
    );

    return {
      content,
      confidence: 1,
    };
  }
}
