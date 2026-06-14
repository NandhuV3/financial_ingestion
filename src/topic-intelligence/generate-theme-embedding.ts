import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import { createLogger } from "../shared/logger.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { Theme, ThemeOutput } from "../types/theme.types.js";
import { createEmbeddings, embeddingModel } from "./generate-topic-embeddings.js";
import type { ThemeEmbeddingFile } from "./semantic-topic.types.js";

const logger = createLogger("theme-embeddings");

export async function generateThemeEmbeddings(ticker: string, filingDate: string): Promise<ThemeEmbeddingFile> {
  const startedAt = Date.now();
  const company = getCompanyConfig(ticker);
  const filingDir = getFilingDirectory(company.ticker, filingDate);
  const themesPath = join(filingDir, "intelligence", "themes.json");
  const outputPath = join(filingDir, "intelligence", "theme-embeddings.json");
  const themeOutput = await readJsonFile<ThemeOutput>(themesPath);
  const inputHash = calculateThemeEmbeddingInputHash(themeOutput.themes);
  const existing = await readExistingThemeEmbeddings(outputPath);

  if (isThemeEmbeddingCacheValid(existing, inputHash, embeddingModel)) {
    logger.info("Theme embeddings skipped because source hash is unchanged.", {
      ticker: company.ticker,
      filing_date: filingDate,
      duration_ms: Date.now() - startedAt,
    });
    return existing as ThemeEmbeddingFile;
  }

  const embeddings = themeOutput.themes.length === 0
    ? []
    : await createEmbeddings(themeOutput.themes.map(buildThemeEmbeddingInput));
  const output: ThemeEmbeddingFile = {
    company: company.company,
    ticker: company.ticker,
    filing_date: filingDate,
    generated_at: getCurrentTimestamp(),
    embedding_model: embeddingModel,
    input_hash: inputHash,
    themes: themeOutput.themes.map((theme, index) => ({
      theme: theme.theme,
      category: theme.category,
      summary: theme.summary,
      embedding: embeddings[index] ?? [],
    })),
  };

  await writeJsonFile(outputPath, output);
  logger.info("Theme embeddings generated.", {
    ticker: company.ticker,
    filing_date: filingDate,
    duration_ms: Date.now() - startedAt,
    theme_count: themeOutput.themes.length,
  });

  return output;
}

export function calculateThemeEmbeddingInputHash(themes: Theme[]): string {
  return calculateStringHash(JSON.stringify(themes.map((theme) => ({
    theme: theme.theme,
    category: theme.category,
    summary: theme.summary,
  }))));
}

export function buildThemeEmbeddingInput(theme: Theme): string {
  return [
    `Theme: ${theme.theme}`,
    `Category: ${theme.category}`,
    `Summary: ${theme.summary}`,
  ].join("\n");
}

export function isThemeEmbeddingCacheValid(
  existing: ThemeEmbeddingFile | null,
  inputHash: string,
  model: string,
): boolean {
  return Boolean(existing && existing.input_hash === inputHash && existing.embedding_model === model);
}

async function readExistingThemeEmbeddings(path: string): Promise<ThemeEmbeddingFile | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<ThemeEmbeddingFile>(path);
}
