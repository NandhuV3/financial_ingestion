import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getStorageMode,
  shouldPersistChunkArtifacts,
  shouldPersistNormalizedArtifacts,
  shouldPersistProcessedArtifacts,
} from "../src/shared/config/storage-mode.js";
import { shouldPersistPath } from "../src/shared/config/storage-policy.js";
import { fileExists, readTextFile } from "../src/shared/filesystem/file-reader.js";
import { writeTextFile } from "../src/shared/filesystem/file-writer.js";

describe("storage policy", () => {
  it("defaults to development persistence", async () => {
    await withStorageMode(undefined, () => {
      assert.equal(getStorageMode(), "development");
      assert.equal(shouldPersistProcessedArtifacts(), true);
      assert.equal(shouldPersistNormalizedArtifacts(), true);
      assert.equal(shouldPersistChunkArtifacts(), true);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/processed/file.txt"), true);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/normalized/file.txt"), true);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/chunks/file.json"), true);
    });
  });

  it("skips production persistence for processed, normalized, and chunks paths", async () => {
    await withStorageMode("production", () => {
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/processed/file.txt"), false);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/normalized/file.txt"), false);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/chunks/file.json"), false);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/intelligence/themes.json"), true);
      assert.equal(shouldPersistPath("/tmp/company/filings/2026-01-01/reports/pipeline-summary.json"), true);
    });
  });

  it("keeps production-skipped artifacts readable in memory for same-run pipeline handoff", async () => {
    await withStorageMode("production", async () => {
      const root = await mkdtemp(join(tmpdir(), "storage-policy-"));
      const outputPath = join(root, "filings", "2026-01-01", "chunks", "management-discussion.chunks.json");

      await writeTextFile(outputPath, "in-memory chunks");

      assert.equal(existsSync(outputPath), false);
      assert.equal(fileExists(outputPath), true);
      assert.equal(await readTextFile(outputPath), "in-memory chunks");
    });
  });
});

async function withStorageMode<T>(
  mode: "production" | "development" | undefined,
  callback: () => T | Promise<T>,
): Promise<T> {
  const previous = process.env.STORAGE_MODE;

  if (mode === undefined) {
    delete process.env.STORAGE_MODE;
  } else {
    process.env.STORAGE_MODE = mode;
  }

  try {
    return await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.STORAGE_MODE;
    } else {
      process.env.STORAGE_MODE = previous;
    }
  }
}
