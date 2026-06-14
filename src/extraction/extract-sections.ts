import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";
import { getCompanyConfig } from "../config/companies.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";

const importantPatterns = [
  /item\s+1\b/i,
  /item\s+1a\b/i,
  /item\s+2\b/i,
  /risk factors/i,
  /management.{0,5}s discussion/i,
  /financial statements/i,
];

type TextBlock = {
  index: number;
  tag: string;
  text: string;
  style: string;
};

type HeadingCandidate = TextBlock & {
  reason: string;
};

type ImportantMatch = HeadingCandidate & {
  matchedTerms: string[];
  nearbyText: string[];
  previousHeading?: string;
};

export async function exploreSections(company: CompanyConfig, filingDate?: string): Promise<void> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const rawFilingPath = join(filingDir, "raw", "latest-10q.html");
  const outputPath = join(filingDir, "processed", "section-headings.json");
  const html = await readFile(rawFilingPath, "utf8");
  const $ = load(html);

  $("script, style, ix\\:header, [style*='display:none']").remove();

  const textBlocks: TextBlock[] = [];

  $("body").find("div, span, td, th, a, p").each((_, element) => {
    const $element = $(element);
    const text = normalizeText($element.text());

    if (!text || text.length < 3) {
      return;
    }

    const previousText = textBlocks.at(-1)?.text;

    if (previousText === text) {
      return;
    }

    textBlocks.push({
      index: textBlocks.length,
      tag: element.tagName.toLowerCase(),
      text,
      style: $element.attr("style") ?? "",
    });
  });

  const headingCandidates: HeadingCandidate[] = [];

  for (const block of textBlocks) {
    const includesImportantTerm = importantPatterns.some((pattern) => pattern.test(block.text));
    const looksLikeItemHeading = /^item\s+\d+[a-z]?\./i.test(block.text);
    const looksLikePartHeading = /^part\s+[ivx]+\b/i.test(block.text);
    const looksStyledAsHeading =
      /font-weight:\s*700/i.test(block.style) || /text-align:\s*center/i.test(block.style);
    const isShortEnoughForHeading = block.text.length <= 180;
    const looksLikeNarrativeSentence = /^see accompanying\b/i.test(block.text);
    const looksLikeImportantSection =
      includesImportantTerm && !looksLikeNarrativeSentence && (block.text.length <= 100 || looksStyledAsHeading);

    if (isShortEnoughForHeading && (looksLikeImportantSection || looksLikeItemHeading || looksLikePartHeading)) {
      headingCandidates.push({
        ...block,
        reason: "matched SEC section keyword or item pattern",
      });
      continue;
    }

    if (
      isShortEnoughForHeading &&
      !looksLikeNarrativeSentence &&
      looksStyledAsHeading &&
      /statements|signature|exhibits|part\s/i.test(block.text)
    ) {
      headingCandidates.push({
        ...block,
        reason: "styled like a heading and matched filing vocabulary",
      });
    }
  }

  const importantMatches: ImportantMatch[] = headingCandidates
    .filter((candidate) => importantPatterns.some((pattern) => pattern.test(candidate.text)))
    .map((candidate) => {
      const matchedTerms = importantPatterns
        .filter((pattern) => pattern.test(candidate.text))
        .map((pattern) => pattern.source);
      const nearbyText = textBlocks
        .slice(candidate.index + 1, candidate.index + 6)
        .map((block) => block.text)
        .filter((text) => text !== candidate.text);
      const previousHeading = [...headingCandidates]
        .reverse()
        .find((heading) => heading.index < candidate.index)?.text;

      return {
        ...candidate,
        matchedTerms,
        nearbyText,
        previousHeading,
      };
    });

  const output = {
    sourceFile: rawFilingPath,
    totalTextBlocks: textBlocks.length,
    totalHeadingCandidates: headingCandidates.length,
    totalImportantMatches: importantMatches.length,
    headingCandidates: headingCandidates.slice(0, 150),
    importantMatches,
  };

  await writeJsonFile(outputPath, output);

  console.log(`Source file: ${rawFilingPath}`);
  console.log(`Text blocks scanned: ${textBlocks.length}`);
  console.log(`Heading candidates found: ${headingCandidates.length}`);
  console.log(`Important matches found: ${importantMatches.length}`);
  console.log(`Exploratory output saved to: ${outputPath}`);
  console.log("");
  console.log("Sample important matches:");

  for (const match of importantMatches.slice(0, 12)) {
    console.log(`- ${match.text}`);
    console.log(`  nearby: ${match.nearbyText.slice(0, 2).join(" | ")}`);
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run extract:sections -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    exploreSections(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
