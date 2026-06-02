import { join } from "node:path";
import { readJsonFile } from "../shared/filesystem/file-reader.js";
import { getFilingDirectory } from "../storage/filing-paths.js";
import type { FilingMetadata } from "../types/pipeline.types.js";
import type { ThemeOutput } from "../types/theme.types.js";
import type { ComparisonInput, FilingSnapshot } from "./comparison.types.js";
import { getPreviousFiling } from "./get-previous-filing.js";

export async function loadFilingIntelligence(ticker: string, filingDate: string): Promise<FilingSnapshot> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const metadata = await readJsonFile<FilingMetadata>(join(filingDir, "metadata", "filing.json"));
  const themes = await readJsonFile<ThemeOutput>(join(filingDir, "intelligence", "themes.json"));

  return {
    metadata,
    themes,
  };
}

export async function loadComparisonInput(ticker: string, filingDate: string): Promise<ComparisonInput> {
  const previousFilingDate = await getPreviousFiling(ticker, filingDate);
  const currentFiling = await loadFilingIntelligence(ticker, filingDate);
  const previousFiling = previousFilingDate
    ? await loadFilingIntelligence(ticker, previousFilingDate)
    : null;

  return {
    metadata: {
      ticker: ticker.trim().toUpperCase(),
      current_filing_date: filingDate,
      previous_filing_date: previousFilingDate,
    },
    previousFiling,
    currentFiling,
    previousThemes: previousFiling?.themes ?? null,
    currentThemes: currentFiling?.themes ?? null,
  };
}
