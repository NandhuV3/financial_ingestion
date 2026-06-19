import type { ResolvedPrompt } from "../../src/prompt-registry/prompt.types.js";
import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import {
  BuilderExecutionError,
  builderErrorMessage,
} from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { callLLM, type LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import {
  buildQuarterUnderstandingConfidence,
  buildQuarterUnderstandingEvaluationHooks,
} from "./confidence.js";
import {
  QUARTER_UNDERSTANDING_BUILDER_TYPE,
  QUARTER_UNDERSTANDING_MODEL_VERSION,
  QUARTER_UNDERSTANDING_PROMPT_ID,
} from "./contract.js";
import {
  buildQuarterUnderstandingDepthIndicator,
  buildQuarterUnderstandingEnrichmentStatus,
} from "./enrichment.js";
import { buildQuarterUnderstandingLimitations } from "./limitations.js";
import {
  buildQuarterUnderstandingPromptInput,
  buildQuarterUnderstandingUserPrompt,
} from "./prompt-context.js";
import {
  buildQuarterUnderstandingInputHash,
  buildQuarterUnderstandingOutputHash,
  buildQuarterUnderstandingReplayability,
} from "./replayability.js";
import { parseQuarterUnderstandingPromptOutput } from "./response-parser.js";
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

export type QuarterUnderstandingBuilderOptions = {
  promptResolver: Pick<PromptResolver, "resolve">;
  llmClient: LLMClient;
  modelVersion?: string;
};

export class QuarterUnderstandingBuilder implements Builder<
  QuarterUnderstandingBuilderInput,
  QuarterUnderstandingArtifactContent
> {
  constructor(private readonly options: QuarterUnderstandingBuilderOptions) {}

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
      context.input.company_id,
      context.input.period_id,
    );
    const businessSignalsArtifact = requireDependency<BusinessSignalsArtifactContent>(
      context.dependencies.business_signals,
      "business_signals",
      "business_signals",
      context.input.company_id,
      context.input.period_id,
    );
    const trustSignalsArtifact = optionalDependency<TrustSignalsArtifactContent>(
      context.dependencies.trust_signals,
      "trust_signals",
      "trust_signals",
      context.input.company_id,
      context.input.period_id,
    );
    const topicEvolutionArtifact = optionalDependency<TopicEvolutionArtifactContent>(
      context.dependencies.topic_evolution,
      "topic_evolution",
      "topic_evolution",
      context.input.company_id,
      context.input.period_id,
    );
    const conceptRegistryArtifact = optionalDependency<ConceptRegistryContent>(
      context.dependencies.concept_registry,
      "concept_registry",
      "concept_registry",
      context.input.company_id,
      context.input.period_id,
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
    const prompt = resolvePrompt(this.options.promptResolver);
    const modelVersion = this.options.modelVersion
      ?? QUARTER_UNDERSTANDING_MODEL_VERSION;

    context.recordPromptReference({
      prompt_id: prompt.promptId,
      prompt_version: prompt.version,
      activation_id: prompt.activationId ?? "not_active",
    });
    context.recordModelReference({
      provider: "platform-llm",
      model_name: modelVersion,
      model_version: modelVersion,
      temperature: 0,
    });

    const promptInput = buildQuarterUnderstandingPromptInput(buildContext);
    const response = await executeQuarterUnderstandingPrompt({
      prompt,
      userPrompt: buildQuarterUnderstandingUserPrompt(promptInput),
      modelVersion,
      llmClient: this.options.llmClient,
    });
    const { understandings, proposed_concepts } =
      parseQuarterUnderstandingPromptOutput(response.output_text);
    const evaluationHooks = buildQuarterUnderstandingEvaluationHooks({
      understandings,
      availableSignalCount: businessSignalsArtifact.content.signals.length,
      proposedConceptCount: proposed_concepts.length,
      depth: depthIndicator,
      enrichmentStatus,
      promptVersion: prompt.version,
      modelVersion,
    });
    const contentWithoutReplayability: Omit<
      QuarterUnderstandingArtifactContent,
      "replayability_metadata"
    > = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      understandings,
      proposed_concepts,
      enrichment_status: enrichmentStatus,
      depth_indicator: depthIndicator,
      limitations: buildQuarterUnderstandingLimitations(trustSignalsArtifact?.content ?? null),
      confidence: buildQuarterUnderstandingConfidence({
        understandings,
        availableSignalCount: businessSignalsArtifact.content.signals.length,
        enrichmentStatus,
      }),
      evaluation_hooks: evaluationHooks,
    };
    const inputHash = buildQuarterUnderstandingInputHash({
      companyKnowledgeHash: companyKnowledgeArtifact.metadata.artifact_hash,
      businessSignalsHash: businessSignalsArtifact.metadata.artifact_hash,
      trustSignalsHash: trustSignalsArtifact?.metadata.artifact_hash ?? null,
      topicEvolutionHash: topicEvolutionArtifact?.metadata.artifact_hash ?? null,
      conceptRegistryHash: conceptRegistryArtifact?.metadata.artifact_hash ?? null,
    });
    const outputHash =
      buildQuarterUnderstandingOutputHash(contentWithoutReplayability);
    const content: QuarterUnderstandingArtifactContent = {
      ...contentWithoutReplayability,
      replayability_metadata: buildQuarterUnderstandingReplayability({
        prompt,
        modelVersion,
        conceptRegistryVersion:
          conceptRegistryArtifact?.identity.version ?? null,
        inputHash,
        outputHash,
        evaluationHooks,
        evaluationMetadata: {
          prompt_hash: prompt.hash,
          prompt_source: prompt.source,
          activation_id: prompt.activationId,
          token_usage: response.token_usage ?? null,
        },
        enrichmentStatus,
        depthIndicator,
      }),
    };

    validateQuarterUnderstandingArtifactContent(
      content,
      conceptRegistryArtifact?.content ?? null,
      trustSignalsArtifact?.content ?? null,
    );

    return {
      content,
      confidence: content.confidence.overall,
    };
  }
}

function resolvePrompt(
  promptResolver: Pick<PromptResolver, "resolve">,
): ResolvedPrompt {
  try {
    return promptResolver.resolve(QUARTER_UNDERSTANDING_PROMPT_ID);
  } catch (error) {
    throw new BuilderExecutionError(
      `Quarter Understanding prompt resolution failed: ${builderErrorMessage(error)}`,
      error,
    );
  }
}

async function executeQuarterUnderstandingPrompt(params: {
  prompt: ResolvedPrompt;
  userPrompt: string;
  modelVersion: string;
  llmClient: LLMClient;
}) {
  try {
    return await callLLM(params.llmClient, {
      model: params.modelVersion,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: params.prompt.content,
        },
        {
          role: "user",
          content: params.userPrompt,
        },
      ],
    });
  } catch (error) {
    throw new BuilderExecutionError(
      `Quarter Understanding prompt execution failed: ${builderErrorMessage(error)}`,
      error,
    );
  }
}
