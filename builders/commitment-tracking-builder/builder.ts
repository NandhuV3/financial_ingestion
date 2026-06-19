import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildConfidence } from "./confidence.js";
import { COMMITMENT_TRACKING_BUILDER_TYPE } from "./contract.js";
import { buildCoverage, buildDepthIndicator } from "./coverage.js";
import { resolveCommitmentTrackingDependencies } from "./dependencies.js";
import { buildCommitments } from "./lifecycle.js";
import { buildReplayabilityMetadata } from "./replayability.js";
import { buildCommitmentSummary } from "./summary.js";
import type {
  CommitmentTrackingArtifactContent,
  CommitmentTrackingBuilderInput,
} from "./types.js";
import {
  validateCommitmentSourceArtifact,
  validateCommitmentTrackingArtifactContent,
  validateCommitmentTrackingBuilderInput,
} from "./validator.js";

export class CommitmentTrackingBuilder implements Builder<
  CommitmentTrackingBuilderInput,
  CommitmentTrackingArtifactContent
> {
  builderType(): string {
    return COMMITMENT_TRACKING_BUILDER_TYPE;
  }

  async validateInput(input: CommitmentTrackingBuilderInput): Promise<void> {
    validateCommitmentTrackingBuilderInput(input);
  }

  async execute(
    context: BuilderContext<CommitmentTrackingBuilderInput>,
  ): Promise<BuilderResult<CommitmentTrackingArtifactContent>> {
    const dependencies = resolveCommitmentTrackingDependencies(context);

    for (const source of dependencies.sources) {
      validateCommitmentSourceArtifact(source.artifact, source.declaration.dependency_name);
    }

    const commitments = buildCommitments(
      dependencies.sources,
      dependencies.prior?.content.commitments ?? [],
      context.input.period_id,
    );
    const coverage = buildCoverage(dependencies, context.input.period_id);
    const depthIndicator = buildDepthIndicator(dependencies, context.input.period_id);
    const content: CommitmentTrackingArtifactContent = {
      artifact_type: "commitment_tracking",
      company: context.input.company_id,
      period: context.input.period_id,
      commitments,
      summary: buildCommitmentSummary(commitments),
      coverage,
      depth_indicator: depthIndicator,
      confidence: buildConfidence(dependencies.sources, depthIndicator),
      replayability_metadata: buildReplayabilityMetadata(
        context.input,
        dependencies,
        commitments,
      ),
    };

    validateCommitmentTrackingArtifactContent(content);

    return {
      content,
    };
  }
}
