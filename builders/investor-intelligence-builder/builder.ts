import type { ResolvedPrompt } from "../../src/prompt-registry/prompt.types.js";
import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderExecutionError, builderErrorMessage } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { callLLM, type LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import type { BusinessSignalsArtifactContent, TopicEvolutionArtifactContent } from "../business-signals-builder/types.js";
import type { CompanyKnowledgeArtifactContent } from "../company-knowledge-builder/types.js";
import type { QuarterUnderstandingArtifactContent } from "../quarter-understanding-builder/types.js";
import type { CommitmentTrackingArtifactContent, TrustSignalsArtifactContent } from "../trust-signals-builder/types.js";
import {
  buildInvestorConfidence,
  buildInvestorEvaluationHooks,
  confidenceForQ2BusinessSignalsAvailability,
  confidenceForQ3TrustDepth,
  confidenceForQ4DeferredValuation,
  confidenceFromQuestionInputs,
  confidenceLevelFromCompanyKnowledgeScore,
} from "./confidence.js";
import {
  INVESTOR_INTELLIGENCE_BUILDER_TYPE,
  INVESTOR_INTELLIGENCE_MODEL_VERSION,
  INVESTOR_Q1_PROMPT_ID,
  INVESTOR_Q2_PROMPT_ID,
  INVESTOR_Q3_PROMPT_ID,
  INVESTOR_Q4_PROMPT_ID,
  INVESTOR_Q5_PROMPT_ID,
} from "./contract.js";
import { buildInvestorDepthIndicator, buildInvestorEnrichmentStatus } from "./enrichment.js";
import { stableHash } from "./hashes.js";
import { buildQ1PromptInput, buildQ1UserPrompt, parseQ1PromptOutput } from "./q1-business.js";
import { buildQ2PromptInput, buildQ2UserPrompt, parseQ2PromptOutput } from "./q2-money.js";
import { buildQ3PromptInput, buildQ3UserPrompt, parseQ3PromptOutput } from "./q3-trust.js";
import { buildQ4PromptInput, buildQ4UserPrompt, parseQ4PromptOutput } from "./q4-price.js";
import { buildQ5PromptInput, buildQ5UserPrompt, parseQ5PromptOutput } from "./q5-reason.js";
import type {
  InvestorIntelligenceArtifactContent,
  InvestorIntelligenceBuildContext,
  InvestorIntelligenceBuilderInput,
  PromptLineage,
  Q1Business,
  Q2Money,
  Q3Trust,
  Q4Price,
  Q5Reason,
} from "./types.js";
import {
  optionalDependency,
  rejectForbiddenDependencies,
  requireDependency,
  validateInvestorIntelligenceArtifactContent,
  validateInvestorIntelligenceBuilderInput,
  validateTrustSignalsFallbackRule,
} from "./validator.js";

export type InvestorIntelligenceBuilderOptions = {
  promptResolver: Pick<PromptResolver, "resolve">;
  llmClient: LLMClient;
  modelVersion?: string;
};

export class InvestorIntelligenceBuilder implements Builder<
  InvestorIntelligenceBuilderInput,
  InvestorIntelligenceArtifactContent
> {
  constructor(private readonly options: InvestorIntelligenceBuilderOptions) {}

  builderType(): string {
    return INVESTOR_INTELLIGENCE_BUILDER_TYPE;
  }

  async validateInput(input: InvestorIntelligenceBuilderInput): Promise<void> {
    validateInvestorIntelligenceBuilderInput(input);
  }

  async execute(
    context: BuilderContext<InvestorIntelligenceBuilderInput>,
  ): Promise<BuilderResult<InvestorIntelligenceArtifactContent>> {
    rejectForbiddenDependencies(context.dependencies);

    const companyKnowledgeArtifact = requireDependency<CompanyKnowledgeArtifactContent>(
      context.dependencies.company_knowledge,
      "company_knowledge",
      "company_knowledge",
    );
    const quarterUnderstandingArtifact = requireDependency<QuarterUnderstandingArtifactContent>(
      context.dependencies.quarter_understanding,
      "quarter_understanding",
      "quarter_understanding",
    );
    const businessSignalsArtifact = optionalDependency<BusinessSignalsArtifactContent>(
      context.dependencies.business_signals,
      "business_signals",
      "business_signals",
    );
    const trustSignalsArtifact = optionalDependency<TrustSignalsArtifactContent>(
      context.dependencies.trust_signals,
      "trust_signals",
      "trust_signals",
    );
    const commitmentTrackingArtifact = optionalDependency<CommitmentTrackingArtifactContent>(
      context.dependencies.commitment_tracking,
      "commitment_tracking",
      "commitment_tracking",
    );
    const topicEvolutionArtifact = optionalDependency<TopicEvolutionArtifactContent>(
      context.dependencies.topic_evolution,
      "topic_evolution",
      "topic_evolution",
    );
    const priorInvestorIntelligenceArtifact = optionalDependency<InvestorIntelligenceArtifactContent>(
      context.dependencies.prior_investor_intelligence,
      "prior_investor_intelligence",
      "investor_intelligence",
    );
    const marketDataArtifact = context.dependencies.market_data ?? null;

    validateTrustSignalsFallbackRule({
      trustSignalsPresent: trustSignalsArtifact !== null,
      trustDimension: quarterUnderstandingArtifact.content.depth_indicator.trust_dimension,
    });

    const buildContext: InvestorIntelligenceBuildContext = {
      companyId: context.input.company_id,
      periodId: context.input.period_id,
      companyKnowledgeArtifact,
      quarterUnderstandingArtifact,
      businessSignalsArtifact,
      trustSignalsArtifact,
      commitmentTrackingArtifact,
      topicEvolutionArtifact,
      priorInvestorIntelligenceArtifact,
      marketDataArtifact,
    };
    const enrichmentStatus = buildInvestorEnrichmentStatus({
      business_signals: context.dependencies.business_signals,
      trust_signals: context.dependencies.trust_signals,
      commitment_tracking: context.dependencies.commitment_tracking,
      topic_evolution: context.dependencies.topic_evolution,
      prior_investor_intelligence: context.dependencies.prior_investor_intelligence,
      market_data: context.dependencies.market_data,
    });
    const depthIndicator = buildInvestorDepthIndicator(
      enrichmentStatus,
      quarterUnderstandingArtifact.content.depth_indicator,
    );
    const modelVersion = this.options.modelVersion ?? INVESTOR_INTELLIGENCE_MODEL_VERSION;
    const q1Prompt = this.options.promptResolver.resolve(INVESTOR_Q1_PROMPT_ID);
    const q2Prompt = this.options.promptResolver.resolve(INVESTOR_Q2_PROMPT_ID);
    const q3Prompt = this.options.promptResolver.resolve(INVESTOR_Q3_PROMPT_ID);
    const q4Prompt = this.options.promptResolver.resolve(INVESTOR_Q4_PROMPT_ID);
    const q5Prompt = this.options.promptResolver.resolve(INVESTOR_Q5_PROMPT_ID);

    context.recordPromptReference({
      prompt_id: q5Prompt.promptId,
      prompt_version: q5Prompt.version,
      activation_id: q5Prompt.activationId ?? "not_active",
    });
    context.recordModelReference({
      provider: "platform-llm",
      model_name: modelVersion,
      model_version: modelVersion,
      temperature: 0,
    });

    const q1Input = buildQ1PromptInput(buildContext);
    const q1PromptOutput = parseQ1PromptOutput(await executeQuestionPrompt({
      prompt: q1Prompt,
      userPrompt: buildQ1UserPrompt(q1Input),
      modelVersion,
      llmClient: this.options.llmClient,
      question: "Q1",
    }));
    const q1: Q1Business = {
      ...q1PromptOutput,
      confidence: confidenceLevelFromCompanyKnowledgeScore(companyKnowledgeArtifact.content.confidence.overall),
      depth_indicator: depthIndicator,
    };

    const q2Input = buildQ2PromptInput(buildContext);
    const q2PromptOutput = parseQ2PromptOutput(await executeQuestionPrompt({
      prompt: q2Prompt,
      userPrompt: buildQ2UserPrompt(q2Input),
      modelVersion,
      llmClient: this.options.llmClient,
      question: "Q2",
    }));
    const q2: Q2Money = {
      ...q2PromptOutput,
      confidence: confidenceForQ2BusinessSignalsAvailability(businessSignalsArtifact !== null),
      depth_indicator: depthIndicator,
    };

    const q3Input = buildQ3PromptInput(buildContext);
    const q3PromptOutput = parseQ3PromptOutput(await executeQuestionPrompt({
      prompt: q3Prompt,
      userPrompt: buildQ3UserPrompt(q3Input),
      modelVersion,
      llmClient: this.options.llmClient,
      question: "Q3",
    }));
    const q3: Q3Trust = {
      ...q3PromptOutput,
      confidence: confidenceForQ3TrustDepth(quarterUnderstandingArtifact.content.depth_indicator.trust_dimension),
      depth_indicator: depthIndicator,
    };

    const q4Input = buildQ4PromptInput({ q1, q2, q3 });
    const q4PromptOutput = parseQ4PromptOutput(await executeQuestionPrompt({
      prompt: q4Prompt,
      userPrompt: buildQ4UserPrompt(q4Input),
      modelVersion,
      llmClient: this.options.llmClient,
      question: "Q4",
    }));
    const q4: Q4Price = {
      ...q4PromptOutput,
      confidence: confidenceForQ4DeferredValuation(),
      depth_indicator: depthIndicator,
    };

    const q5Input = buildQ5PromptInput({ q1, q2, q3, q4 });
    const q5PromptOutput = parseQ5PromptOutput(await executeQuestionPrompt({
      prompt: q5Prompt,
      userPrompt: buildQ5UserPrompt(q5Input),
      modelVersion,
      llmClient: this.options.llmClient,
      question: "Q5",
    }));
    const q5: Q5Reason = {
      ...q5PromptOutput,
      confidence: confidenceFromQuestionInputs(q1, q2, q3, q4),
      depth_indicator: depthIndicator,
    };
    const perQuestionInputHashes = {
      q1: stableHash({
        company_knowledge: companyKnowledgeArtifact.metadata.artifact_hash,
        quarter_understanding: quarterUnderstandingArtifact.metadata.artifact_hash,
      }),
      q2: stableHash({
        company_knowledge: companyKnowledgeArtifact.metadata.artifact_hash,
        quarter_understanding: quarterUnderstandingArtifact.metadata.artifact_hash,
        business_signals: businessSignalsArtifact?.metadata.artifact_hash ?? null,
        topic_evolution: topicEvolutionArtifact?.metadata.artifact_hash ?? null,
      }),
      q3: stableHash({
        quarter_understanding: quarterUnderstandingArtifact.metadata.artifact_hash,
        trust_signals: trustSignalsArtifact?.metadata.artifact_hash ?? null,
        commitment_tracking: commitmentTrackingArtifact?.metadata.artifact_hash ?? null,
      }),
      q4: stableHash({
        market_data: null,
      }),
      q5: stableHash({
        q1,
        q2,
        q3,
        q4,
      }),
    };
    const confidence = buildInvestorConfidence({ q1, q2, q3, q4, q5 });
    const promptLineage = {
      q1: lineFor(q1Prompt, modelVersion),
      q2: lineFor(q2Prompt, modelVersion),
      q3: lineFor(q3Prompt, modelVersion),
      q4: lineFor(q4Prompt, modelVersion),
      q5: lineFor(q5Prompt, modelVersion),
    };
    const coherenceHash = stableHash({ q1, q2, q3, q4, q5 });
    const outputHash = stableHash({ q1, q2, q3, q4, q5, confidence });
    const content: InvestorIntelligenceArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      q1,
      q2,
      q3,
      q4,
      q5,
      confidence,
      enrichment_status: enrichmentStatus,
      depth_indicator: depthIndicator,
      per_question_input_hashes: perQuestionInputHashes,
      coherence_hash: coherenceHash,
      output_hash: outputHash,
      prompt_lineage: promptLineage,
      evaluation_hooks: buildInvestorEvaluationHooks({
        q1,
        q2,
        q3,
        q4,
        q5,
        depth: depthIndicator,
        enrichmentStatus,
        promptLineage,
      }),
    };

    validateInvestorIntelligenceArtifactContent(content);

    return {
      content,
      confidence: content.confidence.overall,
    };
  }
}

async function executeQuestionPrompt(params: {
  prompt: ResolvedPrompt;
  userPrompt: string;
  modelVersion: string;
  llmClient: LLMClient;
  question: string;
}): Promise<string> {
  try {
    const response = await callLLM(params.llmClient, {
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

    return response.output_text;
  } catch (error) {
    throw new BuilderExecutionError(`${params.question} prompt execution failed: ${builderErrorMessage(error)}`, error);
  }
}

function lineFor(prompt: ResolvedPrompt, modelVersion: string): PromptLineage {
  return {
    prompt_id: prompt.promptId,
    prompt_version: prompt.version,
    prompt_hash: prompt.hash,
    prompt_source: prompt.source,
    activation_id: prompt.activationId,
    model_version: modelVersion,
  };
}
