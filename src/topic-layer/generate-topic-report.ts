import { join } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { fileExists, readJsonFile } from "../shared/filesystem/file-reader.js";
import { writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import { getCompanyDirectory, getFilingDirectory } from "../storage/filing-paths.js";
import { listAvailableFilings } from "../storage/list-filings.js";
import type { Theme, ThemeOutput } from "../types/theme.types.js";
import type { TopicCandidate, TopicCandidateReport } from "./topic.types.js";

type ThemeRecord = {
  filing_date: string;
  theme: Theme;
};

const conceptKeywords = [
  {
    concept: "Artificial Intelligence",
    keywords: ["ai", "artificial intelligence", "openai", "copilot"],
  },
  {
    concept: "Foreign Exchange",
    keywords: ["foreign exchange", "currency", "exchange rate"],
  },
  {
    concept: "Cloud",
    keywords: ["cloud", "azure"],
  },
  {
    concept: "Competition",
    keywords: ["competition", "competitive", "competitor"],
  },
  {
    concept: "Cybersecurity",
    keywords: ["cybersecurity", "security", "data privacy", "privacy"],
  },
  {
    concept: "Supply Chain",
    keywords: ["supply chain", "supplier", "components"],
  },
  {
    concept: "Taxation",
    keywords: ["tax", "taxation", "tax liabilities"],
  },
  {
    concept: "Product Quality",
    keywords: ["quality", "reliability", "defects"],
  },
];

export async function discoverTopicCandidates(ticker: string): Promise<TopicCandidateReport> {
  const company = getCompanyConfig(ticker);
  const records = await loadThemeRecords(company.ticker);
  const candidates = buildTopicCandidates(records);
  const report: TopicCandidateReport = {
    company: company.company,
    ticker: company.ticker,
    candidates,
  };
  const reportsDir = join(getCompanyDirectory(company.ticker), "reports");
  const jsonPath = join(reportsDir, "topic-candidates.json");
  const markdownPath = join(reportsDir, "topic-candidates.md");

  await writeJsonFile(jsonPath, report);
  await writeTextFile(markdownPath, buildMarkdownReport(report));

  console.log(`Topic candidates saved to: ${jsonPath}`);
  console.log(`Topic candidate markdown saved to: ${markdownPath}`);
  console.log(`Candidates discovered: ${report.candidates.length}`);

  return report;
}

export function buildTopicCandidates(records: ThemeRecord[]): TopicCandidate[] {
  const candidatesByConcept = new Map<string, ThemeRecord[]>();

  for (const record of records) {
    const matchedConcepts = findMatchingConcepts(record.theme);

    for (const concept of matchedConcepts) {
      const existing = candidatesByConcept.get(concept) ?? [];
      existing.push(record);
      candidatesByConcept.set(concept, existing);
    }
  }

  return [...candidatesByConcept.entries()]
    .filter(([, candidateRecords]) => hasCandidateSignal(candidateRecords))
    .map(([concept, candidateRecords]) => ({
      candidate_id: toCandidateId(concept),
      suggested_topic_name: concept,
      categories: uniqueSorted(candidateRecords.map((record) => record.theme.category)),
      theme_variants: uniqueSorted(candidateRecords.map((record) => record.theme.theme)),
      filing_dates: uniqueSorted(candidateRecords.map((record) => record.filing_date)),
      reason:
        uniqueSorted(candidateRecords.map((record) => record.theme.category)).length > 1
          ? "recurring concept appears across multiple categories"
          : "recurring concept appears across historical themes",
    }))
    .sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));
}

async function loadThemeRecords(ticker: string): Promise<ThemeRecord[]> {
  const filings = await listAvailableFilings(ticker);
  const records: ThemeRecord[] = [];

  for (const filingDate of filings) {
    const themePath = join(getFilingDirectory(ticker, filingDate), "intelligence", "themes.json");

    if (!fileExists(themePath)) {
      continue;
    }

    const themeOutput = await readJsonFile<ThemeOutput>(themePath);

    records.push(...themeOutput.themes.map((theme) => ({ filing_date: filingDate, theme })));
  }

  return records;
}

function findMatchingConcepts(theme: Theme): string[] {
  const haystack = `${theme.theme} ${theme.category} ${theme.summary}`.toLowerCase();

  return conceptKeywords
    .filter((concept) => concept.keywords.some((keyword) => haystack.includes(keyword)))
    .map((concept) => concept.concept);
}

function hasCandidateSignal(records: ThemeRecord[]): boolean {
  const categories = new Set(records.map((record) => record.theme.category));
  const themeVariants = new Set(records.map((record) => record.theme.theme));
  const filingDates = new Set(records.map((record) => record.filing_date));

  return categories.size > 1 || themeVariants.size > 1 || filingDates.size > 1;
}

function buildMarkdownReport(report: TopicCandidateReport): string {
  const lines: string[] = [
    `# Topic Candidates: ${report.company} (${report.ticker})`,
    "",
    "These are deterministic candidates only. Human review is required before adding approved topics to data/registry/topics.json.",
    "",
  ];

  if (report.candidates.length === 0) {
    lines.push("No topic candidates discovered.");
    return `${lines.join("\n")}\n`;
  }

  for (const candidate of report.candidates) {
    lines.push(`## ${candidate.suggested_topic_name}`);
    lines.push(`- Candidate ID: ${candidate.candidate_id}`);
    lines.push(`- Reason: ${candidate.reason}`);
    lines.push(`- Categories: ${candidate.categories.join(", ")}`);
    lines.push(`- Filing dates: ${candidate.filing_dates.join(", ")}`);
    lines.push("- Theme variants:");
    lines.push(...candidate.theme_variants.map((variant) => `  - ${variant}`));
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function toCandidateId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

const ticker = process.argv[2];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run topics:discover -- <ticker>");
    process.exitCode = 1;
  } else {
    discoverTopicCandidates(ticker).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
