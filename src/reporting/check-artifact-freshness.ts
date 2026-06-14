import { stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { getCompanyConfig } from "../config/companies.js";
import { formatTimestamp, getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { fileExists, readJsonFile, readTextFile } from "../shared/filesystem/file-reader.js";
import { ensureDirectory, writeJsonFile } from "../shared/filesystem/file-writer.js";
import { calculateStringHash } from "../shared/hashing/hash-file.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import type { CompanyConfig } from "../types/company.types.js";
import type {
  ArtifactFreshnessReport,
  FreshnessStatus,
  StageFreshness,
  StageName,
} from "../types/freshness.types.js";

type StageDefinition = {
  stage: StageName;
  sourceFiles: string[];
  artifactFiles: string[];
};

const stageDefinitions: StageDefinition[] = [
  {
    stage: "raw",
    sourceFiles: ["raw/filings.json"],
    artifactFiles: ["raw/latest-10q-index.html", "raw/latest-10q.html"],
  },
  {
    stage: "extraction",
    sourceFiles: ["raw/latest-10q.html"],
    artifactFiles: [
      "processed/management-discussion.txt",
      "processed/risk-factors.txt",
      "processed/extraction-diagnostics.json",
    ],
  },
  {
    stage: "dedupe",
    sourceFiles: ["processed/management-discussion.txt", "processed/risk-factors.txt"],
    artifactFiles: [
      "processed/management-discussion.deduped.txt",
      "processed/risk-factors.deduped.txt",
      "processed/deduplication-report.json",
    ],
  },
  {
    stage: "overlap_dedupe",
    sourceFiles: ["processed/management-discussion.deduped.txt", "processed/risk-factors.deduped.txt"],
    artifactFiles: [
      "processed/management-discussion.overlap-deduped.txt",
      "processed/risk-factors.overlap-deduped.txt",
      "processed/overlap-deduplication-report.json",
    ],
  },
  {
    stage: "normalization",
    sourceFiles: [
      "processed/management-discussion.overlap-deduped.txt",
      "processed/risk-factors.overlap-deduped.txt",
    ],
    artifactFiles: ["normalized/management-discussion.cleaned.txt", "normalized/risk-factors.cleaned.txt"],
  },
  {
    stage: "chunking",
    sourceFiles: ["normalized/management-discussion.cleaned.txt", "normalized/risk-factors.cleaned.txt"],
    artifactFiles: ["chunks/management-discussion.chunks.json", "chunks/risk-factors.chunks.json"],
  },
  {
    stage: "themes",
    sourceFiles: ["chunks/management-discussion.chunks.json", "chunks/risk-factors.chunks.json"],
    artifactFiles: ["intelligence/themes.json", "metadata/chunk-hash.json", "reports/theme-generation-report.json"],
  },
];

export async function checkArtifactFreshness(
  company: CompanyConfig,
  filingDate?: string,
): Promise<ArtifactFreshnessReport> {
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const filingDir = getFilingDirectory(company.ticker, resolvedFilingDate);
  const reportsDir = join(filingDir, "reports");
  const reportPath = join(reportsDir, "artifact-freshness.json");
  const previousReport = await readPreviousReport(reportPath);
  const stages = {} as Record<StageName, StageFreshness>;

  await ensureDirectory(reportsDir);

  for (const definition of stageDefinitions) {
    stages[definition.stage] = await checkStage(filingDir, definition, previousReport?.stages[definition.stage]);
  }

  const report: ArtifactFreshnessReport = {
    company: company.company,
    ticker: company.ticker,
    generated_at: getCurrentTimestamp(),
    status: summarizeFreshness(Object.values(stages).map((stage) => stage.status)),
    stages,
  };

  await writeJsonFile(reportPath, report);

  console.log(`Company: ${company.company} (${company.ticker})`);
  console.log(`Freshness: ${report.status}`);
  console.log(`Freshness report: ${reportPath}`);

  for (const [stage, freshness] of Object.entries(report.stages)) {
    console.log(`${stage}: ${freshness.status} - ${freshness.reason}`);
  }

  return report;
}

async function checkStage(
  companyDataDir: string,
  definition: StageDefinition,
  previousStage: StageFreshness | undefined,
): Promise<StageFreshness> {
  const sourcePaths = definition.sourceFiles.map((file) => join(companyDataDir, file));
  const artifactPaths = definition.artifactFiles.map((file) => join(companyDataDir, file));
  const missingSources = sourcePaths.filter((path) => !fileExists(path));
  const missingArtifacts = artifactPaths.filter((path) => !fileExists(path));
  const currentSourceHash = sourcePaths.length === 0 ? null : await hashFiles(sourcePaths);
  const storedSourceHash = previousStage?.source_hash ?? null;
  const sourceMtime = await newestMtime(sourcePaths);
  const artifactMtime = await oldestMtime(artifactPaths);
  const generatedAt = artifactMtime ? formatTimestamp(artifactMtime) : null;
  const sourceFreshnessStatus = detectSourceHashFreshness(currentSourceHash, storedSourceHash);
  const artifactOlderThanSource = Boolean(sourceMtime && artifactMtime && artifactMtime < sourceMtime);

  if (missingSources.length > 0) {
    return buildStageFreshness(definition, "failed", generatedAt, null, storedSourceHash, currentSourceHash, `Missing source files: ${formatPaths(companyDataDir, missingSources)}.`);
  }

  if (missingArtifacts.length > 0) {
    const optionalDiagnosticsMissing =
      definition.stage === "extraction" && missingArtifacts.every((path) => path.endsWith("extraction-diagnostics.json"));

    return buildStageFreshness(
      definition,
      optionalDiagnosticsMissing ? "warning" : "failed",
      generatedAt,
      currentSourceHash,
      storedSourceHash,
      currentSourceHash,
      `Missing artifact files: ${formatPaths(companyDataDir, missingArtifacts)}.`,
    );
  }

  if (sourceFreshnessStatus === "stale" || artifactOlderThanSource) {
    return buildStageFreshness(
      definition,
      "stale",
      generatedAt,
      storedSourceHash,
      storedSourceHash,
      currentSourceHash,
      sourceFreshnessStatus === "stale"
        ? "Current source hash differs from stored source hash."
        : "Artifact timestamp is older than its source file.",
    );
  }

  return buildStageFreshness(
    definition,
    "healthy",
    generatedAt,
    currentSourceHash,
    storedSourceHash,
    currentSourceHash,
    storedSourceHash ? "Source hash matches stored source hash." : "Freshness baseline initialized.",
  );
}

export function detectSourceHashFreshness(
  currentSourceHash: string | null,
  storedSourceHash: string | null,
): Extract<FreshnessStatus, "healthy" | "stale"> {
  return storedSourceHash && currentSourceHash && storedSourceHash !== currentSourceHash ? "stale" : "healthy";
}

function buildStageFreshness(
  definition: StageDefinition,
  status: FreshnessStatus,
  generatedAt: string | null,
  sourceHash: string | null,
  storedSourceHash: string | null,
  currentSourceHash: string | null,
  reason: string,
): StageFreshness {
  return {
    status,
    generated_at: generatedAt,
    source_file: definition.sourceFiles[0] ?? null,
    source_files: definition.sourceFiles,
    artifact_files: definition.artifactFiles,
    source_hash: sourceHash,
    stored_source_hash: storedSourceHash,
    current_source_hash: currentSourceHash,
    reason,
  };
}

async function hashFiles(paths: string[]): Promise<string> {
  let hashInput = "";

  for (const path of paths.sort()) {
    hashInput += `${path}\0${await readTextFile(path)}\0`;
  }

  return calculateStringHash(hashInput);
}

async function newestMtime(paths: string[]): Promise<number | null> {
  if (paths.length === 0) {
    return null;
  }

  const mtimes = await Promise.all(paths.filter((path) => fileExists(path)).map(async (path) => (await stat(path)).mtimeMs));
  return mtimes.length === 0 ? null : Math.max(...mtimes);
}

async function oldestMtime(paths: string[]): Promise<number | null> {
  if (paths.length === 0) {
    return null;
  }

  const mtimes = await Promise.all(paths.filter((path) => fileExists(path)).map(async (path) => (await stat(path)).mtimeMs));
  return mtimes.length === 0 ? null : Math.min(...mtimes);
}

async function readPreviousReport(path: string): Promise<ArtifactFreshnessReport | null> {
  if (!fileExists(path)) {
    return null;
  }

  return readJsonFile<ArtifactFreshnessReport>(path);
}

function summarizeFreshness(statuses: FreshnessStatus[]): FreshnessStatus {
  if (statuses.includes("failed")) {
    return "failed";
  }

  if (statuses.includes("stale")) {
    return "stale";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "healthy";
}

function formatPaths(companyDataDir: string, paths: string[]): string {
  return paths.map((path) => relative(companyDataDir, path)).join(", ");
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker) {
    console.error("Usage: npm run freshness:company -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    checkArtifactFreshness(company, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
