import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Chunk } from "../../src/types/chunk.types.js";
import type { Theme, ThemeOutput } from "../../src/types/theme.types.js";

type ContractChunk = Partial<Record<keyof Pick<Chunk, "chunk_id">, unknown>>;
type ContractTheme = Partial<Record<keyof Theme, unknown>>;
type ContractThemeFile = Partial<Record<keyof Pick<ThemeOutput, "themes">, unknown>>;
type ThemeFileContext = {
  ticker: string;
  filingDate: string;
  filingDir: string;
  filePath: string;
};

const requiredThemeFields = ["theme", "category", "importance", "summary", "evidence"] as const;

describe("theme schema contract", () => {
  it("validates all data/{ticker}/filings/{filingDate}/intelligence/themes.json files and evidence references", async () => {
    const themeFiles = await findThemeFiles();

    assert.ok(
      themeFiles.length > 0,
      "Expected at least one themes JSON file in data/{ticker}/filings/{filingDate}/intelligence",
    );

    for (const { ticker, filingDate, filingDir, filePath: themeFilePath } of themeFiles) {
      const context = `ticker=${ticker} filingDate=${filingDate} file=${themeFilePath}`;
      const validChunkIds = await loadChunkIds({ ticker, filingDate, filingDir });
      const themeFile = JSON.parse(await readFile(themeFilePath, "utf8")) as ContractThemeFile;

      assert.ok(Array.isArray(themeFile.themes), `${context}: themes must be an array`);
      assert.ok(themeFile.themes.length > 0, `${context}: expected at least one theme`);

      (themeFile.themes as ContractTheme[]).forEach((theme, index) => {
        const themeName = typeof theme.theme === "string" && theme.theme.trim() ? theme.theme : `theme[${index}]`;
        const location = `${context} themes[${index}] "${themeName}"`;

        for (const field of requiredThemeFields) {
          assert.ok(field in theme, `${location}: missing required field "${field}"`);
        }

        assert.equal(typeof theme.theme, "string", `${location}: theme must be a string`);
        assert.notEqual(theme.theme.trim(), "", `${location}: theme must be non-empty`);

        assert.equal(typeof theme.category, "string", `${location}: category must be a string`);
        assert.notEqual(theme.category.trim(), "", `${location}: category must be non-empty`);

        assert.equal(typeof theme.importance, "string", `${location}: importance must be a string`);
        assert.notEqual(theme.importance.trim(), "", `${location}: importance must be non-empty`);

        assert.equal(typeof theme.summary, "string", `${location}: summary must be a string`);
        assert.notEqual(theme.summary.trim(), "", `${location}: summary must be non-empty`);

        assert.ok(Array.isArray(theme.evidence), `${location}: evidence must be an array`);
        assert.ok(theme.evidence.length > 0, `${location}: evidence array must not be empty`);

        theme.evidence.forEach((evidenceId, evidenceIndex) => {
          assert.equal(typeof evidenceId, "string", `${location}: evidence[${evidenceIndex}] must be a string`);
          assert.ok(
            validChunkIds.has(evidenceId),
            `${location}: evidence[${evidenceIndex}] references unknown chunk_id "${evidenceId}"`,
          );
        });
      });
    }
  });
});

async function findThemeFiles(): Promise<ThemeFileContext[]> {
  const dataDir = join(process.cwd(), "data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const themeFiles: ThemeFileContext[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const ticker = entry.name;
    const companyDir = join(dataDir, entry.name);

    try {
      const filings = await readdir(join(companyDir, "filings"), { withFileTypes: true });

      for (const filing of filings) {
        if (!filing.isDirectory()) {
          continue;
        }

        const filingDate = filing.name;
        const filingDir = join(companyDir, "filings", filing.name);
        const intelligenceDir = join(filingDir, "intelligence");

        try {
          const files = await readdir(intelligenceDir);

          themeFiles.push(
            ...files
              .filter((fileName) => fileName.endsWith(".json"))
              .map((fileName) => ({
                ticker,
                filingDate,
                filingDir,
                filePath: join(intelligenceDir, fileName),
              })),
          );
        } catch {
          // Some filings may be ingested but not processed through theme generation yet.
        }
      }
    } catch {
      // Non-company data directories do not have filing outputs.
    }
  }

  return themeFiles.sort((left, right) => left.filePath.localeCompare(right.filePath));
}

async function loadChunkIds(context: Pick<ThemeFileContext, "ticker" | "filingDate" | "filingDir">): Promise<Set<string>> {
  const chunksDir = join(context.filingDir, "chunks");
  const chunkIds = new Set<string>();
  const location = `ticker=${context.ticker} filingDate=${context.filingDate} chunksDir=${chunksDir}`;
  let chunkFiles: string[];

  try {
    chunkFiles = (await readdir(chunksDir))
      .filter((fileName) => fileName.endsWith(".json"))
      .sort();
  } catch {
    assert.fail(`${location}: missing chunks directory required for theme evidence validation`);
  }

  assert.ok(chunkFiles.length > 0, `${location}: expected at least one chunk JSON file`);

  for (const fileName of chunkFiles) {
    const filePath = join(chunksDir, fileName);
    const chunks = JSON.parse(await readFile(filePath, "utf8")) as ContractChunk[];

    assert.ok(Array.isArray(chunks), `${location} file=${filePath}: expected top-level JSON array`);

    chunks.forEach((chunk, index) => {
      const chunkLocation = `${location} file=${filePath} chunk[${index}]`;

      assert.equal(typeof chunk.chunk_id, "string", `${chunkLocation}: chunk_id must be a string`);
      assert.notEqual(chunk.chunk_id.trim(), "", `${chunkLocation}: chunk_id must be non-empty`);
      chunkIds.add(chunk.chunk_id);
    });
  }

  return chunkIds;
}
