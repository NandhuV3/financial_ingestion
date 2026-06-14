import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { OpenAIResponse } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import {
  buildThemeInputEstimate,
  loadThemeChunks,
} from "./theme-input.js";
import { loadEnv } from "../shared/config/load.env.js";
import { THEME_GENERATION_SYSTEM_PROMPT_ID } from "../prompt-registry/filesystem-prompt-provider.js";
import { calculateEffectivePromptHash } from "../prompt-registry/prompt-hash.js";
import type { PromptProvenance } from "../prompt-registry/prompt-provenance.types.js";
import { PromptResolver } from "../prompt-registry/prompt-resolver.js";
import type { ResolvedPrompt } from "../prompt-registry/prompt.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const THEME_OUTPUT_SCHEMA_VERSION = "theme-output-v1";

loadEnv();

export const THEME_MODEL_VERSION = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function generateThemes(company: CompanyConfig, filingDate?: string): Promise<void> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const chunksDir = join(filingDir, "chunks");
  const intelligenceDir = join(filingDir, "intelligence");
  const outputPath = join(intelligenceDir, "themes.json");
  const chunks = await loadThemeChunks(chunksDir);
  const chunkIds = chunks.map((chunk) => chunk.chunk_id);
  const themeSchema = buildThemeSchema(chunkIds);
  const estimate = buildThemeInputEstimate(company, chunks);
  const resolvedSystemPrompt = new PromptResolver().resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);
  const promptProvenance = buildThemePromptProvenance(resolvedSystemPrompt, estimate.prompt);
  const apiKey = process.env.OPENAI_API_KEY;

  console.log(`Model: ${THEME_MODEL_VERSION}`);
  console.log(`Total chunks analyzed: ${chunks.length}`);
  console.log(`Input size: ${estimate.inputCharacters} characters`);
  console.log(`Token count estimate: ${estimate.estimatedTokens}`);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate evidence-backed themes.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: THEME_MODEL_VERSION,
      input: [
        {
          role: "system",
          content: resolvedSystemPrompt.content,
        },
        {
          role: "user",
          content: estimate.prompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "apple_q2_2026_evidence_backed_themes",
          strict: true,
          schema: themeSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const responseJson = (await response.json()) as OpenAIResponse;
  const outputText = extractOutputText(responseJson);
  const themes = {
    ...(JSON.parse(outputText) as Omit<ThemeOutput, "prompt_provenance">),
    prompt_provenance: promptProvenance,
  };

  validateThemeOutput(themes, new Set(chunkIds));

  const referencedChunkIds = getReferencedChunkIds(themes);
  const chunksNotReferenced = chunkIds.filter((chunkId) => !referencedChunkIds.includes(chunkId));
  const evidenceCoverage = `${referencedChunkIds.length}/${chunks.length}`;
  const formattedOutput = `${JSON.stringify(themes, null, 2)}\n`;

  await mkdir(intelligenceDir, { recursive: true });
  await writeFile(outputPath, formattedOutput, "utf8");

  console.log(`Themes generated: ${themes.themes.length}`);
  console.log(`Evidence coverage: ${evidenceCoverage} chunks referenced`);
  console.log(`Chunk IDs referenced: ${referencedChunkIds.join(", ")}`);
  console.log(`Chunks not referenced: ${chunksNotReferenced.join(", ") || "none"}`);
  console.log(`Output size: ${formattedOutput.length} characters`);
  console.log(`Saved themes to: ${outputPath}`);
}

export async function resolveThemePromptProvenance(
  company: CompanyConfig,
  filingDate: string,
): Promise<PromptProvenance> {
  const filingDir = getFilingDirectory(company.ticker, filingDate);
  const chunks = await loadThemeChunks(join(filingDir, "chunks"));
  const estimate = buildThemeInputEstimate(company, chunks);
  const resolvedSystemPrompt = new PromptResolver().resolve(THEME_GENERATION_SYSTEM_PROMPT_ID);

  return buildThemePromptProvenance(resolvedSystemPrompt, estimate.prompt);
}

export function buildThemePromptProvenance(
  resolvedSystemPrompt: ResolvedPrompt,
  userPrompt: string,
): PromptProvenance {
  return {
    prompt_id: resolvedSystemPrompt.promptId,
    prompt_version: resolvedSystemPrompt.version,
    prompt_hash: calculateEffectivePromptHash({
      systemPrompt: resolvedSystemPrompt.content,
      userPrompt,
      schemaVersion: THEME_OUTPUT_SCHEMA_VERSION,
    }),
    prompt_source: resolvedSystemPrompt.source,
    activation_id: resolvedSystemPrompt.activationId,
  };
}

function buildThemeSchema(chunkIds: string[]): object {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      company: { type: "string" },
      ticker: { type: "string" },
      filing_date: { type: "string" },
      themes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            theme: { type: "string" },
            category: { type: "string" },
            importance: { type: "string", enum: ["high", "medium", "low"] },
            summary: { type: "string" },
            evidence: {
              type: "array",
              items: { type: "string", enum: chunkIds },
            },
          },
          required: ["theme", "category", "importance", "summary", "evidence"],
        },
      },
    },
    required: ["company", "ticker", "filing_date", "themes"],
  };
}

function validateThemeOutput(output: ThemeOutput, validChunkIds: Set<string>): void {
  if (!output.themes.length) {
    throw new Error("Theme output did not include any themes.");
  }

  for (const theme of output.themes) {
    if (!theme.evidence.length) {
      throw new Error(`Theme "${theme.theme}" has no evidence.`);
    }

    for (const chunkId of theme.evidence) {
      if (!validChunkIds.has(chunkId)) {
        throw new Error(`Theme "${theme.theme}" references unknown chunk ID: ${chunkId}`);
      }
    }
  }
}

function getReferencedChunkIds(output: ThemeOutput): string[] {
  return [...new Set(output.themes.flatMap((theme) => theme.evidence))].sort();
}

function extractOutputText(response: OpenAIResponse): string {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const textParts: string[] = [];

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text);
      }
    }
  }

  const outputText = textParts.join("");

  if (!outputText) {
    throw new Error("OpenAI response did not include output text.");
  }

  return outputText;
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run generate:themes -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    generateThemes(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
