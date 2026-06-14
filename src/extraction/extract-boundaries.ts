import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";
import { getCompanyConfig } from "../config/companies.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";

type TextBlock = {
  index: number;
  text: string;
  tag: string;
  style: string;
  insideTable: boolean;
  hasAnchor: boolean;
  inMainContent: boolean;
};

type HeadingCandidate = {
  candidateNumber: number;
  blockIndex: number;
  text: string;
  tag: string;
  insideTable: boolean;
  hasAnchor: boolean;
  inMainContent: boolean;
  looksLikeHeading: boolean;
  followingCharacters: number;
  rejectedReasons: string[];
  score: number;
};

type ExtractionDiagnostic = {
  section: string;
  candidates_found: number;
  selected_candidate: number | null;
  extracted_characters: number;
  candidates: HeadingCandidate[];
};

export async function extractBoundaries(company: CompanyConfig, filingDate?: string): Promise<void> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const rawFilingPath = join(filingDir, "raw", "latest-10q.html");
  const processedDir = join(filingDir, "processed");
  const managementOutputPath = join(processedDir, "management-discussion.txt");
  const riskOutputPath = join(processedDir, "risk-factors.txt");
  const diagnosticsOutputPath = join(processedDir, "extraction-diagnostics.json");
  const html = await readFile(rawFilingPath, "utf8");
  const $ = load(html);

  $("script, style, ix\\:header, [style*='display:none']").remove();

  const blocks: TextBlock[] = [];

  $("body").find("div, p, span, td, th").each((_, element) => {
    const $element = $(element);
    const text = normalizeText($element.text());

    if (!text || text.length < 3) {
      return;
    }

    if (blocks.at(-1)?.text === text) {
      return;
    }

    blocks.push({
      index: blocks.length,
      text,
      tag: element.tagName.toLowerCase(),
      style: $element.attr("style") ?? "",
      insideTable: $element.parents("table").length > 0,
      hasAnchor: $element.is("a") || $element.parents("a").length > 0 || $element.find("a").length > 0,
      inMainContent: $element.hasClass("main-content-container") || $element.parents(".main-content-container").length > 0,
    });
  });

  const managementSelection = selectBestHeadingCandidate(blocks, "management_discussion", isManagementHeading);
  const riskSelection = selectBestHeadingCandidate(blocks, "risk_factors", isRiskFactorsHeading);
  const financialStatementsSelection = selectBestHeadingCandidate(
    blocks,
    "financial_statements",
    isFinancialStatementsHeading,
  );
  const managementStart = managementSelection.selectedIndex;
  const riskStart = riskSelection.selectedIndex;
  const financialStatementsStart = financialStatementsSelection.selectedIndex;

  if (managementStart === -1) {
    throw new Error("Could not find Management's Discussion heading.");
  }

  if (riskStart === -1) {
    throw new Error("Could not find Risk Factors heading.");
  }

  const managementText = collectSectionText(blocks, managementStart);
  const riskFactorsText = collectSectionText(blocks, riskStart);
  const diagnostics: ExtractionDiagnostic[] = [
    {
      section: "management_discussion",
      candidates_found: managementSelection.candidates.length,
      selected_candidate: managementSelection.selectedCandidateNumber,
      extracted_characters: managementText.length,
      candidates: managementSelection.candidates,
    },
    {
      section: "risk_factors",
      candidates_found: riskSelection.candidates.length,
      selected_candidate: riskSelection.selectedCandidateNumber,
      extracted_characters: riskFactorsText.length,
      candidates: riskSelection.candidates,
    },
    {
      section: "financial_statements",
      candidates_found: financialStatementsSelection.candidates.length,
      selected_candidate: financialStatementsSelection.selectedCandidateNumber,
      extracted_characters: 0,
      candidates: financialStatementsSelection.candidates,
    },
  ];

  await writeTextFile(managementOutputPath, `${managementText}\n`);
  await writeTextFile(riskOutputPath, `${riskFactorsText}\n`);
  await writeJsonFile(diagnosticsOutputPath, diagnostics);

  console.log(`Source file: ${rawFilingPath}`);
  console.log(`Text blocks scanned: ${blocks.length}`);
  console.log(`Financial Statements candidate: ${describeCandidate(blocks, financialStatementsStart)}`);
  console.log(`Management Discussion candidate: ${describeCandidate(blocks, managementStart)}`);
  console.log(`Risk Factors candidate: ${describeCandidate(blocks, riskStart)}`);
  console.log(`Management Discussion characters: ${managementText.length}`);
  console.log(`Risk Factors characters: ${riskFactorsText.length}`);
  console.log("Extraction diagnostics:");
  console.log(JSON.stringify(diagnostics.map(({ candidates, ...summary }) => summary), null, 2));
  console.log("Candidate positions:");
  for (const diagnostic of diagnostics) {
    console.log(`${diagnostic.section}:`);
    for (const candidate of diagnostic.candidates) {
      console.log(
        `  #${candidate.candidateNumber} block=${candidate.blockIndex} selected=${
          candidate.candidateNumber === diagnostic.selected_candidate
        } main=${candidate.inMainContent} table=${candidate.insideTable} anchor=${candidate.hasAnchor} following=${
          candidate.followingCharacters
        } score=${candidate.score} text="${candidate.text.slice(0, 160)}"`,
      );
    }
  }
  console.log(`Management Discussion saved to: ${managementOutputPath}`);
  console.log(`Risk Factors saved to: ${riskOutputPath}`);
  console.log(`Extraction diagnostics saved to: ${diagnosticsOutputPath}`);
  console.log("");
  console.log("Management Discussion sample:");
  console.log(managementText.slice(0, 700));
  console.log("");
  console.log("Risk Factors sample:");
  console.log(riskFactorsText.slice(0, 700));
}

function selectBestHeadingCandidate(
  blocks: TextBlock[],
  section: string,
  predicate: (text: string) => boolean,
): { selectedIndex: number; selectedCandidateNumber: number | null; candidates: HeadingCandidate[] } {
  const candidates = blocks
    .filter((block) => predicate(block.text))
    .map((block, index) => buildHeadingCandidate(blocks, block, index + 1));
  const eligibleCandidates = candidates.filter((candidate) => candidate.rejectedReasons.length === 0);

  if (eligibleCandidates.length === 0) {
    return {
      selectedIndex: -1,
      selectedCandidateNumber: null,
      candidates,
    };
  }

  const selectedCandidate = eligibleCandidates.reduce((best, candidate) => {
    if (candidate.score > best.score) {
      return candidate;
    }

    if (candidate.score === best.score && candidate.blockIndex > best.blockIndex) {
      return candidate;
    }

    return best;
  });

  console.log(
    `Selected ${section} candidate #${selectedCandidate.candidateNumber} at block ${selectedCandidate.blockIndex}`,
  );

  return {
    selectedIndex: selectedCandidate.blockIndex,
    selectedCandidateNumber: selectedCandidate.candidateNumber,
    candidates,
  };
}

function buildHeadingCandidate(blocks: TextBlock[], block: TextBlock, candidateNumber: number): HeadingCandidate {
  const followingCharacters = countFollowingCharacters(blocks, block.index);
  const rejectedReasons: string[] = [];
  const headingLike = looksLikeHeading(block);

  if (block.insideTable) {
    rejectedReasons.push("inside_table");
  }

  if (block.hasAnchor) {
    rejectedReasons.push("anchor_or_toc_link");
  }

  if (!headingLike) {
    rejectedReasons.push("not_heading_like");
  }

  if (looksLikeNarrativeReference(block.text)) {
    rejectedReasons.push("narrative_reference");
  }

  return {
    candidateNumber,
    blockIndex: block.index,
    text: block.text,
    tag: block.tag,
    insideTable: block.insideTable,
    hasAnchor: block.hasAnchor,
    inMainContent: block.inMainContent,
    looksLikeHeading: headingLike,
    followingCharacters,
    rejectedReasons,
    score: scoreHeadingCandidate(block, followingCharacters),
  };
}

function scoreHeadingCandidate(block: TextBlock, followingCharacters: number): number {
  let score = block.index;

  if (block.inMainContent) {
    score += 100_000;
  }

  if (followingCharacters >= 1000) {
    score += 50_000;
  }

  if (/^item\s+\d+[a-z]?\./i.test(block.text)) {
    score += 10_000;
  }

  if (/font-weight:\s*700/i.test(block.style) || /text-align:\s*center/i.test(block.style)) {
    score += 5_000;
  }

  return score;
}

function countFollowingCharacters(blocks: TextBlock[], startIndex: number): number {
  let total = 0;
  const startText = normalizeForMatch(blocks[startIndex].text);

  for (const block of blocks.slice(startIndex + 1)) {
    if (block.insideTable) {
      continue;
    }

    if (!block.inMainContent && looksLikeHeading(block)) {
      continue;
    }

    if (isDuplicateHeadingFragment(startText, block.text)) {
      continue;
    }

    if (isNextMajorHeading(block)) {
      break;
    }

    total += block.text.length;

    if (total >= 10_000) {
      break;
    }
  }

  return total;
}

function collectSectionText(blocks: TextBlock[], startIndex: number): string {
  const collected: string[] = [blocks[startIndex].text];
  const startText = normalizeForMatch(blocks[startIndex].text);

  for (const block of blocks.slice(startIndex + 1)) {
    if (block.insideTable) {
      continue;
    }

    if (!block.inMainContent && looksLikeHeading(block)) {
      continue;
    }

    if (isDuplicateHeadingFragment(startText, block.text)) {
      continue;
    }

    if (isNextMajorHeading(block)) {
      break;
    }

    if (block.text.length < 25 && !looksLikeHeading(block)) {
      continue;
    }

    if (collected.at(-1) !== block.text) {
      collected.push(block.text);
    }
  }

  return collected.join("\n\n");
}

function isDuplicateHeadingFragment(normalizedHeading: string, text: string): boolean {
  const normalizedText = normalizeForMatch(text);

  if (!normalizedText) {
    return false;
  }

  return normalizedText === normalizedHeading || normalizedHeading.includes(normalizedText);
}

function isManagementHeading(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return (
    normalized.includes("management") &&
    normalized.includes("discussion") &&
    normalized.includes("analysis")
  );
}

function isRiskFactorsHeading(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return normalized.includes("risk") && normalized.includes("factor");
}

function isFinancialStatementsHeading(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return (
    normalized === "financial statements" ||
    normalized === "item 1 financial statements" ||
    /^item 1\b/.test(normalized) && normalized.includes("financial") && normalized.includes("statement")
  );
}

function isNextMajorHeading(block: TextBlock): boolean {
  const normalized = normalizeForMatch(block.text);

  return (
    /^item \d+[a-z]?\b/.test(normalized) ||
    /^part [ivx]+\b/.test(normalized) ||
    normalized === "signature"
  );
}

function looksLikeHeading(block: TextBlock): boolean {
  const normalized = normalizeForMatch(block.text);
  const styledAsHeading = /font-weight:\s*700/i.test(block.style) || /text-align:\s*center/i.test(block.style);
  const shortEnough = block.text.length <= 180;

  return (
    shortEnough &&
    !looksLikeNarrativeReference(block.text) &&
    (styledAsHeading ||
      /^item \d+[a-z]?\b/.test(normalized) ||
      /^part [ivx]+\b/.test(normalized) ||
      isManagementHeading(block.text) ||
      isRiskFactorsHeading(block.text) ||
      isFinancialStatementsHeading(block.text))
  );
}

function looksLikeNarrativeReference(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return (
    normalized.startsWith("refer to ") ||
    normalized.startsWith("see ") ||
    normalized.startsWith("this report includes") ||
    normalized.includes("forward looking statements may appear") ||
    normalized.includes("we describe risks and uncertainties")
  );
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeForMatch(text: string): string {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function describeCandidate(blocks: TextBlock[], index: number): string {
  if (index === -1) {
    return "not found";
  }

  const block = blocks[index];
  return `#${block.index} ${block.insideTable ? "table" : "body"} "${block.text}"`;
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run extract:boundaries -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    extractBoundaries(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
