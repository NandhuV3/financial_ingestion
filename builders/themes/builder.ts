import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderExecutionError, BuilderValidationError, builderErrorMessage } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { callLLM, type LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import { createLogger } from "../../src/shared/logger.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_MODEL_VERSION,
  THEMES_REASONING_VERSION,
  type Theme,
  type ThemesArtifactContent,
} from "./contract.js";
import {
  THEMES_PROMPT_ID,
  type ThemesPromptRenderContext,
} from "../../src/prompt-registry/themes-prompt.js";
import {
  buildPromptEvidence,
  buildPromptEvidenceIndex,
  createThemeId,
  normalizeThemeKey,
  parseThemesLLMOutput,
  validateNoThemesDependencies,
  validateThemeCandidate,
  validateThemesArtifactContent,
  validateThemesInput,
} from "./validator.js";
import type {
  ThemeCandidate,
  ThemePromptEvidence,
  ThemesBuilderInput,
} from "./types.js";

const logger = createLogger("themes-builder");

export type ThemesBuilderOptions = {
  promptResolver: Pick<PromptResolver, "render"> | Pick<PromptResolver, "resolve">;
  llmClient: LLMClient;
  modelVersion?: string;
};

export class ThemesBuilder implements Builder<ThemesBuilderInput, ThemesArtifactContent> {
  constructor(private readonly options: ThemesBuilderOptions) {}

  builderType(): string {
    return THEMES_BUILDER_TYPE;
  }

  async validateInput(input: ThemesBuilderInput): Promise<void> {
    validateThemesInput(input);
  }

  async execute(
    context: BuilderContext<ThemesBuilderInput>,
  ): Promise<BuilderResult<ThemesArtifactContent>> {
    validateNoThemesDependencies(context.dependencies);
    validateThemesInput(context.input);

    const themeInputBoundary = context.input.theme_input_boundary!;
    const promptEvidence = buildPromptEvidence(
      themeInputBoundary.visible_evidence,
    );
    const promptEvidenceByIndex = buildPromptEvidenceIndex({
      visibleEvidence: themeInputBoundary.visible_evidence,
      promptEvidence,
    });
    const renderedPrompt = renderPrompt(
      this.options.promptResolver,
      THEMES_PROMPT_ID,
      {
        inputVersion: themeInputBoundary.input_version,
        evidence: promptEvidence,
      },
    );
    const modelVersion = this.options.modelVersion ?? THEMES_MODEL_VERSION;

    context.recordPromptReference({
      prompt_id: renderedPrompt.prompt_id,
      prompt_version: renderedPrompt.prompt_version,
      activation_id: renderedPrompt.activation_id ?? "not_active",
    });
    context.recordModelReference({
      provider: "platform-llm",
      model_name: modelVersion,
      model_version: modelVersion,
      temperature: 0,
    });

    logger.info("Executing Themes LLM builder", {
      execution_id: context.executionId,
      company_id: context.companyId,
      period_id: context.periodId,
      prompt_id: renderedPrompt.prompt_id,
      prompt_version: renderedPrompt.prompt_version,
      visible_evidence_count: promptEvidence.length,
    });

    let outputText: string;

    try {
      const response = await callLLM(this.options.llmClient, {
        model: modelVersion,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: renderedPrompt.system_prompt,
          },
          {
            role: "user",
            content: renderedPrompt.user_prompt,
          },
        ],
      });

      outputText = response.output_text;
    } catch (error) {
      throw new BuilderExecutionError(`Themes LLM invocation failed: ${builderErrorMessage(error)}`, error);
    }

    const parsed = parseThemesLLMOutput(outputText);
    const themes = buildThemes({
      filingId: themeInputBoundary.filing_id,
      candidates: parsed.themes,
      promptEvidence,
      promptEvidenceByIndex,
      promptId: renderedPrompt.prompt_id,
      promptVersion: renderedPrompt.prompt_version,
      reasoningVersion: THEMES_REASONING_VERSION,
    });
    const content: ThemesArtifactContent = {
      company_id: context.companyId,
      period_id: context.periodId,
      filing_id: themeInputBoundary.filing_id,
      themes,
      prompt_id: renderedPrompt.prompt_id,
      prompt_version: renderedPrompt.prompt_version,
      reasoning_version: THEMES_REASONING_VERSION,
      render_hash: renderedPrompt.render_hash,
      model_name: modelVersion,
      model_version: modelVersion,
    };

    validateThemesArtifactContent({
      content,
      themeInputBoundary,
      promptId: renderedPrompt.prompt_id,
      promptVersion: renderedPrompt.prompt_version,
      reasoningVersion: THEMES_REASONING_VERSION,
      renderHash: renderedPrompt.render_hash,
      modelName: modelVersion,
      modelVersion,
    });

    logger.info("Themes artifact content constructed", {
      execution_id: context.executionId,
      company_id: context.companyId,
      period_id: context.periodId,
      theme_count: themes.length,
    });

    return {
      content,
      confidence: calculateOverallConfidence(themes),
    };
  }
}

function buildThemes(input: {
  filingId: string;
  candidates: ThemeCandidate[];
  promptEvidence: ThemePromptEvidence[];
  promptEvidenceByIndex: Map<number, { evidence_ref: string }>;
  promptId: string;
  promptVersion: string;
  reasoningVersion: string;
}): Theme[] {
  const seen = new Set<string>();
  const themes: Theme[] = [];

  for (const [index, candidate] of input.candidates.entries()) {
    validateThemeCandidate(candidate, index, input.promptEvidence);

    const key = normalizeThemeKey(candidate.title, candidate.summary);

    if (seen.has(key)) {
      throw new BuilderValidationError(
        `themes[${index}] duplicates another Theme narrative.`,
      );
    }

    seen.add(key);

    const evidence = candidate.paragraph_indexes.map((paragraphIndex) => {
      const visibleEvidence = input.promptEvidenceByIndex.get(paragraphIndex);

      if (!visibleEvidence) {
        throw new BuilderValidationError(
          `Theme paragraph_index is not present in the supplied Theme Input Boundary evidence: ${paragraphIndex}`,
        );
      }

      return {
        evidence_ref: visibleEvidence.evidence_ref,
      };
    });
    const evidenceRefs = evidence.map(({ evidence_ref: evidenceRef }) =>
      evidenceRef);

    if (new Set(evidenceRefs).size !== evidenceRefs.length) {
      throw new BuilderValidationError(
        `themes[${index}].evidence must contain unique evidence_ref values.`,
      );
    }

    themes.push({
      theme_id: createThemeId(
        input.filingId,
        candidate.title,
        candidate.summary,
        evidenceRefs,
      ),
      title: candidate.title.trim(),
      summary: candidate.summary.trim(),
      category: candidate.category,
      evidence,
      evidence_count: evidence.length,
      extraction_confidence: confidenceFromCandidate(candidate),
      prompt_id: input.promptId,
      prompt_version: input.promptVersion,
      reasoning_version: input.reasoningVersion,
    });
  }

  return themes;
}

function confidenceFromCandidate(candidate: ThemeCandidate): number {
  return candidate.paragraph_indexes.length > 0 ? 1 : 0;
}

function calculateOverallConfidence(themes: Theme[]): number {
  if (themes.length === 0) {
    return 0;
  }

  return Math.round(
    (themes.reduce((sum, theme) =>
      sum + (theme.extraction_confidence ?? 0), 0)
      / themes.length) * 1000,
  ) / 1000;
}

function renderPrompt(
  promptResolver: ThemesBuilderOptions["promptResolver"],
  promptId: string,
  context: ThemesPromptRenderContext,
) {
  if (!("render" in promptResolver)) {
    throw new BuilderExecutionError(
      "Prompt Registry rendering capability is required for Themes Builder.",
    );
  }

  return promptResolver.render<ThemesPromptRenderContext>(
    promptId,
    context,
  );
}
