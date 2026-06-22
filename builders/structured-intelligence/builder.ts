import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import {
  BuilderExecutionError,
  BuilderValidationError,
  builderErrorMessage,
} from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import {
  callLLM,
  type LLMClient,
} from "../../packages/llm-framework/src/llm-client.js";
import {
  buildStructuredIntelligenceEvaluationHooks,
  calculateStructuredIntelligenceConfidence,
  calculateStructuredIntelligenceStatus,
} from "./confidence.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_MODEL_VERSION,
  STRUCTURED_INTELLIGENCE_PROMPT_ID,
  STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
  STRUCTURED_INTELLIGENCE_TEMPERATURE,
  type StructuredIntelligenceArtifactContent,
} from "./contract.js";
import {
  buildStructuredPromptContext,
  serializeStructuredPromptContext,
} from "./context-builder.js";
import { buildStructuredIntelligenceReplayability } from "./replayability.js";
import { parseStructuredIntelligencePromptOutput } from "./response-parser.js";
import type { StructuredIntelligenceBuilderInput } from "./types.js";
import {
  resolveStructuredIntelligenceDependencies,
  validateStructuredIntelligenceContent,
  validateStructuredIntelligenceInput,
  validateStructuredIntelligenceReconciliation,
  validateStructuredUnderstanding,
} from "./validator.js";
import { buildStructuredValueReferences } from "./value-references.js";

export type StructuredIntelligenceBuilderOptions = {
  promptResolver: Pick<PromptResolver, "resolve">;
  llmClient: LLMClient;
  modelVersion?: string;
};

export class StructuredIntelligenceBuilder implements Builder<
  StructuredIntelligenceBuilderInput,
  StructuredIntelligenceArtifactContent
> {
  constructor(private readonly options: StructuredIntelligenceBuilderOptions) {}

  builderType(): string {
    return STRUCTURED_INTELLIGENCE_BUILDER_TYPE;
  }

  async validateInput(
    input: StructuredIntelligenceBuilderInput,
  ): Promise<void> {
    validateStructuredIntelligenceInput(input);
  }

  async execute(
    context: BuilderContext<StructuredIntelligenceBuilderInput>,
  ): Promise<BuilderResult<StructuredIntelligenceArtifactContent>> {
    const dependencies = resolveStructuredIntelligenceDependencies({
      dependencies: context.dependencies,
      target: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
    });
    const prompt = this.options.promptResolver.resolve(
      STRUCTURED_INTELLIGENCE_PROMPT_ID,
      STRUCTURED_INTELLIGENCE_PROMPT_VERSION,
    );
    const modelVersion = this.options.modelVersion
      ?? STRUCTURED_INTELLIGENCE_MODEL_VERSION;
    const promptContext = buildStructuredPromptContext({
      companyId: context.companyId,
      periodId: context.periodId,
      filing: dependencies.filing.content,
      themes: dependencies.themes.content,
    });

    context.recordPromptReference({
      prompt_id: prompt.promptId,
      prompt_version: prompt.version,
      activation_id: prompt.activationId ?? "not_active",
    });
    context.recordModelReference({
      provider: "platform-llm",
      model_name: modelVersion,
      model_version: modelVersion,
      temperature: STRUCTURED_INTELLIGENCE_TEMPERATURE,
    });

    let outputText: string;

    try {
      const response = await callLLM(this.options.llmClient, {
        model: modelVersion,
        temperature: STRUCTURED_INTELLIGENCE_TEMPERATURE,
        messages: [
          {
            role: "system",
            content: prompt.content,
          },
          {
            role: "user",
            content: serializeStructuredPromptContext(promptContext),
          },
        ],
      });

      outputText = response.output_text;
    } catch (error) {
      throw new BuilderExecutionError(
        `Structured Intelligence LLM invocation failed: ${builderErrorMessage(error)}`,
        error,
      );
    }

    let understanding;

    try {
      understanding =
        parseStructuredIntelligencePromptOutput(outputText).understanding;
      validateStructuredUnderstanding(
        understanding,
        dependencies.themes.content.themes,
      );
    } catch (error) {
      if (error instanceof BuilderValidationError) {
        throw error;
      }

      throw new BuilderValidationError(
        `Structured Intelligence prompt output validation failed: ${builderErrorMessage(error)}`,
        error,
      );
    }

    const status = calculateStructuredIntelligenceStatus(understanding);
    const valueReferences = buildStructuredValueReferences({
      companyId: context.companyId,
      periodId: context.periodId,
      filingId: context.input.filing_id,
      understanding,
    });
    const confidence = calculateStructuredIntelligenceConfidence(
      understanding,
      dependencies.themes.content.themes,
    );
    const evaluationHooks =
      buildStructuredIntelligenceEvaluationHooks(confidence);
    const contentWithoutReplayability = {
      artifact_type: "structured_intelligence" as const,
      company_id: context.companyId,
      period_id: context.periodId,
      filing_id: context.input.filing_id,
      status,
      understanding,
      value_references: valueReferences,
      confidence,
      evaluation_hooks: evaluationHooks,
    };
    const content: StructuredIntelligenceArtifactContent = {
      ...contentWithoutReplayability,
      replayability_metadata: buildStructuredIntelligenceReplayability({
        prompt,
        modelVersion,
        filing: dependencies.filing.content,
        themes: dependencies.themes.content,
        context: promptContext,
        content: contentWithoutReplayability,
      }),
    };

    validateStructuredIntelligenceContent(content);
    validateStructuredIntelligenceReconciliation({
      content,
      filing: dependencies.filing.content,
      themes: dependencies.themes.content,
      context: promptContext,
      prompt,
      modelVersion,
    });

    return {
      content,
      confidence: confidence.overall,
    };
  }
}
