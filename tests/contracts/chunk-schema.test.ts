import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Chunk } from "../../src/types/chunk.types.js";

type ContractChunk = Partial<Record<keyof Chunk, unknown>>;
type ChunkFileContext = {
  ticker: string;
  filingDate: string;
  filePath: string;
};

const requiredFields = ["chunk_id", "company", "ticker", "filing_date", "form_type", "section", "text"] as const;

describe("chunk schema contract", () => {
  it("validates all data/{ticker}/filings/{filingDate}/chunks/*.json files", async () => {
    const chunkFiles = await findChunkFiles();

    assert.ok(
      chunkFiles.length > 0,
      "Expected at least one chunk JSON file in data/{ticker}/filings/{filingDate}/chunks",
    );

    const seenChunkIdsByFiling = new Map<string, Set<string>>();

    for (const { ticker, filingDate, filePath } of chunkFiles) {
      const chunks = JSON.parse(await readFile(filePath, "utf8")) as ContractChunk[];
      const context = `ticker=${ticker} filingDate=${filingDate} file=${filePath}`;
      const filingKey = `${ticker}:${filingDate}`;
      const seenChunkIds = seenChunkIdsByFiling.get(filingKey) ?? new Set<string>();
      seenChunkIdsByFiling.set(filingKey, seenChunkIds);

      assert.ok(Array.isArray(chunks), `${context}: expected top-level JSON array`);
      assert.ok(chunks.length > 0, `${context}: expected at least one chunk`);

      chunks.forEach((chunk, index) => {
        const location = `${context} chunk[${index}]`;

        for (const field of requiredFields) {
          assert.ok(field in chunk, `${location}: missing required field "${field}"`);
          assert.equal(typeof chunk[field], "string", `${location}: field "${field}" must be a string`);
          assert.notEqual((chunk[field] as string).trim(), "", `${location}: field "${field}" must be non-empty`);
        }

        const chunkId = chunk.chunk_id as string;

        assert.ok(!seenChunkIds.has(chunkId), `${location}: duplicate chunk_id "${chunkId}"`);
        seenChunkIds.add(chunkId);
      });
    }
  });
});

async function findChunkFiles(): Promise<ChunkFileContext[]> {
  const dataDir = join(process.cwd(), "data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const chunkFiles: ChunkFileContext[] = [];

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
        const filingChunksDir = join(companyDir, "filings", filing.name, "chunks");
        const files = await readdir(filingChunksDir);
        chunkFiles.push(
          ...files
            .filter((fileName) => fileName.endsWith(".json"))
            .map((fileName) => ({
              ticker,
              filingDate,
              filePath: join(filingChunksDir, fileName),
            })),
        );
      }
    } catch {
      // Non-company data directories do not have filing outputs.
    }
  }

  return chunkFiles.sort((left, right) => left.filePath.localeCompare(right.filePath));
}
