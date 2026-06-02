import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { readTextFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { DeduplicationReport, SectionDeduplicationReport } from "../types/pipeline.types.js";

export async function deduplicateSections(company: CompanyConfig, filingDate?: string): Promise<DeduplicationReport> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const processedDir = join(getFilingDirectory(company.ticker, resolvedFilingDate), "processed");
  const fileNames = (await readdir(processedDir))
    .filter((fileName) => fileName.endsWith(".txt"))
    .filter((fileName) => !fileName.endsWith(".deduped.txt"))
    .sort();
  const sections: SectionDeduplicationReport[] = [];

  await ensureDirectory(processedDir);

  for (const fileName of fileNames) {
    const inputPath = join(processedDir, fileName);
    const outputPath = join(processedDir, fileName.replace(/\.txt$/, ".deduped.txt"));
    const originalText = await readTextFile(inputPath);
    const { text: deduplicatedText, duplicateBlocksRemoved } = deduplicateText(originalText);

    await writeTextFile(outputPath, deduplicatedText);

    sections.push({
      input_file: inputPath,
      output_file: outputPath,
      original_characters: originalText.length,
      deduplicated_characters: deduplicatedText.length,
      characters_removed: originalText.length - deduplicatedText.length,
      duplicate_blocks_removed: duplicateBlocksRemoved,
    });
  }

  const report: DeduplicationReport = {
    ticker: company.ticker,
    sections,
    totals: {
      original_characters: sum(sections.map((section) => section.original_characters)),
      deduplicated_characters: sum(sections.map((section) => section.deduplicated_characters)),
      characters_removed: sum(sections.map((section) => section.characters_removed)),
      duplicate_blocks_removed: sum(sections.map((section) => section.duplicate_blocks_removed)),
    },
  };

  const reportPath = join(processedDir, "deduplication-report.json");
  await writeJsonFile(reportPath, report);

  console.log(`Deduplication report saved to: ${reportPath}`);

  for (const section of report.sections) {
    const reductionPercentage =
      section.original_characters === 0
        ? 0
        : (section.characters_removed / section.original_characters) * 100;

    console.log(`Input: ${section.input_file}`);
    console.log(`Output: ${section.output_file}`);
    console.log(`Original characters: ${section.original_characters}`);
    console.log(`Deduplicated characters: ${section.deduplicated_characters}`);
    console.log(`Characters removed: ${section.characters_removed}`);
    console.log(`Reduction: ${reductionPercentage.toFixed(2)}%`);
    console.log(`Duplicate blocks removed: ${section.duplicate_blocks_removed}`);
    console.log("");
  }

  return report;
}

export function deduplicateText(text: string): { text: string; duplicateBlocksRemoved: number } {
  const normalizedText = text.replace(/\r\n/g, "\n");
  const paragraphs = normalizedText.split(/\n{2,}/);
  const dedupedParagraphs: string[] = [];
  let duplicateBlocksRemoved = 0;

  for (const paragraph of paragraphs) {
    const lineDedupedParagraph = removeConsecutiveDuplicateLines(paragraph);

    if (!lineDedupedParagraph.trim()) {
      continue;
    }

    const previousParagraph = dedupedParagraphs.at(-1);

    if (previousParagraph && equivalentBlock(previousParagraph, lineDedupedParagraph)) {
      duplicateBlocksRemoved += 1;
      continue;
    }

    dedupedParagraphs.push(lineDedupedParagraph);
  }

  return {
    text: `${dedupedParagraphs.join("\n\n").trim()}\n`,
    duplicateBlocksRemoved,
  };
}

function removeConsecutiveDuplicateLines(paragraph: string): string {
  const lines = paragraph.split("\n");
  const dedupedLines: string[] = [];

  for (const line of lines) {
    if (dedupedLines.at(-1) === line) {
      continue;
    }

    dedupedLines.push(line);
  }

  return dedupedLines.join("\n");
}

function equivalentBlock(left: string, right: string): boolean {
  return blockKey(left) === blockKey(right);
}

function blockKey(value: string): string {
  return value
    .trim()
    .replace(/^•\s*/u, "")
    .replace(/\s+/g, " ");
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run dedupe:sections -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    deduplicateSections(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
