import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { listAvailableFilings } from "../storage/list-filings.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { findTopicForTheme, loadTopicRegistry } from "./topic-registry.js";
import type { TopicAssignment, TopicAssignmentOutput, TopicAssignmentReport, TopicRegistry } from "./topic.types.js";

export async function assignTopicsForCompany(ticker: string): Promise<TopicAssignmentReport> {
  const company = getCompanyConfig(ticker);
  const registry = await loadTopicRegistry();
  const filings = await listAvailableFilings(company.ticker);
  const assignments: TopicAssignment[] = [];
  const topicFrequencyByQuarter: Record<string, Record<string, number>> = {};
  let totalThemes = 0;
  let assignedThemes = 0;

  for (const filingDate of filings) {
    const themePath = join(getFilingDirectory(company.ticker, filingDate), "intelligence", "themes.json");

    if (!fileExists(themePath)) {
      continue;
    }

    const themeOutput = await readJsonFile<ThemeOutput>(themePath);
    const assignedOutput = assignTopicsToThemeOutput(themeOutput, registry);
    const filingAssignments = buildTopicAssignments(assignedOutput);
    const topicOutputPath = join(getFilingDirectory(company.ticker, filingDate), "intelligence", "themes.with-topics.json");

    await writeJsonFile(topicOutputPath, assignedOutput);

    assignments.push(...filingAssignments);
    totalThemes += assignedOutput.themes.length;
    assignedThemes += assignedOutput.themes.filter((theme) => theme.topic_id).length;
    topicFrequencyByQuarter[filingDate] = countTopics(assignedOutput);
  }

  const unassignedThemes = assignments.filter((assignment) => assignment.assignment_status === "unknown");
  const report: TopicAssignmentReport = {
    company: company.company,
    ticker: company.ticker,
    total_themes: totalThemes,
    assigned_themes: assignedThemes,
    unknown_themes: unassignedThemes.length,
    topic_coverage: totalThemes === 0 ? 0 : Number(((assignedThemes / totalThemes) * 100).toFixed(2)),
    unknown_topics: uniqueSorted(unassignedThemes.map((assignment) => assignment.category)),
    unassigned_themes: unassignedThemes,
    topic_frequency_by_quarter: topicFrequencyByQuarter,
  };
  const reportPath = join(getCompanyDirectory(company.ticker), "reports", "topic-assignment-report.json");

  await writeJsonFile(reportPath, report);

  console.log(`Topic assignment report saved to: ${reportPath}`);
  console.log(`Total themes: ${report.total_themes}`);
  console.log(`Assigned themes: ${report.assigned_themes}`);
  console.log(`Unknown themes: ${report.unknown_themes}`);
  console.log(`Topic coverage: ${report.topic_coverage}%`);

  return report;
}

export function assignTopicsToThemeOutput(
  themeOutput: ThemeOutput,
  registry: TopicRegistry,
): TopicAssignmentOutput {
  return {
    company: themeOutput.company,
    ticker: themeOutput.ticker,
    filing_date: themeOutput.filing_date,
    themes: themeOutput.themes.map((theme) => {
      const topic = findTopicForTheme({
        category: theme.category,
        theme: theme.theme,
        registry,
      });

      return {
        ...theme,
        topic_id: topic?.topic_id ?? null,
      };
    }),
  };
}

function buildTopicAssignments(output: TopicAssignmentOutput): TopicAssignment[] {
  return output.themes.map((theme) => ({
    filing_date: output.filing_date,
    theme: theme.theme,
    category: theme.category,
    topic_id: theme.topic_id,
    assignment_status: theme.topic_id ? "assigned" : "unknown",
  }));
}

function countTopics(output: TopicAssignmentOutput): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const theme of output.themes) {
    const topicId = theme.topic_id ?? "unknown";
    counts[topicId] = (counts[topicId] ?? 0) + 1;
  }

  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

const ticker = process.argv[2];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run topics:assign -- <ticker>");
    process.exitCode = 1;
  } else {
    assignTopicsForCompany(ticker).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
