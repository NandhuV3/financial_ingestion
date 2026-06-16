import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import {
  buildQuarterUnderstandingConfidence,
  buildQuarterUnderstandingEvaluationHooks,
} from "./confidence.js";
import { QUARTER_UNDERSTANDING_BUILDER_TYPE } from "./contract.js";
import {
  buildQuarterUnderstandingDepthIndicator,
  buildQuarterUnderstandingEnrichmentStatus,
} from "./enrichment.js";
import { buildUnderstandings } from "./understanding-engine.js";
import type {
  ConceptRegistryContent,
  QuarterUnderstandingArtifactContent,
  QuarterUnderstandingBuildContext,
  QuarterUnderstandingBuilderInput,
} from "./types.js";
import {
  optionalDependency,
  rejectForbiddenDependencies,
  requireDependency,
  validateQuarterUnderstandingArtifactContent,
  validateQuarterUnderstandingBuilderInput,
} from "./validator.js";

export class QuarterUnderstandingBuilder implements Builder<
  QuarterUnderstandingBuilderInput,
  QuarterUnderstandingArtifactContent
> {
  builderType(): string {
    return QUARTER_UNDERSTANDING_BUILDER_TYPE;
  }

  async validateInput(input: QuarterUnderstandingBuilderInput): Promise<void> {
    validateQuarterUnderstandingBuilderInput(input);
  }

  async execute(
    context: BuilderContext<QuarterUnderstandingBuilderInput>,
  ): Promise<BuilderResult<QuarterUnderstandingArtifactContent>> {
    rejectForbiddenDependencies(context.dependencies);

    const companyKnowledgeArtifact = requireDependency<CompanyKnowledgeArtifactContent>(
      context.dependencies.company_knowledge,
      "company_knowledge",
      "company_knowledge",
    );
    const businessSignalsArtifact = requireDependency<BusinessSignalsArtifactContent>(
      context.dependencies.business_signals,
      "business_signals",
      "business_signals",
    );
    const trustSignalsArtifact = optionalDependency<TrustSignalsArtifactContent>(
      context.dependencies.trust_signals,
      "trust_signals",
      "trust_signals",
    );
    const topicEvolutionArtifact = optionalDependency<TopicEvolutionArtifactContent>(
      context.dependencies.topic_evolution,
      "topic_evolution",
      "topic_evolution",
    );
    const conceptRegistryArtifact = optionalDependency<ConceptRegistryContent>(
      context.dependencies.concept_registry,
      "concept_registry",
      "concept_registry",
    );
    const buildContext: QuarterUnderstandingBuildContext = {
      companyId: context.input.company_id,
      periodId: context.input.period_id,
      companyKnowledgeArtifact,
      businessSignalsArtifact,
      trustSignalsArtifact,
      topicEvolutionArtifact,
      conceptRegistryArtifact,
    };
    const enrichmentStatus = buildQuarterUnderstandingEnrichmentStatus({
      trust_signals: context.dependencies.trust_signals,
      topic_evolution: context.dependencies.topic_evolution,
      concept_registry: context.dependencies.concept_registry,
    });
    const depthIndicator = buildQuarterUnderstandingDepthIndicator(enrichmentStatus);
    const { understandings, proposed_concepts } = buildUnderstandings(buildContext);
    const content: QuarterUnderstandingArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      understandings,
      proposed_concepts,
      enrichment_status: enrichmentStatus,
      depth_indicator: depthIndicator,
      confidence: buildQuarterUnderstandingConfidence({
        understandings,
        availableSignalCount: businessSignalsArtifact.content.signals.length,
        enrichmentStatus,
      }),
      evaluation_hooks: buildQuarterUnderstandingEvaluationHooks({
        understandings,
        availableSignalCount: businessSignalsArtifact.content.signals.length,
        proposedConceptCount: proposed_concepts.length,
        depth: depthIndicator,
        enrichmentStatus,
      }),
    };

    validateQuarterUnderstandingArtifactContent(content, conceptRegistryArtifact?.content ?? null);

    return {
      content,
    };
  }
}
