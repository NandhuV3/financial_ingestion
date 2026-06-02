import { join } from "node:path";
import { writeJsonFile } from "../shared/filesystem/file-writer.js";
import { getFilingSubdirectory } from "../storage/filing-paths.js";
import type { QuarterDelta } from "./comparison.types.js";
import { compareThemes } from "./compare-themes.js";
import { loadComparisonInput } from "./load-filing-intelligence.js";

export async function generateQuarterDelta(ticker: string, filingDate: string): Promise<QuarterDelta> {
  const comparisonInput = await loadComparisonInput(ticker, filingDate);
  const comparison = compareThemes(comparisonInput.previousThemes, comparisonInput.currentThemes);
  const delta: QuarterDelta = {
    company: comparisonInput.currentFiling.metadata.company,
    ticker: comparisonInput.currentFiling.metadata.ticker,
    previous_filing: comparisonInput.previousFiling?.metadata ?? null,
    current_filing: comparisonInput.currentFiling.metadata,
    summary: {
      new_count: comparison.newThemes.length,
      removed_count: comparison.removedThemes.length,
      unchanged_count: comparison.unchangedThemes.length,
    },
    new_themes: comparison.newThemes,
    removed_themes: comparison.removedThemes,
    unchanged_themes: comparison.unchangedThemes,
  };
  const comparisonDir = getFilingSubdirectory(ticker, filingDate, "comparison");
  const outputPath = join(comparisonDir, "quarter-delta.json");

  await writeJsonFile(outputPath, delta);

  console.log(`Quarter delta saved to: ${outputPath}`);
  console.log(`New themes: ${delta.summary.new_count}`);
  console.log(`Removed themes: ${delta.summary.removed_count}`);
  console.log(`Unchanged themes: ${delta.summary.unchanged_count}`);

  return delta;
}

if (require.main === module) {
  const ticker = process.argv[2];
  const filingDate = process.argv[3];

  if (!ticker || !filingDate) {
    console.error("Usage: tsx src/comparison/generate-quarter-delta.ts <ticker> <filing-date>");
    process.exitCode = 1;
  } else {
    generateQuarterDelta(ticker, filingDate).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
