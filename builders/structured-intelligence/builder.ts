import type { Artifact } from "../../contracts/artifacts/artifact.js";
import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderDependencyError, BuilderExecutionError, builderErrorMessage } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { callLLM, type LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import type { ThemesArtifactContent } from "../themes/contract.js";
import {
  STRUCTURED_INTELLIGENCE_BUILDER_TYPE,
  STRUCTURED_INTELLIGENCE_MODEL_VERSION,
  type StructuredIntelligenceArtifactContent,
} from "./contract.js";
import {
  buildStructuredIntelligenceEvaluationHooks,
  calculateStructuredIntelligenceConfidence,
} from "./evaluation.js";
import {
  buildStructuredIntelligenceUserPrompt,
  STRUCTURED_INTELLIGENCE_PROMPT_ID,
} from "./prompt.js";
import type {
  FilingArtifactContent,
  StructuredIntelligenceBuilderInput,
  StructuredIntelligenceLLMOutput,
} from "./types.js";
import {
  detectGenericLanguage,
  detectUnsupportedEntityWarnings,
  parseStructuredIntelligenceLLMOutput,
  validateFilingArtifact,
  validateStructuredEvidenceReferences,
  validateStructuredIntelligenceDependencies,
  validateStructuredIntelligenceContent,
  validateStructuredIntelligenceInput,
  validateStructuredIntelligenceReconciliation,
  validateStructuredUnderstanding,
  validateThemesArtifact,
} from "./validator.js";

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

  async validateInput(input: StructuredIntelligenceBuilderInput): Promise<void> {
    validateStructuredIntelligenceInput(input);
  }

  async execute(
    context: BuilderContext<StructuredIntelligenceBuilderInput>,
  ): Promise<BuilderResult<StructuredIntelligenceArtifactContent>> {
    const filingArtifact = dependencyArtifact<FilingArtifactContent>(
      context.dependencies.filing,
      "filing",
    );
    const themesArtifact = dependencyArtifact<ThemesArtifactContent>(
      context.dependencies.themes,
      "themes",
    );
    const filing = filingArtifact.content;
    const themes = themesArtifact.content;

    validateFilingArtifact(filing);
    validateThemesArtifact(themes);
    validateStructuredIntelligenceDependencies({
      input: context.input,
      companyId: context.companyId,
      periodId: context.periodId,
      filingArtifact,
      themesArtifact,
    });

    const prompt = this.options.promptResolver.resolve(STRUCTURED_INTELLIGENCE_PROMPT_ID);
    const modelVersion = this.options.modelVersion ?? STRUCTURED_INTELLIGENCE_MODEL_VERSION;

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

    let output: StructuredIntelligenceLLMOutput;

    try {
      const response = await callLLM(this.options.llmClient, {
        model: modelVersion,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: prompt.content,
          },
          {
            role: "user",
            content: buildStructuredIntelligenceUserPrompt({
              company_id: context.input.company_id,
              period_id: context.input.period_id,
              filing_id: filing.filing_id,
              filing_type: filing.filing_type,
              filing_content: filing.filing_content,
              themes: themes.themes,
            }),
          },
        ],
      });

      output = parseStructuredIntelligenceLLMOutput(response.output_text);
    } catch (error) {
      if (error instanceof BuilderDependencyError) {
        throw error;
      }

      if (error instanceof Error && error.name === "BuilderValidationError") {
        throw error;
      }

      throw new BuilderExecutionError(`Structured Intelligence LLM invocation failed: ${builderErrorMessage(error)}`, error);
    }

    const themeTexts = themes.themes.flatMap((theme) => [theme.title, theme.description]);
    validateStructuredUnderstanding(output.understanding);
    validateStructuredEvidenceReferences(output.understanding, themes.themes);

    const genericLanguage = detectGenericLanguage(output.understanding);
    const unsupportedWarnings = detectUnsupportedEntityWarnings(output.understanding, filing.filing_content, themeTexts);
    const confidence = calculateStructuredIntelligenceConfidence(output.understanding, themes.themes, unsupportedWarnings);
    const content: StructuredIntelligenceArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      filing_id: filing.filing_id,
      filing_period: filing.filing_period,
      status: output.status,
      understanding: output.understanding,
      confidence,
      evaluation_hooks: buildStructuredIntelligenceEvaluationHooks(
        output.understanding,
        themes.themes,
        prompt.version,
        modelVersion,
        genericLanguage.length,
        unsupportedWarnings,
      ),
    };

    validateStructuredIntelligenceContent(content);
    validateStructuredIntelligenceReconciliation({
      content,
      themes: themes.themes,
      genericLanguageCount: genericLanguage.length,
      unsupportedEntityWarnings: unsupportedWarnings,
      promptVersion: prompt.version,
      modelVersion,
    });

    return {
      content,
      confidence: confidence.overall,
    };
  }
}

function dependencyArtifact<T>(
  artifact: Artifact<unknown> | undefined,
  dependencyName: string,
): Artifact<T> {
  if (!artifact) {
    throw new BuilderDependencyError(`Missing required Structured Intelligence dependency: ${dependencyName}`);
  }

  return artifact as Artifact<T>;
}
