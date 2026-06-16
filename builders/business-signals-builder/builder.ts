import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import { BUSINESS_SIGNALS_BUILDER_TYPE } from "./contract.js";
import { buildDurableSignals } from "./durable-signals.js";
import { buildDepthIndicator, buildEnrichmentStatus } from "./enrichment.js";
import { buildMovementSignals } from "./movement-signals.js";
import { buildSignalSummary } from "./signal-summary.js";
import { buildTrendSignals } from "./trend-signals.js";
import type {
  BusinessSignalsArtifactContent,
  BusinessSignalsBuilderInput,
  QuarterChangeArtifactContent,
  SignalBuildContext,
  TopicEvolutionArtifactContent,
} from "./types.js";
import {
  optionalDependency,
  requireDependency,
  validateBusinessSignalsArtifactContent,
  validateBusinessSignalsBuilderInput,
} from "./validator.js";

export class BusinessSignalsBuilder implements Builder<
  BusinessSignalsBuilderInput,
  BusinessSignalsArtifactContent
> {
  builderType(): string {
    return BUSINESS_SIGNALS_BUILDER_TYPE;
  }

  async validateInput(input: BusinessSignalsBuilderInput): Promise<void> {
    validateBusinessSignalsBuilderInput(input);
  }

  async execute(
    context: BuilderContext<BusinessSignalsBuilderInput>,
  ): Promise<BuilderResult<BusinessSignalsArtifactContent>> {
    const companyKnowledgeArtifact = requireDependency<CompanyKnowledgeArtifactContent>(
      context.dependencies.company_knowledge,
      "company_knowledge",
      "company_knowledge",
    );
    const quarterChangeArtifact = optionalDependency<QuarterChangeArtifactContent>(
      context.dependencies.quarter_change,
      "quarter_change",
      "quarter_change",
    );
    const topicEvolutionArtifact = optionalDependency<TopicEvolutionArtifactContent>(
      context.dependencies.topic_evolution,
      "topic_evolution",
      "topic_evolution",
    );
    const signalContext: SignalBuildContext = {
      companyId: context.input.company_id,
      periodId: context.input.period_id,
      companyKnowledgeArtifact,
      quarterChangeArtifact,
      topicEvolutionArtifact,
    };
    const enrichmentStatus = buildEnrichmentStatus({
      quarter_change: context.dependencies.quarter_change,
      topic_evolution: context.dependencies.topic_evolution,
      transcript_signals: context.dependencies.transcript_signals,
      market_context: context.dependencies.market_context,
      industry_context: context.dependencies.industry_context,
    });
    const content: BusinessSignalsArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      signals: [
        ...buildDurableSignals(signalContext),
        ...buildMovementSignals(signalContext),
        ...buildTrendSignals(signalContext),
      ],
      enrichment_status: enrichmentStatus,
      depth_indicator: buildDepthIndicator(enrichmentStatus),
      signal_summary: buildSignalSummary([]),
    };
    content.signal_summary = buildSignalSummary(content.signals);

    validateBusinessSignalsArtifactContent(content);

    return {
      content,
    };
  }
}

