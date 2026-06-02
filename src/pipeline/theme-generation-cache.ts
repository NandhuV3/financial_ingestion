import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile, readTextFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type {
  ChunkHashMetadata,
  ThemeGenerationReason,
  ThemeGenerationReport,
  ThemeGenerationStatus,
} from "../types/theme.types.js";

type ThemeGenerationDecision = {
  shouldGenerate: boolean;
  status: ThemeGenerationStatus;
  reason: ThemeGenerationReason;
};

export function decideThemeGeneration(params: {
  themesExist: boolean;
  storedChunkHash: string | null;
  currentChunkHash: string;
}): ThemeGenerationDecision {
  if (!params.themesExist) {
    return {
      shouldGenerate: true,
      status: "generated",
      reason: "themes_missing",
    };
  }

  if (!params.storedChunkHash) {
    return {
      shouldGenerate: true,
      status: "generated",
      reason: "metadata_missing",
    };
  }

  if (params.storedChunkHash !== params.currentChunkHash) {
    return {
      shouldGenerate: true,
      status: "generated",
      reason: "chunk_changes_detected",
    };
  }

  return {
    shouldGenerate: false,
    status: "skipped",
    reason: "chunks_unchanged",
  };
}

export async function calculateFilingChunkHash(ticker: string, filingDate: string): Promise<string> {
  const chunksDir = join(getFilingDirectory(ticker, filingDate), "chunks");
  const chunkFiles = (await readdir(chunksDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  let hashInput = "";

  for (const fileName of chunkFiles) {
    const filePath = join(chunksDir, fileName);
    hashInput += `${fileName}\0${await readTextFile(filePath)}\0`;
  }

  return calculateStringHash(hashInput);
}

export async function estimateThemeInputTokens(ticker: string, filingDate: string): Promise<number> {
  const chunksDir = join(getFilingDirectory(ticker, filingDate), "chunks");
  const chunkFiles = (await readdir(chunksDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  let totalCharacters = 0;

  for (const fileName of chunkFiles) {
    totalCharacters += (await readTextFile(join(chunksDir, fileName))).length;
  }

  return Math.ceil(totalCharacters / 4);
}

export async function readStoredChunkHash(ticker: string, filingDate: string): Promise<string | null> {
  const metadataPath = getChunkHashMetadataPath(ticker, filingDate);

  if (!fileExists(metadataPath)) {
    return null;
  }

  return (await readJsonFile<ChunkHashMetadata>(metadataPath)).hash;
}

export async function writeChunkHashMetadata(ticker: string, filingDate: string, hash: string): Promise<void> {
  const metadata: ChunkHashMetadata = {
    hash,
    generated_at: getCurrentTimestamp(),
  };

  await writeJsonFile(getChunkHashMetadataPath(ticker, filingDate), metadata);
}

export async function writeThemeGenerationReport(
  ticker: string,
  filingDate: string,
  report: ThemeGenerationReport,
): Promise<void> {
  await writeJsonFile(getThemeGenerationReportPath(ticker, filingDate), report);
}

export function buildThemeGenerationReport(params: {
  status: ThemeGenerationStatus;
  reason: ThemeGenerationReason;
  estimatedInputTokens: number;
  chunkHash: string;
}): ThemeGenerationReport {
  return {
    status: params.status,
    reason: params.reason,
    estimated_input_tokens: params.estimatedInputTokens,
    chunk_hash: params.chunkHash,
    generated_at: getCurrentTimestamp(),
  };
}

export function getThemeGenerationPaths(ticker: string, filingDate: string): {
  themesPath: string;
  chunkHashMetadataPath: string;
  reportPath: string;
} {
  return {
    themesPath: join(getFilingDirectory(ticker, filingDate), "intelligence", "themes.json"),
    chunkHashMetadataPath: getChunkHashMetadataPath(ticker, filingDate),
    reportPath: getThemeGenerationReportPath(ticker, filingDate),
  };
}

function getChunkHashMetadataPath(ticker: string, filingDate: string): string {
  return join(getFilingDirectory(ticker, filingDate), "metadata", "chunk-hash.json");
}

function getThemeGenerationReportPath(ticker: string, filingDate: string): string {
  return join(getFilingDirectory(ticker, filingDate), "reports", "theme-generation-report.json");
}
