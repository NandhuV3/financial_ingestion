import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { buildAccountingSignals } from "./accounting-signals.js";
import { buildCapitalAllocationSignals } from "./capital-allocation-signals.js";
import { buildCommitmentSignals } from "./commitment-signals.js";
import { TRUST_SIGNALS_BUILDER_TYPE } from "./contract.js";
import {
  buildMissingDimensions,
  buildTrustDepthIndicator,
  buildTrustEnrichmentStatus,
} from "./enrichment.js";
import { buildNarrativeSignals } from "./narrative-signals.js";
import { buildTrustSignalsReplayability } from "./replayability.js";
import {
  buildTrustSignalConfidence,
  buildTrustSignalSummary,
  buildTrustSignalsEvaluationHooks,
} from "./signal-summary.js";
import type {
  AccountingStabilityArtifactContent,
  CapitalAllocationTrackingArtifactContent,
  CommitmentTrackingArtifactContent,
  NarrativeConsistencyArtifactContent,
  TrustSignalBuildContext,
  TrustSignalsArtifactContent,
  TrustSignalsBuilderInput,
} from "./types.js";
import {
  optionalPillarDependency,
  validateAtLeastOnePillar,
  validateTrustSignalsArtifactContent,
  validateTrustSignalsBuilderInput,
} from "./validator.js";

export class TrustSignalsBuilder implements Builder<
  TrustSignalsBuilderInput,
  TrustSignalsArtifactContent
> {
  builderType(): string {
    return TRUST_SIGNALS_BUILDER_TYPE;
  }

  async validateInput(input: TrustSignalsBuilderInput): Promise<void> {
    validateTrustSignalsBuilderInput(input);
  }

  async execute(
    context: BuilderContext<TrustSignalsBuilderInput>,
  ): Promise<BuilderResult<TrustSignalsArtifactContent>> {
    validateAtLeastOnePillar(context.dependencies);

    const commitmentTrackingArtifact = optionalPillarDependency<CommitmentTrackingArtifactContent>(
      context.dependencies.commitment_tracking,
      "commitment_tracking",
      "commitment_tracking",
      context.input.company_id,
      context.input.period_id,
    );
    const narrativeConsistencyArtifact = optionalPillarDependency<NarrativeConsistencyArtifactContent>(
      context.dependencies.narrative_consistency,
      "narrative_consistency",
      "narrative_consistency",
      context.input.company_id,
      context.input.period_id,
    );
    const accountingStabilityArtifact = optionalPillarDependency<AccountingStabilityArtifactContent>(
      context.dependencies.accounting_stability,
      "accounting_stability",
      "accounting_stability",
      context.input.company_id,
      context.input.period_id,
    );
    const capitalAllocationTrackingArtifact = optionalPillarDependency<CapitalAllocationTrackingArtifactContent>(
      context.dependencies.capital_allocation_tracking,
      "capital_allocation_tracking",
      "capital_allocation_tracking",
      context.input.company_id,
      context.input.period_id,
    );
    const buildContext: TrustSignalBuildContext = {
      companyId: context.input.company_id,
      periodId: context.input.period_id,
      commitmentTrackingArtifact,
      narrativeConsistencyArtifact,
      accountingStabilityArtifact,
      capitalAllocationTrackingArtifact,
    };
    const trustSignals = [
      ...buildCommitmentSignals(buildContext),
      ...buildNarrativeSignals(buildContext),
      ...buildAccountingSignals(buildContext),
      ...buildCapitalAllocationSignals(buildContext),
    ].sort((left, right) => left.signal_id.localeCompare(right.signal_id));
    const enrichmentStatus = buildTrustEnrichmentStatus({
      commitment_tracking: context.dependencies.commitment_tracking,
      narrative_consistency: context.dependencies.narrative_consistency,
      accounting_stability: context.dependencies.accounting_stability,
      capital_allocation_tracking: context.dependencies.capital_allocation_tracking,
    });
    const missingDimensions = buildMissingDimensions(enrichmentStatus);
    const depthIndicator = buildTrustDepthIndicator(enrichmentStatus);
    const evaluationHooks = buildTrustSignalsEvaluationHooks({
      signals: trustSignals,
      enrichmentStatus,
      missingDimensionCount: missingDimensions.length,
    });
    const content: TrustSignalsArtifactContent = {
      artifact_type: "trust_signals",
      company: context.input.company_id,
      period: context.input.period_id,
      trust_signals: trustSignals,
      summary: buildTrustSignalSummary(trustSignals),
      confidence: buildTrustSignalConfidence(trustSignals, enrichmentStatus),
      enrichment_status: enrichmentStatus,
      depth_indicator: depthIndicator,
      missing_dimensions: missingDimensions,
      evaluation_hooks: evaluationHooks,
      replayability_metadata: buildTrustSignalsReplayability({
        generatedAt: context.input.generated_at,
        signals: trustSignals,
        enrichmentStatus,
        depthIndicator,
        evaluationHooks,
      }),
    };

    validateTrustSignalsArtifactContent(content);

    return {
      content,
    };
  }
}
