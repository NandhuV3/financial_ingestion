import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Chunk } from "../../src/types/chunk.types.js";
import type { Theme, ThemeOutput } from "../../src/types/theme.types.js";

type ContractChunk = Partial<Record<keyof Pick<Chunk, "chunk_id">, unknown>>;
type ContractTheme = Partial<Record<keyof Theme, unknown>>;
type ContractThemeFile = Partial<Record<keyof Pick<ThemeOutput, "themes">, unknown>>;

const requiredThemeFields = ["theme", "category", "importance", "summary", "evidence"] as const;

describe("theme schema contract", () => {
  it("validates data/{ticker}/intelligence/themes.json files and evidence references", async () => {
    const companyDataDirs = await findCompanyDataDirs();

    assert.ok(companyDataDirs.length > 0, "Expected at least one company data directory with chunks");

    for (const companyDataDir of companyDataDirs) {
      const validChunkIds = await loadChunkIds(companyDataDir);
      const themeFilePath = join(companyDataDir, "intelligence", "themes.json");
      const themeFile = JSON.parse(await readFile(themeFilePath, "utf8")) as ContractThemeFile;

      assert.ok(Array.isArray(themeFile.themes), `${themeFilePath}: themes must be an array`);
      assert.ok(themeFile.themes.length > 0, `${themeFilePath}: expected at least one theme`);

      (themeFile.themes as ContractTheme[]).forEach((theme, index) => {
        const themeName = typeof theme.theme === "string" && theme.theme.trim() ? theme.theme : `theme[${index}]`;
        const location = `${themeFilePath}: themes[${index}] "${themeName}"`;

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

async function findCompanyDataDirs(): Promise<string[]> {
  const dataDir = join(process.cwd(), "data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const companyDataDirs: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    try {
      await readdir(join(dataDir, entry.name, "chunks"));
      companyDataDirs.push(join(dataDir, entry.name));
    } catch {
      // Non-company data directories do not have chunk outputs.
    }
  }

  return companyDataDirs.sort();
}

async function loadChunkIds(companyDataDir: string): Promise<Set<string>> {
  const chunksDir = join(companyDataDir, "chunks");
  const chunkFiles = (await readdir(chunksDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
  const chunkIds = new Set<string>();

  assert.ok(chunkFiles.length > 0, `Expected at least one chunk JSON file in ${chunksDir}`);

  for (const fileName of chunkFiles) {
    const chunks = JSON.parse(await readFile(join(chunksDir, fileName), "utf8")) as ContractChunk[];

    assert.ok(Array.isArray(chunks), `${fileName}: expected top-level JSON array`);

    chunks.forEach((chunk, index) => {
      assert.equal(typeof chunk.chunk_id, "string", `${fileName}[${index}]: chunk_id must be a string`);
      assert.notEqual(chunk.chunk_id.trim(), "", `${fileName}[${index}]: chunk_id must be non-empty`);
      chunkIds.add(chunk.chunk_id);
    });
  }

  return chunkIds;
}
