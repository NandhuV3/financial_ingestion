import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { QuarterChangeReport } from "../change-engine/change.types.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import { buildHeadline } from "./build-headline.js";
import {
  buildExecutiveSummary,
  buildKeyChanges,
  buildNewTopics,
  buildOpportunities,
  buildRemovedTopics,
  buildRisks,
} from "./build-key-changes.js";
import type { InvestorInsight } from "./insight.types.js";

export async function generateInvestorInsights(ticker: string, filingDate: string): Promise<InvestorInsight> {
  const company = getCompanyConfig(ticker);
  const filingDir = getFilingDirectory(company.ticker, filingDate);
  const changeReportPath = join(filingDir, "comparison", "quarter-change-report.json");
  const themesPath = join(filingDir, "intelligence", "themes.json");
  const filingMetadataPath = join(filingDir, "metadata", "filing.json");
  const changeReport = await readJsonFile<QuarterChangeReport>(changeReportPath);
  const themes = await readJsonFile<ThemeOutput>(themesPath);
  const filingMetadata = await readJsonFile<FilingMetadata>(filingMetadataPath);
  const keyChanges = buildKeyChanges(changeReport);
  const risks = buildRisks(changeReport, themes);
  const opportunities = buildOpportunities(changeReport, themes);
  const insight: InvestorInsight = {
    company: filingMetadata.company,
    ticker: filingMetadata.ticker,
    filing_date: filingMetadata.filing_date,
    previous_filing_date: changeReport.previous_filing?.filing_date ?? null,
    headline: buildHeadline(changeReport, themes),
    executive_summary: buildExecutiveSummary({
      changeReport,
      keyChanges,
      risks,
      opportunities,
    }),
    key_changes: keyChanges,
    new_topics: buildNewTopics(changeReport),
    removed_topics: buildRemovedTopics(changeReport),
    risks,
    opportunities,
    source: {
      current_filing: filingMetadata,
      previous_filing: changeReport.previous_filing,
      quarter_change_report: changeReportPath,
      themes: themesPath,
    },
  };
  const insightsDir = join(filingDir, "insights");
  const jsonPath = join(insightsDir, "investor-insight.json");
  const markdownPath = join(insightsDir, "investor-insight.md");

  await writeJsonFile(jsonPath, insight);
  await writeTextFile(markdownPath, buildMarkdownReport(insight));

  console.log(`Investor insight saved to: ${jsonPath}`);
  console.log(`Investor insight markdown saved to: ${markdownPath}`);
  console.log(`Headline: ${insight.headline}`);
  console.log(`Key changes: ${insight.key_changes.length}`);
  console.log(`Risks: ${insight.risks.length}`);
  console.log(`Opportunities: ${insight.opportunities.length}`);

  return insight;
}

function buildMarkdownReport(insight: InvestorInsight): string {
  const lines = [
    `# ${insight.company} Investor Insight`,
    "",
    `**Filing Date:** ${insight.filing_date}`,
    `**Previous Filing:** ${insight.previous_filing_date ?? "none"}`,
    "",
    `## Headline`,
    "",
    insight.headline,
    "",
    "## Executive Summary",
    "",
    insight.executive_summary,
    "",
    "## Key Changes",
    ...formatList(insight.key_changes),
    "",
    "## New Topics",
    ...formatList(insight.new_topics),
    "",
    "## Removed Topics",
    ...formatList(insight.removed_topics),
    "",
    "## Risks",
    ...formatList(insight.risks),
    "",
    "## Opportunities",
    ...formatList(insight.opportunities),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function formatList(values: string[]): string[] {
  return values.length ? values.map((value) => `- ${value}`) : ["- none"];
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker || !filingDate) {
    console.error("Usage: npm run generate:insights -- <ticker> <filing-date>");
    process.exitCode = 1;
  } else {
    generateInvestorInsights(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
