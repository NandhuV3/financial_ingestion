import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Chunk } from "../../src/types/chunk.types.js";

type ContractChunk = Partial<Record<keyof Chunk, unknown>>;

const requiredFields = ["chunk_id", "company", "ticker", "filing_date", "form_type", "section", "text"] as const;

describe("chunk schema contract", () => {
  it("validates all data/{ticker}/chunks/*.json files", async () => {
    const chunkFiles = await findChunkFiles();

    assert.ok(chunkFiles.length > 0, "Expected at least one chunk JSON file in data/{ticker}/chunks");

    for (const filePath of chunkFiles) {
      const chunks = JSON.parse(await readFile(filePath, "utf8")) as ContractChunk[];
      const seenChunkIds = new Set<string>();

      assert.ok(Array.isArray(chunks), `${filePath}: expected top-level JSON array`);
      assert.ok(chunks.length > 0, `${filePath}: expected at least one chunk`);

      chunks.forEach((chunk, index) => {
        const location = `${filePath}[${index}]`;

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

async function findChunkFiles(): Promise<string[]> {
  const dataDir = join(process.cwd(), "data");
  const entries = await readdir(dataDir, { withFileTypes: true });
  const chunkFiles: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const chunksDir = join(dataDir, entry.name, "chunks");

    try {
      const files = await readdir(chunksDir);
      chunkFiles.push(...files.filter((fileName) => fileName.endsWith(".json")).map((fileName) => join(chunksDir, fileName)));
    } catch {
      // Non-company data directories do not have chunk outputs.
    }
  }

  return chunkFiles.sort();
}
