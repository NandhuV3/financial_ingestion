import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildAccountingConfidence } from "./confidence.js";
import { ACCOUNTING_STABILITY_BUILDER_TYPE } from "./contract.js";
import { buildCoverageAndDepth } from "./coverage.js";
import { resolveAccountingDependencies } from "./dependencies.js";
import { buildNonGAAPAnalysis } from "./non-gaap.js";
import { buildPolicyChanges } from "./policy-changes.js";
import { buildAccountingReplayability } from "./replayability.js";
import { buildRestatements } from "./restatements.js";
import { buildSegmentChanges } from "./segment-changes.js";
import { buildAccountingSummary } from "./summary.js";
import { buildAccountingTimeline } from "./timeline.js";
import type {
  AccountingStabilityArtifactContent,
  AccountingStabilityBuilderInput,
} from "./types.js";
import {
  validateAccountingBuilderInput,
  validateAccountingContent,
  validateAccountingSourceArtifact,
} from "./validator.js";

export class AccountingStabilityBuilder implements Builder<
  AccountingStabilityBuilderInput,
  AccountingStabilityArtifactContent
> {
  builderType(): string {
    return ACCOUNTING_STABILITY_BUILDER_TYPE;
  }

  async validateInput(input: AccountingStabilityBuilderInput): Promise<void> {
    validateAccountingBuilderInput(input);
  }

  async execute(
    context: BuilderContext<AccountingStabilityBuilderInput>,
  ): Promise<BuilderResult<AccountingStabilityArtifactContent>> {
    const dependencies = resolveAccountingDependencies(context);
    for (const source of dependencies.sources) {
      validateAccountingSourceArtifact(
        source.artifact,
        source.declaration.dependency_name,
      );
    }

    const { coverage, depth } = buildCoverageAndDepth(dependencies);
    const policyChanges = buildPolicyChanges(dependencies);
    const segmentChanges = buildSegmentChanges(dependencies);
    const nonGaapAnalysis = buildNonGAAPAnalysis(dependencies);
    const restatements = buildRestatements(dependencies);
    const content: AccountingStabilityArtifactContent = {
      artifact_type: "accounting_stability",
      company: context.input.company_id,
      period: context.input.period_id,
      policy_changes: policyChanges,
      segment_changes: segmentChanges,
      non_gaap_analysis: nonGaapAnalysis,
      restatements,
      accounting_timeline: buildAccountingTimeline({
        dependencies,
        policyChanges,
        segmentChanges,
        restatements,
      }),
      summary: buildAccountingSummary({
        policyChanges,
        segmentChanges,
        restatements,
        nonGaapAnalysis,
      }),
      coverage_status: coverage,
      depth_indicator: depth,
      confidence: buildAccountingConfidence({ dependencies, depth }),
      replayability_metadata: buildAccountingReplayability({
        builderInput: context.input,
        dependencies,
        policyChanges,
        segmentChanges,
        nonGaapAnalysis,
        restatements,
      }),
    };

    validateAccountingContent(content);
    return { content };
  }
}
