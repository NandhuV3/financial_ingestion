import type { PromptResolver } from "../../src/prompt-registry/prompt-resolver.js";
import type { Builder } from "../../packages/builder-framework/src/builder.js";
import type { BuilderContext } from "../../packages/builder-framework/src/builder-context.js";
import { BuilderExecutionError, BuilderValidationError, builderErrorMessage } from "../../packages/builder-framework/src/builder-errors.js";
import type { BuilderResult } from "../../packages/builder-framework/src/builder-result.js";
import { callLLM, type LLMClient } from "../../packages/llm-framework/src/llm-client.js";
import {
  THEMES_BUILDER_TYPE,
  THEMES_MODEL_VERSION,
  type Theme,
  type ThemesArtifactContent,
} from "./contract.js";
import { calculateThemesConfidence, buildThemesEvaluationHooks } from "./evaluation.js";
import { buildThemesUserPrompt, THEMES_PROMPT_ID } from "./prompt.js";
import {
  createThemeId,
  normalizeThemeKey,
  parseThemesLLMOutput,
  validateThemeCandidate,
  validateThemesArtifactContent,
  validateThemesInput,
} from "./validator.js";
import type { ThemeCandidate, ThemesBuilderInput } from "./types.js";

export type ThemesBuilderOptions = {
  promptResolver: Pick<PromptResolver, "resolve">;
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
    const prompt = this.options.promptResolver.resolve(THEMES_PROMPT_ID);
    const modelVersion = this.options.modelVersion ?? THEMES_MODEL_VERSION;

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

    let outputText: string;

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
            content: buildThemesUserPrompt(context.input),
          },
        ],
      });

      outputText = response.output_text;
    } catch (error) {
      throw new BuilderExecutionError(`Themes LLM invocation failed: ${builderErrorMessage(error)}`, error);
    }

    const parsed = parseThemesLLMOutput(outputText);
    const { themes, duplicateCount } = buildThemes(context.input, parsed.themes);
    const confidence = calculateThemesConfidence(themes, duplicateCount);
    const content: ThemesArtifactContent = {
      company_id: context.input.company_id,
      period_id: context.input.period_id,
      filing_id: context.input.filing_id,
      filing_type: context.input.filing_type,
      themes,
      confidence,
      evaluation_hooks: buildThemesEvaluationHooks(themes, duplicateCount, prompt.version, modelVersion),
    };

    validateThemesArtifactContent(content);

    return {
      content,
      confidence: confidence.overall,
    };
  }
}

function buildThemes(
  input: ThemesBuilderInput,
  candidates: ThemeCandidate[],
): { themes: Theme[]; duplicateCount: number } {
  const seen = new Set<string>();
  const themes: Theme[] = [];
  let duplicateCount = 0;

  for (const [index, candidate] of candidates.entries()) {
    validateThemeCandidate(candidate, index);

    const key = normalizeThemeKey(candidate.title, candidate.description);

    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(key);
    themes.push({
      theme_id: createThemeId(input.filing_id, candidate.title, candidate.description),
      title: candidate.title.trim(),
      description: candidate.description.trim(),
      category: candidate.category,
      importance: candidate.importance,
      source_evidence: candidate.evidence,
      frequency: candidate.frequency ?? candidate.evidence.length,
      confidence: confidenceFromCandidate(candidate),
    });
  }

  return { themes, duplicateCount };
}

function confidenceFromCandidate(candidate: ThemeCandidate): number {
  const evidenceScore = Math.min(candidate.evidence.length / 3, 1);
  const importanceScore = candidate.importance === "high" ? 1 : candidate.importance === "medium" ? 0.75 : 0.5;

  return Math.round(((evidenceScore + importanceScore) / 2) * 1000) / 1000;
}

