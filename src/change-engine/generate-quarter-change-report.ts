import { join } from "node:path";
import { loadComparisonInput } from "../comparison/load-filing-intelligence.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { getFilingSubdirectory } from "../storage/filing-paths.js";
import type { ChangeType, QuarterChange, QuarterChangeReport } from "./change.types.js";
import { compareFilings } from "./compare-filings.js";
import { compareTopics } from "./compare-topics.js";
import type { TopicAwareThemeOutput, TopicChangeType } from "./topic-change.types.js";

export async function generateQuarterChangeReport(ticker: string, filingDate: string): Promise<QuarterChangeReport> {
  const comparisonInput = await loadComparisonInput(ticker, filingDate);
  const report = compareFilings(comparisonInput);
  const previousTopicThemes = comparisonInput.previousFiling
    ? await loadTopicAwareThemes(ticker, comparisonInput.previousFiling.metadata.filing_date)
    : null;
  const currentTopicThemes = await loadTopicAwareThemes(ticker, comparisonInput.currentFiling.metadata.filing_date);
  const topicComparison = compareTopics(previousTopicThemes, currentTopicThemes);
  const enhancedReport: QuarterChangeReport = {
    ...report,
    topic_changes: topicComparison.topic_changes,
    topic_summary: topicComparison.topic_summary,
  };
  const comparisonDir = getFilingSubdirectory(enhancedReport.ticker, enhancedReport.current_filing.filing_date, "comparison");
  const jsonPath = join(comparisonDir, "quarter-change-report.json");
  const markdownPath = join(comparisonDir, "quarter-change-report.md");

  await writeJsonFile(jsonPath, enhancedReport);
  await writeTextFile(markdownPath, buildMarkdownReport(enhancedReport));

  console.log(`Quarter change report saved to: ${jsonPath}`);
  console.log(`Quarter change markdown saved to: ${markdownPath}`);
  console.log(`New categories: ${enhancedReport.summary.new_categories}`);
  console.log(`Removed categories: ${enhancedReport.summary.removed_categories}`);
  console.log(`Importance increases: ${enhancedReport.summary.importance_increases}`);
  console.log(`Importance decreases: ${enhancedReport.summary.importance_decreases}`);
  console.log(`Evidence increases: ${enhancedReport.summary.evidence_increases}`);
  console.log(`Evidence decreases: ${enhancedReport.summary.evidence_decreases}`);
  console.log(`Persisted topics: ${enhancedReport.topic_summary.persisted_topics}`);
  console.log(`Evolved topics: ${enhancedReport.topic_summary.evolved_topics}`);
  console.log(`Intensified topics: ${enhancedReport.topic_summary.intensified_topics}`);
  console.log(`Weakened topics: ${enhancedReport.topic_summary.weakened_topics}`);

  return enhancedReport;
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
  appendTopicEvolution(lines, report);

  return `${lines.join("\n")}\n`;
}

async function loadTopicAwareThemes(ticker: string, filingDate: string): Promise<TopicAwareThemeOutput> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const topicPath = join(filingDir, "intelligence", "themes.with-topics.json");
  const fallbackPath = join(filingDir, "intelligence", "themes.json");

  return readJsonFile<TopicAwareThemeOutput>(fileExists(topicPath) ? topicPath : fallbackPath);
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

function appendTopicEvolution(lines: string[], report: QuarterChangeReport): void {
  lines.push("## Topic Evolution");
  lines.push("");
  appendTopicList(lines, "Persisted Topics", filterTopicChanges(report, "TOPIC_PERSISTED"));
  appendTopicList(lines, "Evolved Topics", filterTopicChanges(report, "TOPIC_EVOLVED"));
  appendTopicList(lines, "Intensified Topics", filterTopicChanges(report, "TOPIC_INTENSIFIED"));
  appendTopicList(lines, "Weakened Topics", filterTopicChanges(report, "TOPIC_WEAKENED"));
}

function appendTopicList(lines: string[], title: string, changes: QuarterChangeReport["topic_changes"]): void {
  lines.push(`### ${title}`);
  lines.push("");

  if (changes.length === 0) {
    lines.push("- none");
    lines.push("");
    return;
  }

  for (const change of changes) {
    lines.push(`- ${change.topic_id}`);
    lines.push(`  Themes: ${change.previous_theme_names.join("; ") || "none"} -> ${change.current_theme_names.join("; ") || "none"}`);
    lines.push(`  Importance: ${change.previous_importance} -> ${change.current_importance}`);
    lines.push(`  Evidence: ${change.previous_evidence_count} -> ${change.current_evidence_count} references`);
  }

  lines.push("");
}

function filterChanges(changes: QuarterChange[], changeType: ChangeType): QuarterChange[] {
  return changes
    .filter((change) => change.change_type === changeType)
    .sort((left, right) => left.category.localeCompare(right.category));
}

function filterTopicChanges(report: QuarterChangeReport, changeType: TopicChangeType): QuarterChangeReport["topic_changes"] {
  return report.topic_changes
    .filter((change) => change.change_type === changeType)
    .sort((left, right) => left.topic_id.localeCompare(right.topic_id));
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
