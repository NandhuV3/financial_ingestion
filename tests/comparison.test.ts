import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { writeJsonFile } from "../src/shared/filesystem/file-writer.js";
import { getFilingDirectory } from "../src/storage/filing-paths.js";
import { getPreviousFiling } from "../src/comparison/get-previous-filing.js";
import { loadComparisonInput, loadFilingIntelligence } from "../src/comparison/load-filing-intelligence.js";
import type { Chunk } from "../src/types/chunk.types.js";
import type { FilingMetadata } from "../src/types/pipeline.types.js";
import type { ThemeOutput } from "../src/types/theme.types.js";

const ticker = "TESTC";
const filings = ["2026-01-29", "2026-04-29", "2026-07-29"];

describe("comparison foundation", () => {
  before(async () => {
    for (const filingDate of filings) {
      await writeMockFiling(filingDate);
    }
  });

  it("returns the immediately previous filing date", async () => {
    assert.equal(await getPreviousFiling(ticker, "2026-04-29"), "2026-01-29");
  });

  it("returns null when no previous filing exists", async () => {
    assert.equal(await getPreviousFiling(ticker, "2026-01-29"), null);
  });

  it("loads filing metadata and intelligence", async () => {
    const snapshot = await loadFilingIntelligence(ticker, "2026-04-29");

    assert.equal(snapshot.metadata.ticker, ticker);
    assert.equal(snapshot.metadata.filing_date, "2026-04-29");
    assert.equal(snapshot.themes.themes[0].theme, "Theme 2026-04-29");
  });

  it("loads comparison input for current and previous filings", async () => {
    const input = await loadComparisonInput(ticker, "2026-04-29");

    assert.equal(input.metadata.current_filing_date, "2026-04-29");
    assert.equal(input.metadata.previous_filing_date, "2026-01-29");
    assert.equal(input.currentFiling.metadata.filing_date, "2026-04-29");
    assert.equal(input.previousFiling?.metadata.filing_date, "2026-01-29");
    assert.equal(input.currentThemes.themes[0].theme, "Theme 2026-04-29");
    assert.equal(input.previousThemes?.themes[0].theme, "Theme 2026-01-29");
  });
});

async function writeMockFiling(filingDate: string): Promise<void> {
  const filingDir = getFilingDirectory(ticker, filingDate);
  const metadata: FilingMetadata = {
    company: "Test Company",
    ticker,
    filing_date: filingDate,
    form_type: "10-Q",
    accession_number: `test-${filingDate}`,
  };
  const themes: ThemeOutput = {
    company: "Test Company",
    ticker,
    filing_date: filingDate,
    themes: [
      {
        theme: `Theme ${filingDate}`,
        category: "growth",
        importance: "medium",
        summary: `Mock theme for ${filingDate}`,
        evidence: ["mock_001"],
      },
    ],
  };
  const chunks: Chunk[] = [
    {
      chunk_id: "mock_001",
      company: "Test Company",
      ticker,
      form_type: "10-Q",
      filing_date: filingDate,
      section: "management_discussion",
      text: `Mock chunk for ${filingDate}`,
    },
  ];

  await writeJsonFile(join(filingDir, "metadata", "filing.json"), metadata);
  await writeJsonFile(join(filingDir, "chunks", "mock.chunks.json"), chunks);
  await writeJsonFile(join(filingDir, "intelligence", "themes.json"), themes);
}
