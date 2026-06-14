import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { fileExists, readTextFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { NormalizationStats } from "../types/pipeline.types.js";

const sections = [
  {
    name: "management discussion",
    inputFileName: "management-discussion.txt",
    outputFileName: "management-discussion.cleaned.txt",
    repeatedHeaderPattern: /^item 2\.?\s+management'?s discussion and analysis/i,
  },
  {
    name: "risk factors",
    inputFileName: "risk-factors.txt",
    outputFileName: "risk-factors.cleaned.txt",
    repeatedHeaderPattern: /^item 1a\.?\s+risk factors/i,
  },
];

export async function normalizeSections(company: CompanyConfig, filingDate?: string): Promise<void> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const processedDir = join(filingDir, "processed");
  const normalizedDir = join(filingDir, "normalized");
  await ensureDirectory(normalizedDir);

  for (const section of sections) {
    const overlapDedupedInputPath = join(processedDir, section.inputFileName.replace(/\.txt$/, ".overlap-deduped.txt"));
    const dedupedInputPath = join(processedDir, section.inputFileName.replace(/\.txt$/, ".deduped.txt"));
    const inputPath = fileExists(overlapDedupedInputPath)
      ? overlapDedupedInputPath
      : fileExists(dedupedInputPath)
        ? dedupedInputPath
        : join(processedDir, section.inputFileName);
    const outputPath = join(normalizedDir, section.outputFileName);
    const originalText = await readTextFile(inputPath);
    const { text: normalizedText, stats } = normalizeText(originalText, section.repeatedHeaderPattern, company);

    await writeTextFile(outputPath, `${normalizedText}\n`);

    console.log(`Section: ${section.name}`);
    console.log(`Input: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
    console.log(`Original characters: ${stats.originalCharacters}`);
    console.log(`Normalized characters: ${stats.normalizedCharacters}`);
    console.log(`Duplicate lines removed: ${stats.duplicateLinesRemoved}`);
    console.log(`Empty lines removed: ${stats.emptyLinesRemoved}`);
    console.log(`Artifact lines removed: ${stats.artifactLinesRemoved}`);
    console.log(`Repeated headers trimmed: ${stats.repeatedHeadersTrimmed}`);
    console.log(`Operations applied: ${stats.operationsApplied.join(", ")}`);
    console.log("");
  }
}

function normalizeText(
  originalText: string,
  repeatedHeaderPattern: RegExp,
  company: CompanyConfig,
): { text: string; stats: NormalizationStats } {
  const stats: NormalizationStats = {
    originalCharacters: originalText.length,
    normalizedCharacters: 0,
    duplicateLinesRemoved: 0,
    emptyLinesRemoved: 0,
    artifactLinesRemoved: 0,
    repeatedHeadersTrimmed: 0,
    operationsApplied: [
      "normalized unicode apostrophes and quotes",
      "collapsed inline whitespace",
      "normalized paragraph line breaks",
      "removed empty lines",
      "removed exact and contained duplicate repeated lines",
      "removed obvious SEC/XBRL artifacts",
      "trimmed repeated section headers",
      "reduced excessive punctuation noise",
    ],
  };

  const normalizedUnicode = originalText
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[®™]/g, "");

  const lines = normalizedUnicode
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .map((line) => reducePunctuationNoise(line));

  const cleanedLines: string[] = [];
  const seenLines = new Set<string>();
  let headerSeen = false;

  for (const line of lines) {
    if (!line) {
      stats.emptyLinesRemoved += 1;
      continue;
    }

    if (isObviousArtifact(line, company)) {
      stats.artifactLinesRemoved += 1;
      continue;
    }

    const normalizedLineKey = line.toLowerCase();

    if (repeatedHeaderPattern.test(line)) {
      if (headerSeen) {
        stats.repeatedHeadersTrimmed += 1;
        continue;
      }

      headerSeen = true;
    }

    if (seenLines.has(normalizedLineKey) || isContainedDuplicate(normalizedLineKey, seenLines)) {
      stats.duplicateLinesRemoved += 1;
      continue;
    }

    seenLines.add(normalizedLineKey);
    cleanedLines.push(line);
  }

  const text = cleanedLines.join("\n\n").trim();
  stats.normalizedCharacters = text.length;

  return { text, stats };
}

function isContainedDuplicate(lineKey: string, seenLines: Set<string>): boolean {
  if (lineKey.length < 120) {
    return false;
  }

  for (const seenLine of seenLines) {
    if (seenLine.length < 120) {
      continue;
    }

    if (seenLine.includes(lineKey) || lineKey.includes(seenLine)) {
      return true;
    }
  }

  return false;
}

function cleanLine(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:%)])/, "$1")
    .replace(/([(])\s+/g, "$1")
    .trim();
}

function reducePunctuationNoise(line: string): string {
  return line
    .replace(/\.{4,}/g, "...")
    .replace(/-{3,}/g, "--")
    .replace(/_{2,}/g, "_")
    .trim();
}

function isObviousArtifact(line: string, company: CompanyConfig): boolean {
  const escapedCompanyName = company.company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    new RegExp(`^${escapedCompanyName}(?: inc\\.)? \\| q\\d \\d{4} form 10-q \\| \\d+$`, "i").test(line) ||
    /^ix:/i.test(line) ||
    /^xbrli:/i.test(line) ||
    /^dei:/i.test(line) ||
    /^us-gaap:/i.test(line) ||
    /^table of contents$/i.test(line)
  );
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run normalize:sections -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    normalizeSections(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
