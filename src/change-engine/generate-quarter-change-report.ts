import { join } from "node:path";
import { loadComparisonInput } from "../comparison/load-filing-intelligence.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingSubdirectory } from "../storage/filing-paths.js";
import type { ChangeType, QuarterChange, QuarterChangeReport } from "./change.types.js";
import { compareFilings } from "./compare-filings.js";

export async function generateQuarterChangeReport(ticker: string, filingDate: string): Promise<QuarterChangeReport> {
  const comparisonInput = await loadComparisonInput(ticker, filingDate);
  const report = compareFilings(comparisonInput);
  const comparisonDir = getFilingSubdirectory(report.ticker, report.current_filing.filing_date, "comparison");
  const jsonPath = join(comparisonDir, "quarter-change-report.json");
  const markdownPath = join(comparisonDir, "quarter-change-report.md");

  await writeJsonFile(jsonPath, report);
  await writeTextFile(markdownPath, buildMarkdownReport(report));

  console.log(`Quarter change report saved to: ${jsonPath}`);
  console.log(`Quarter change markdown saved to: ${markdownPath}`);
  console.log(`New categories: ${report.summary.new_categories}`);
  console.log(`Removed categories: ${report.summary.removed_categories}`);
  console.log(`Importance increases: ${report.summary.importance_increases}`);
  console.log(`Importance decreases: ${report.summary.importance_decreases}`);
  console.log(`Evidence increases: ${report.summary.evidence_increases}`);
  console.log(`Evidence decreases: ${report.summary.evidence_decreases}`);

  return report;
}

export function buildMarkdownReport(report: QuarterChangeReport): string {
  const lines: string[] = [
    `# ${report.company} Quarter Change Report`,
    "",
    "Current Filing:",
    report.current_filing.filing_date,
    "",
    "Previous Filing:",
    report.previous_filing?.filing_date ?? "none",
    "",
    "## Summary",
    `- New categories: ${report.summary.new_categories}`,
    `- Removed categories: ${report.summary.removed_categories}`,
    `- Importance increases: ${report.summary.importance_increases}`,
    `- Importance decreases: ${report.summary.importance_decreases}`,
    `- Evidence increases: ${report.summary.evidence_increases}`,
    `- Evidence decreases: ${report.summary.evidence_decreases}`,
    "",
  ];

  appendCategoryList(lines, "New Categories", filterChanges(report.changes, "NEW_CATEGORY"));
  appendCategoryList(lines, "Removed Categories", filterChanges(report.changes, "REMOVED_CATEGORY"));
  appendImportanceList(lines, "Importance Increased", filterChanges(report.changes, "IMPORTANCE_INCREASED"));
  appendImportanceList(lines, "Importance Decreased", filterChanges(report.changes, "IMPORTANCE_DECREASED"));
  appendEvidenceList(lines, [
    ...filterChanges(report.changes, "EVIDENCE_INCREASED"),
    ...filterChanges(report.changes, "EVIDENCE_DECREASED"),
  ]);

  return `${lines.join("\n")}\n`;
}

function appendCategoryList(lines: string[], title: string, changes: QuarterChange[]): void {
  lines.push(`## ${title}`);
  lines.push("");

  if (changes.length === 0) {
    lines.push("- none");
    lines.push("");
    return;
  }

  for (const change of changes) {
    lines.push(`- ${change.category}`);
  }

  lines.push("");
}

function appendImportanceList(lines: string[], title: string, changes: QuarterChange[]): void {
  lines.push(`## ${title}`);
  lines.push("");

  if (changes.length === 0) {
    lines.push("- none");
    lines.push("");
    return;
  }

  for (const change of changes) {
    lines.push(`- ${change.category}`);
    lines.push(`  ${change.previous_importance} -> ${change.current_importance}`);
  }

  lines.push("");
}

function appendEvidenceList(lines: string[], changes: QuarterChange[]): void {
  lines.push("## Evidence Changes");
  lines.push("");

  if (changes.length === 0) {
    lines.push("- none");
    lines.push("");
    return;
  }

  for (const change of changes.sort((left, right) => left.category.localeCompare(right.category))) {
    lines.push(`- ${change.category}`);
    lines.push(`  ${change.previous_evidence_count} -> ${change.current_evidence_count} references`);
  }

  lines.push("");
}

function filterChanges(changes: QuarterChange[], changeType: ChangeType): QuarterChange[] {
  return changes
    .filter((change) => change.change_type === changeType)
    .sort((left, right) => left.category.localeCompare(right.category));
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    console.error("Usage: npm run compare:changes -- <ticker> <filing-date>");
    process.exitCode = 1;
  } else {
    generateQuarterChangeReport(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
