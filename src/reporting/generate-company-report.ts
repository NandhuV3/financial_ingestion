import { join } from "node:path";
import { getCompanyConfig, getCompanyDataDir } from "../config/companies.js";
import { getCurrentTimestamp } from "../shared/dates/timestamps.js";
import { ensureDirectory, writeJsonFile, writeTextFile } from "../shared/filesystem/file-writer.js";
import type { CompanyConfig } from "../types/company.types.js";
import type { CompanyPipelineReport } from "../types/report.types.js";
import { buildJsonReport } from "./formatters/build-json-report.js";
import { buildMarkdownReport } from "./formatters/build-markdown-report.js";
import { buildChunkMetrics, buildNormalizationMetrics } from "./metrics/build-company-metrics.js";
export { calculateEvidenceCoverage } from "./metrics/build-coverage-metrics.js";
import { buildThemeMetrics } from "./metrics/build-theme-metrics.js";
import { readChunks } from "./readers/read-chunks.js";
import { readExtraction, readFileMetrics, readJsonArtifact } from "./readers/read-extraction.js";
import { readFreshness } from "./readers/read-freshness.js";
import { readNormalization } from "./readers/read-normalization.js";
import { readThemes } from "./readers/read-themes.js";
import { validatePipelineHealth } from "./validators/validate-pipeline-health.js";
import { summarizeHealth } from "./validators/validate-report.js";

export async function generateCompanyReport(company: CompanyConfig): Promise<CompanyPipelineReport> {
  const companyDataDir = join(process.cwd(), "data", getCompanyDataDir(company));
  const reportsDir = join(companyDataDir, "reports");
  await ensureDirectory(reportsDir);

  const fileMetrics = await readFileMetrics(companyDataDir);
  const extraction = await readExtraction(companyDataDir);
  const deduplicationMetrics = await readJsonArtifact(join(companyDataDir, "processed", "deduplication-report.json"));
  const overlapDedupMetrics = await readJsonArtifact(join(companyDataDir, "processed", "overlap-deduplication-report.json"));
  const normalizationMetrics = buildNormalizationMetrics(await readNormalization(companyDataDir));
  const chunkMetrics = buildChunkMetrics(await readChunks(companyDataDir));
  const themeArtifact = await readThemes(companyDataDir);
  const themeMetrics = buildThemeMetrics(themeArtifact, chunkMetrics.chunk_ids);
  const artifactFreshness = await readFreshness(company);
  const healthChecks = validatePipelineHealth({
    extractionDiagnosticsAvailable: extraction.diagnostics_available,
    normalizationMetrics,
    chunkMetrics,
    themeMetrics,
    artifactFreshness,
    themeOutputExists: Boolean(themeArtifact.theme_output),
  });

  const report = buildJsonReport({
    company: company.company,
    ticker: company.ticker,
    generated_at: getCurrentTimestamp(),
    health: summarizeHealth(healthChecks),
    health_checks: healthChecks,
    files: fileMetrics,
    extraction_metrics: extraction.extraction_metrics,
    deduplication_metrics: deduplicationMetrics,
    overlap_dedup_metrics: overlapDedupMetrics,
    normalization_metrics: normalizationMetrics,
    chunk_metrics: chunkMetrics,
    theme_metrics: themeMetrics,
    artifact_freshness: artifactFreshness,
  });

  const summaryPath = join(reportsDir, "pipeline-summary.json");
  const markdownPath = join(reportsDir, "company-report.md");
  await writeJsonFile(summaryPath, report);
  await writeTextFile(markdownPath, buildMarkdownReport(report));

  console.log(`Company: ${company.company} (${company.ticker})`);
  console.log(`Health: ${report.health}`);
  console.log(`JSON report: ${summaryPath}`);
  console.log(`Markdown report: ${markdownPath}`);
  console.log(`Chunks: ${chunkMetrics.total_chunks}`);
  console.log(`Themes: ${themeMetrics.total_themes}`);
  console.log(`Health checks: ${healthChecks.length}`);

  return report;
}

if (require.main === module) {
  const ticker = process.argv[2];

  if (!ticker) {
    console.error("Usage: npm run report:company -- <ticker>");
    process.exitCode = 1;
  } else {
    const company = getCompanyConfig(ticker);

    generateCompanyReport(company).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
