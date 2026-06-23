import { promises as fs } from "node:fs";
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
import {
  renderThemesUserPrompt,
  THEMES_PROMPT_ID,
  THEMES_PROMPT_VERSION,
} from "../../src/prompt-registry/themes-prompt.js";
import {
  createThemeId,
  normalizeThemeKey,
  parseThemesLLMOutput,
  resolveThemesDependencies,
  validateThemeCandidate,
  validateThemesArtifactContent,
  validateThemesInput,
} from "./validator.js";
import type {
  ThemeCandidate,
  ThemePromptEvidence,
  ThemesBuilderInput,
} from "./types.js";
import type { EvidenceCatalogEntry } from "../../contracts/artifacts/evidence-catalog-artifact-content.js";

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
    const dependencies = resolveThemesDependencies({
      dependencies: context.dependencies,
      companyId: context.companyId,
      periodId: context.periodId,
    });
    const evidenceCatalogContent = dependencies.evidence_catalog.content;
    const evidenceCatalog = evidenceCatalogContent.entries;
    const promptEvidence = buildThemePromptEvidence(evidenceCatalog);

    const prompt = this.options.promptResolver.resolve(
      THEMES_PROMPT_ID,
      THEMES_PROMPT_VERSION,
    );
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
            content: renderThemesUserPrompt({
              filingType: context.input.filing_type,
              evidence: promptEvidence,
            }),
          },
        ],
      });

      outputText = response.output_text;
    } catch (error) {
      throw new BuilderExecutionError(`Themes LLM invocation failed: ${builderErrorMessage(error)}`, error);
    }

    const parsed = parseThemesLLMOutput(outputText);

    await fs.mkdir("tmp", { recursive: true });
    await fs.writeFile(
      "tmp/themes-raw.json",
      JSON.stringify(parsed, null, 2),
    );
    console.log("[themes] raw response written to tmp/themes-raw.json");

    const { themes, duplicateCount } = buildThemes(
      evidenceCatalogContent.filing_id,
      parsed.themes,
      evidenceCatalog,
      promptEvidence,
    );
    const confidence = calculateThemesConfidence(themes, duplicateCount);
    const content: ThemesArtifactContent = {
      company_id: evidenceCatalogContent.company_id,
      period_id: evidenceCatalogContent.period_id,
      filing_id: evidenceCatalogContent.filing_id,
      filing_type: context.input.filing_type,
      themes,
      confidence,
      evaluation_hooks: buildThemesEvaluationHooks(
        themes,
        duplicateCount,
        prompt.version,
        modelVersion,
        evidenceCatalog,
      ),
    };

    validateThemesArtifactContent(content, evidenceCatalog);

    return {
      content,
      confidence: confidence.overall,
    };
  }
}

function buildThemes(
  filingId: string,
  candidates: ThemeCandidate[],
  evidenceCatalog: EvidenceCatalogEntry[],
  promptEvidence: ThemePromptEvidence[],
): { themes: Theme[]; duplicateCount: number } {
  const seen = new Set<string>();
  const themes: Theme[] = [];
  let duplicateCount = 0;

  for (const [index, candidate] of candidates.entries()) {
    validateThemeCandidate(candidate, index, promptEvidence);

    const key = normalizeThemeKey(candidate.title, candidate.summary);

    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(key);
    themes.push({
      theme_id: createThemeId(filingId, candidate.title, candidate.summary),
      title: candidate.title.trim(),
      summary: candidate.summary.trim(),
      category: candidate.category,
      evidence: candidate.paragraph_indexes.map((paragraphIndex) => {
        const promptEvidenceIndex = promptEvidence.findIndex(
          ({ paragraph_index }) => paragraph_index === paragraphIndex,
        );
        const canonical = evidenceCatalog[promptEvidenceIndex];

        if (!canonical) {
          throw new BuilderValidationError(
            `Theme paragraph_index is not present in the supplied filing paragraphs: ${paragraphIndex}`,
          );
        }

        return {
          evidence_ref: canonical.evidence_ref,
          evidence_hash: canonical.evidence_hash,
          section_name: canonical.section_name,
          paragraph_index: canonical.paragraph_index,
        };
      }),
      evidence_count: candidate.paragraph_indexes.length,
      confidence: confidenceFromCandidate(candidate),
    });
  }

  return { themes, duplicateCount };
}

function confidenceFromCandidate(candidate: ThemeCandidate): number {
  return candidate.paragraph_indexes.length > 0 ? 1 : 0;
}

function buildThemePromptEvidence(
  evidenceCatalog: EvidenceCatalogEntry[],
): ThemePromptEvidence[] {
  return evidenceCatalog.map((entry, index) => ({
    paragraph_index: index + 1,
    section_name: entry.section_name,
    paragraph_text: entry.paragraph_text,
  }));
}
