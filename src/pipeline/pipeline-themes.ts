import { getCompanyConfig } from "../config/companies.js";
import {
  generateThemes,
  resolveThemePromptProvenance,
  THEME_MODEL_VERSION,
} from "../themes/generate-themes.js";
import { fileExists } from "../shared/filesystem/file-reader.js";
import { checkArtifactFreshness } from "../reporting/check-artifact-freshness.js";
import { generateCompanyReport } from "../reporting/generate-company-report.js";
import { resolveFilingDate } from "../storage/resolve-filing.js";
import {
  buildThemeGenerationReport,
  calculateFilingChunkHash,
  decideThemeGeneration,
  estimateThemeInputTokens,
  getThemeGenerationPaths,
  readStoredChunkHash,
  writeChunkHashMetadata,
  writeThemeGenerationReport,
} from "./theme-generation-cache.js";

export async function runThemePipeline(ticker: string, filingDate?: string): Promise<void> {
  const company = getCompanyConfig(ticker);
  const resolvedFilingDate = await resolveFilingDate(company.ticker, filingDate);
  const paths = getThemeGenerationPaths(company.ticker, resolvedFilingDate);
  const currentChunkHash = await calculateFilingChunkHash(company.ticker, resolvedFilingDate);
  const storedChunkHash = await readStoredChunkHash(company.ticker, resolvedFilingDate);
  const estimatedInputTokens = await estimateThemeInputTokens(company.ticker, resolvedFilingDate);
  const promptProvenance = await resolveThemePromptProvenance(company, resolvedFilingDate);
  const decision = decideThemeGeneration({
    themesExist: fileExists(paths.themesPath),
    storedChunkHash,
    currentChunkHash,
  });

  console.log(`Running theme pipeline for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);
  console.log(`Estimated input tokens: ${estimatedInputTokens}`);
  console.log(`Theme decision: ${decision.status} (${decision.reason})`);

  if (decision.shouldGenerate) {
    await generateThemes(company, resolvedFilingDate);
    await writeChunkHashMetadata(company.ticker, resolvedFilingDate, currentChunkHash);
  }

  const report = buildThemeGenerationReport({
    status: decision.status,
    reason: decision.reason,
    estimatedInputTokens,
    chunkHash: currentChunkHash,
    modelVersion: THEME_MODEL_VERSION,
    promptProvenance,
  });

  await writeThemeGenerationReport(company.ticker, resolvedFilingDate, report);
  await checkArtifactFreshness(company, resolvedFilingDate);
  await generateCompanyReport(company, resolvedFilingDate);

  console.log(`Theme generation report: ${paths.reportPath}`);
  console.log(`Theme pipeline complete for ${company.company} (${company.ticker}) ${resolvedFilingDate}`);
}

const ticker = process.argv[2];
const filingDate = process.argv[3];

if (require.main === module) {
  if (!ticker) {
    console.error("Usage: npm run pipeline:themes -- <ticker> [filing-date]");
    process.exitCode = 1;
  } else {
    runThemePipeline(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
