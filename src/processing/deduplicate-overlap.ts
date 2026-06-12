import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { shouldPersistProcessedArtifacts } from "../shared/config/storage-mode.js";
import { fileExists, readTextFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { OverlapDeduplicationReport, SectionOverlapDeduplicationReport } from "../types/pipeline.types.js";

type ParagraphBlock = {
  original: string;
  normalized: string;
  words: string[];
  wordSet: Set<string>;
  wordCount: number;
};

const nearbyParagraphWindow = 10;
const highOverlapThreshold = 0.85;
const minimumComparableWords = 20;

export async function deduplicateOverlap(company: CompanyConfig, filingDate?: string): Promise<OverlapDeduplicationReport> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const processedDir = join(getFilingDirectory(company.ticker, resolvedFilingDate), "processed");
  const fileNames = shouldPersistProcessedArtifacts()
    ? await persistedOverlapInputFileNames(processedDir)
    : [
      preferredOverlapInputFileName(processedDir, "management-discussion.txt"),
      preferredOverlapInputFileName(processedDir, "risk-factors.txt"),
    ].filter((fileName): fileName is string => Boolean(fileName));
  const sortedFileNames = fileNames
    .sort();
  const sections: SectionOverlapDeduplicationReport[] = [];

  await ensureDirectory(processedDir);

  for (const fileName of sortedFileNames) {
    const inputPath = join(processedDir, fileName);
    const outputPath = join(processedDir, fileName.replace(/(?:\.deduped)?\.txt$/, ".overlap-deduped.txt"));
    const originalText = await readTextFile(inputPath);
    const result = deduplicateOverlapText(originalText);
    const finalText = `${result.text.trim()}\n`;
    const charactersRemoved = originalText.length - finalText.length;
    const reductionPercentage = originalText.length === 0 ? 0 : (charactersRemoved / originalText.length) * 100;

    await writeTextFile(outputPath, finalText);

    sections.push({
      input_file: inputPath,
      output_file: outputPath,
      original_characters: originalText.length,
      final_characters: finalText.length,
      characters_removed: charactersRemoved,
      reduction_percentage: Number(reductionPercentage.toFixed(2)),
      original_paragraphs: result.originalParagraphs,
      removed_contained: result.removedContained,
      removed_overlap: result.removedOverlap,
      final_paragraphs: result.finalParagraphs,
    });
  }

  const report: OverlapDeduplicationReport = {
    ticker: company.ticker,
    sections,
    totals: {
      original_characters: sum(sections.map((section) => section.original_characters)),
      final_characters: sum(sections.map((section) => section.final_characters)),
      characters_removed: sum(sections.map((section) => section.characters_removed)),
      removed_contained: sum(sections.map((section) => section.removed_contained)),
      removed_overlap: sum(sections.map((section) => section.removed_overlap)),
    },
  };

  const reportPath = join(processedDir, "overlap-deduplication-report.json");
  await writeJsonFile(reportPath, report);

  console.log(`Overlap deduplication report saved to: ${reportPath}`);

  for (const section of report.sections) {
    console.log(`Input: ${section.input_file}`);
    console.log(`Output: ${section.output_file}`);
    console.log(`Original characters: ${section.original_characters}`);
    console.log(`Final characters: ${section.final_characters}`);
    console.log(`Characters removed: ${section.characters_removed}`);
    console.log(`Reduction: ${section.reduction_percentage.toFixed(2)}%`);
    console.log(`Original paragraphs: ${section.original_paragraphs}`);
    console.log(`Final paragraphs: ${section.final_paragraphs}`);
    console.log(`Contained removals: ${section.removed_contained}`);
    console.log(`Overlap removals: ${section.removed_overlap}`);
    console.log("");
  }

  return report;
}

async function persistedOverlapInputFileNames(processedDir: string): Promise<string[]> {
  const processedFileNames = await readdir(processedDir);
  const processedFileNameSet = new Set(processedFileNames);

  return processedFileNames
    .filter((fileName) => fileName.endsWith(".txt"))
    .filter((fileName) => !fileName.endsWith(".overlap-deduped.txt"))
    .filter(
      (fileName) =>
        fileName.endsWith(".deduped.txt") ||
        !processedFileNameSet.has(fileName.replace(/\.txt$/, ".deduped.txt")),
    );
}

function preferredOverlapInputFileName(processedDir: string, baseFileName: string): string | null {
  const dedupedFileName = baseFileName.replace(/\.txt$/, ".deduped.txt");

  if (fileExists(join(processedDir, dedupedFileName))) {
    return dedupedFileName;
  }

  if (fileExists(join(processedDir, baseFileName))) {
    return baseFileName;
  }

  return null;
}

export function deduplicateOverlapText(text: string): {
  text: string;
  originalParagraphs: number;
  removedContained: number;
  removedOverlap: number;
  finalParagraphs: number;
} {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map(toBlock);
  const keptBlocks: ParagraphBlock[] = [];
  let removedContained = 0;
  let removedOverlap = 0;

  for (const block of paragraphs) {
    const duplicates = findNearbyDuplicates(keptBlocks, block);

    if (duplicates.length === 0) {
      keptBlocks.push(block);
      continue;
    }

    const largestDuplicate = duplicates.reduce((largest, duplicate) =>
      duplicate.block.wordCount > largest.block.wordCount ? duplicate : largest,
    );

    if (block.wordCount > largestDuplicate.block.wordCount) {
      const insertIndex = Math.min(...duplicates.map((duplicate) => duplicate.index));

      for (const duplicate of [...duplicates].sort((left, right) => right.index - left.index)) {
        if (duplicate.reason === "contained") {
          removedContained += 1;
        } else {
          removedOverlap += 1;
        }

        keptBlocks.splice(duplicate.index, 1);
      }

      keptBlocks.splice(insertIndex, 0, block);
    } else {
      const currentDuplicate = duplicates[0];

      if (currentDuplicate.reason === "contained") {
        removedContained += 1;
      } else {
        removedOverlap += 1;
      }
    }
  }

  return {
    text: keptBlocks.map((block) => block.original).join("\n\n"),
    originalParagraphs: paragraphs.length,
    removedContained,
    removedOverlap,
    finalParagraphs: keptBlocks.length,
  };
}

function findNearbyDuplicates(
  keptBlocks: ParagraphBlock[],
  block: ParagraphBlock,
): { index: number; block: ParagraphBlock; reason: "contained" | "overlap" }[] {
  const startIndex = Math.max(0, keptBlocks.length - nearbyParagraphWindow);
  const duplicates: { index: number; block: ParagraphBlock; reason: "contained" | "overlap" }[] = [];

  for (let index = keptBlocks.length - 1; index >= startIndex; index -= 1) {
    const previous = keptBlocks[index];

    if (containsParagraph(previous, block)) {
      duplicates.push({ index, block: previous, reason: "contained" });
      continue;
    }

    if (previous.wordCount < minimumComparableWords || block.wordCount < minimumComparableWords) {
      continue;
    }

    if (overlapRatio(previous, block) > highOverlapThreshold) {
      duplicates.push({ index, block: previous, reason: "overlap" });
    }
  }

  return duplicates;
}

function toBlock(paragraph: string): ParagraphBlock {
  const original = paragraph.trim();
  const words = normalizeWords(original);

  return {
    original,
    normalized: words.join(" "),
    words,
    wordSet: new Set(words),
    wordCount: words.length,
  };
}

function containsParagraph(left: ParagraphBlock, right: ParagraphBlock): boolean {
  return left.normalized.includes(right.normalized) || right.normalized.includes(left.normalized);
}

function overlapRatio(left: ParagraphBlock, right: ParagraphBlock): number {
  const leftCounts = wordCounts(left.words);
  const rightCounts = wordCounts(right.words);
  let sharedWords = 0;

  for (const [word, leftCount] of leftCounts) {
    if (!right.wordSet.has(word)) {
      continue;
    }

    const rightCount = rightCounts.get(word) ?? 0;
    sharedWords += Math.min(leftCount, rightCount);
  }

  return sharedWords / Math.max(left.wordCount, right.wordCount);
}

function wordCounts(words: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return counts;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9%$.'-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run dedupe:overlap -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    deduplicateOverlap(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
